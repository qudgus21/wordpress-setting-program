const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

async function deleteBlog(credentials, instance, domain) {
  try {
    // SSH 연결 설정
    const ssh = new NodeSSH();
    const keyPath = path.join(process.env.HOME, '.ssh', 'instance-keypair.pem');

    if (!fs.existsSync(keyPath)) {
      throw new Error(`SSH 키 파일을 찾을 수 없습니다: ${keyPath}`);
    }

    const keyContent = fs.readFileSync(keyPath, 'utf8');

    // SSH 연결
    await ssh.connect({
      host: instance.publicIp,
      username: 'ubuntu',
      privateKey: keyContent,
      debug: false,
    });

    // 삭제 스크립트 실행
    const script = `#!/bin/bash

# MySQL 명령어 실행 함수
mysql_exec() {
    local query="\$1"
    MYSQL_PWD="\${DB_ROOT_PASS}" mysql -u root -e "\${query}" 2>/dev/null
}

# 도메인 설정
DOMAIN="${domain}"
SLUG=\${DOMAIN//./_}
DB_NAME="wp_\${SLUG}"
WEB_ROOT="/var/www/\${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/\${SLUG}"

# MySQL root 비밀번호 (정적으로 설정)
DB_ROOT_PASS="wordpress423!"

# 1. 웹 루트 디렉토리 삭제
if [ -d "\${WEB_ROOT}" ]; then
    echo "🗑️  웹 루트 디렉토리 삭제 중..."
    sudo chown -R ubuntu:ubuntu "\${WEB_ROOT}"
    sudo rm -rf "\${WEB_ROOT}"
fi

# 2. Nginx 설정 삭제
if [ -f "\${NGINX_CONF}" ]; then
    echo "🗑️  Nginx 설정 삭제 중..."
    sudo rm -f "\${NGINX_CONF}"
    sudo rm -f "/etc/nginx/sites-enabled/\${SLUG}"
    sudo nginx -t && sudo systemctl reload nginx
fi

# 3. 데이터베이스 삭제
echo "🗑️  데이터베이스 삭제 중..."
mysql_exec "DROP DATABASE IF EXISTS \${DB_NAME};"

echo "✅ 블로그 삭제 완료!"
`;

    // 스크립트를 임시 파일로 저장하고 실행
    console.log('스크립트 실행 시작...');
    const result = await ssh.execCommand(`
      echo '${script}' > /tmp/delete-wordpress.sh && \
      chmod +x /tmp/delete-wordpress.sh && \
      sudo /tmp/delete-wordpress.sh
    `);

    console.log('스크립트 실행 결과:', {
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
    });

    if (result.code !== 0) {
      throw new Error(`블로그 삭제 실패: ${result.stderr || result.stdout}`);
    }

    // SSH 연결 종료
    ssh.dispose();

    return { success: true };
  } catch (error) {
    console.error('블로그 삭제 중 오류 발생:', error);
    throw error;
  }
}

module.exports = deleteBlog;

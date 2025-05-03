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

    // SSH 연결 시도 (최대 3번)
    let connected = false;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 5000; // 5초

    while (!connected && retryCount < maxRetries) {
      try {
        console.log(`SSH 연결 시도 중... (${retryCount + 1}/${maxRetries})`);
        await ssh.connect({
          host: instance.publicIp,
          username: 'ubuntu',
          privateKey: keyContent,
          debug: false,
          readyTimeout: 30000, // 30초 타임아웃
          keepaliveInterval: 10000, // 10초마다 keepalive 패킷 전송
          keepaliveCountMax: 3, // 3번의 keepalive 실패 후 연결 종료
        });
        connected = true;
        console.log('SSH 연결 성공');
      } catch (error) {
        retryCount++;
        console.error(`SSH 연결 실패 (시도 ${retryCount}/${maxRetries}):`, error.message);
        if (retryCount < maxRetries) {
          console.log(`${retryDelay / 1000}초 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          throw new Error(`SSH 연결 실패: ${error.message}`);
        }
      }
    }

    // 삭제 스크립트 실행
    const script = `#!/bin/bash

# 변수 정의
DOMAIN="${domain}"
WEB_ROOT="/var/www/${domain}"
DB_NAME="wp_${domain.replace(/\./g, '_')}"

# 웹 루트 디렉토리 삭제
if [ -d "\${WEB_ROOT}" ]; then
    sudo rm -rf \${WEB_ROOT}
    echo "웹 루트 디렉토리 삭제 완료: \${WEB_ROOT}"
fi

# Nginx 설정 삭제
if [ -f "/etc/nginx/sites-enabled/\${DOMAIN}" ]; then
    sudo rm -f /etc/nginx/sites-enabled/\${DOMAIN}
    echo "Nginx 설정 링크 삭제 완료"
fi

if [ -f "/etc/nginx/sites-available/\${DOMAIN}" ]; then
    sudo rm -f /etc/nginx/sites-available/\${DOMAIN}
    echo "Nginx 설정 파일 삭제 완료"
fi

# DB 삭제
if sudo mysql -u root -p'wordpress423!' -e "SHOW DATABASES LIKE '\${DB_NAME}';" | grep -q "\${DB_NAME}"; then
    sudo mysql -u root -p'wordpress423!' -e "DROP DATABASE IF EXISTS \${DB_NAME};"
    echo "데이터베이스 삭제 완료: \${DB_NAME}"
else
    echo "데이터베이스 없음: \${DB_NAME}"
fi

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx
echo "Nginx 재시작 완료"

echo "모든 리소스 삭제가 완료되었습니다."
`;

    // 스크립트를 임시 파일로 저장하고 실행
    console.log('삭제 스크립트 실행 시작...');
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
      throw new Error(`워드프레스 삭제 실패: ${result.stderr || result.stdout}`);
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

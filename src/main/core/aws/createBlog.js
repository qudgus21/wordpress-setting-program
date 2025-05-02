const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

async function createBlog(credentials, instance, domain) {
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

    // 워드프레스 설치 스크립트 실행
    const script = `#!/bin/bash

# 설치 진행 상황 저장
INSTALL_LOG="/tmp/wordpress_install.log"
touch "\${INSTALL_LOG}"

# MySQL 명령어 실행 함수
mysql_exec() {
    local query="\$1"
    MYSQL_PWD="\${DB_ROOT_PASS}" mysql -u root -e "\${query}" 2>/dev/null
}

# 중복 체크 함수
check_duplicate() {
    echo "🔍 설치 상태 확인 중..."
    
    DB_EXISTS=\$(mysql_exec "SHOW DATABASES LIKE '\${DB_NAME}';" | grep -c "\${DB_NAME}")
    if [ -d "\${WEB_ROOT}" ] || [ -f "\${NGINX_CONF}" ] || [ "\${DB_EXISTS}" -gt 0 ]; then
        echo "❌ 중복 설치 감지: \${DOMAIN}"
        echo "이미 해당 도메인으로 설치된 워드프레스가 존재합니다."
        echo "다른 도메인을 선택하거나, 기존 설치를 삭제한 후 다시 시도해주세요."
        exit 1
    fi
}

# 에러 발생 시 롤백을 위한 함수
rollback() {
    echo "⚠️  롤백 시작..."
    
    # 설치 로그 확인
    if [ -f "\${INSTALL_LOG}" ]; then
        LAST_STEP=\$(tail -n 1 "\${INSTALL_LOG}")
        echo "마지막 완료된 단계: \${LAST_STEP}"
    fi
    
    # 1. 웹 루트 디렉토리 삭제
    if [ -d "\${WEB_ROOT}" ]; then
        echo "🗑️  웹 루트 디렉토리 삭제 중..."
        sudo rm -rf "\${WEB_ROOT}"
    fi
    
    # 2. 데이터베이스 삭제
    echo "🗑️  데이터베이스 삭제 중..."
    mysql_exec "DROP DATABASE IF EXISTS \${DB_NAME};"
    
    # 3. Nginx 설정 삭제
    if [ -f "\${NGINX_CONF}" ]; then
        echo "🗑️  Nginx 설정 삭제 중..."
        sudo rm -f "\${NGINX_CONF}"
        sudo rm -f "/etc/nginx/sites-enabled/\${SLUG}"
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    # 4. 설치 로그 삭제
    rm -f "\${INSTALL_LOG}"
    
    echo "✅ 롤백 완료"
    exit 1
}

# 에러 발생 시 롤백 실행
trap rollback ERR

# 1. 도메인 입력 (정적으로 설정)
DOMAIN="${domain}"
SLUG=\${DOMAIN//./_}
DB_NAME="wp_\${SLUG}"
WEB_ROOT="/var/www/\${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/\${SLUG}"

# 2. 중복 확인
check_duplicate

# 3. MySQL root 비밀번호 (정적으로 설정)
DB_ROOT_PASS="wordpress423!"

# 4. 워드프레스 다운로드 및 디렉토리 생성
echo "📥 워드프레스 다운로드 중..."
sudo mkdir -p "\${WEB_ROOT}"
sudo wget -q https://wordpress.org/latest.zip -O /tmp/latest.zip
sudo unzip -q /tmp/latest.zip -d /tmp/
sudo mv /tmp/wordpress/* "\${WEB_ROOT}"
sudo rm -rf /tmp/latest.zip /tmp/wordpress
echo "wordpress_downloaded" > "\${INSTALL_LOG}"

# 5. DB 생성
echo "🗄️  데이터베이스 생성 중..."
mysql_exec "CREATE DATABASE IF NOT EXISTS \${DB_NAME} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "database_created" > "\${INSTALL_LOG}"

# 6. wp-config.php 설정
echo "⚙️  wp-config.php 설정 중..."
cd "\${WEB_ROOT}"
sudo cp wp-config-sample.php wp-config.php
sudo sed -i "s/database_name_here/\${DB_NAME}/" wp-config.php
sudo sed -i "s/username_here/root/" wp-config.php
sudo sed -i "s/password_here/\${DB_ROOT_PASS}/" wp-config.php

# 보안 키 설정
if ! grep -q "AUTH_KEY" wp-config.php; then
    AUTH_KEYS=\$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
    echo "\${AUTH_KEYS}" | sudo tee -a wp-config.php > /dev/null
fi
echo "wp_config_created" > "\${INSTALL_LOG}"

# 7. 권한 설정
echo "🔒 파일 권한 설정 중..."
sudo chown -R www-data:www-data "\${WEB_ROOT}"
sudo find "\${WEB_ROOT}" -type d -exec chmod 755 {} \\;
sudo find "\${WEB_ROOT}" -type f -exec chmod 644 {} \\;
echo "permissions_set" > "\${INSTALL_LOG}"

# 8. Nginx 설정
echo "🌐 Nginx 설정 중..."
sudo bash -c "cat > \${NGINX_CONF}" <<EOF
server {
    listen 80;
    server_name \$DOMAIN www.\$DOMAIN;

    root \$WEB_ROOT;
    index index.php index.html index.htm;

    # Redirect www to non-www
    if (\$host ~* ^www\.(.*)\$) {
        return 301 \$scheme://\$1\$request_uri;
    }

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \\.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
    }

    location ~ /\\.ht {
        deny all;
    }
}
EOF

# 기존 심볼릭 링크가 있으면 제거
if [ -L "/etc/nginx/sites-enabled/\${SLUG}" ]; then
    echo "🗑️  기존 Nginx 심볼릭 링크 제거 중..."
    sudo rm -f "/etc/nginx/sites-enabled/\${SLUG}"
fi

# 새로운 심볼릭 링크 생성
echo "🔗 Nginx 심볼릭 링크 생성 중..."
sudo ln -sf \${NGINX_CONF} "/etc/nginx/sites-enabled/\${SLUG}"

# Nginx 설정 테스트 및 재시작
echo "🔄 Nginx 설정 테스트 중..."
if sudo nginx -t; then
    echo "🔄 Nginx 재시작 중..."
    sudo systemctl reload nginx
else
    echo "❌ Nginx 설정 테스트 실패"
    exit 1
fi

echo "nginx_configured" > "\${INSTALL_LOG}"

# 9. SSL 발급
echo "🔐 SSL 인증서 발급 중..."
sudo certbot --nginx -d \${DOMAIN} -d www.\${DOMAIN} --non-interactive --agree-tos -m admin@\${DOMAIN}
echo "ssl_issued" > "\${INSTALL_LOG}"

# 설치 로그 삭제
rm -f "\${INSTALL_LOG}"

echo "✅ 워드프레스 설치 완료!"
`;

    // 스크립트를 임시 파일로 저장하고 실행
    console.log('스크립트 실행 시작...');
    const result = await ssh.execCommand(`
      echo '${script}' > /tmp/setup-wordpress.sh && \
      chmod +x /tmp/setup-wordpress.sh && \
      sudo /tmp/setup-wordpress.sh
    `);

    console.log('스크립트 실행 결과:', {
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
    });

    if (result.code !== 0) {
      // 중복 설치 에러인 경우 특별 처리
      if (result.stdout.includes('중복 설치 감지')) {
        throw new Error(
          `이미 ${domain} 도메인으로 설치된 워드프레스가 존재합니다. 다른 도메인을 선택하거나, 기존 설치를 삭제한 후 다시 시도해주세요.`
        );
      }
      throw new Error(`워드프레스 설치 실패: ${result.stderr || result.stdout}`);
    }

    // SSH 연결 종료
    ssh.dispose();

    return { success: true };
  } catch (error) {
    console.error('블로그 생성 중 오류 발생:', error);
    throw error; // 원래 에러를 그대로 전달
  }
}

module.exports = createBlog;

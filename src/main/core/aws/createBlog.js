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

    const dbName = `wp_${domain.replace(/\./g, '_')}`;
    const dbUser = 'root';
    const dbPass = 'wordpress423!';
    // 워드프레스 설치 스크립트 실행
    const script = `#!/bin/bash
    

# 변수 정의
DOMAIN="${domain}"
WEB_ROOT="/var/www/${domain}"
DB_NAME="${dbName}"
DB_USER="root"
DB_PASS="wordpress423!"
EMAIL="qudgus4231@gmail.com"

# 중복 설치 체크
if [ -d "\${WEB_ROOT}" ]; then
    echo "중복 설치 감지: \${DOMAIN} 도메인은 이미 설치되어 있습니다."
    exit 1
fi

if [ -f "/etc/nginx/sites-enabled/\${DOMAIN}" ]; then
    echo "중복 설치 감지: \${DOMAIN} 도메인의 Nginx 설정이 이미 존재합니다."
    exit 1
fi

if sudo mysql -e "SHOW DATABASES LIKE '\${DB_NAME}';" | grep -q "\${DB_NAME}"; then
    echo "중복 설치 감지: \${DOMAIN} 도메인의 데이터베이스가 이미 존재합니다."
    exit 1
fi

# 필요한 패키지 설치
sudo apt-get update
sudo apt-get install -y nginx mysql-server php-fpm php-mysql php-curl php-gd php-intl php-mbstring php-soap php-xml php-xmlrpc php-zip php-imagick php-cli unzip certbot python3-certbot-nginx

echo "📌 MySQL 사용자 인증 방식 변경 시작"
echo "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '\\'${dbPass}\\''; FLUSH PRIVILEGES;" | sudo mysql 2>&1 | tee /tmp/mysql-init.log
echo "📌 MySQL 인증 방식 변경 로그:"
cat /tmp/mysql-init.log

echo "CREATE DATABASE IF NOT EXISTS \${DB_NAME};" | mysql -u root -p'${dbPass}' 2>&1 | tee /tmp/mysql-create-db.log


# 웹 루트 디렉토리 생성 및 권한 설정
sudo mkdir -p \${WEB_ROOT}
sudo chown -R www-data:www-data \${WEB_ROOT}
sudo chmod -R 755 \${WEB_ROOT}

# WordPress 다운로드 및 설치
cd \${WEB_ROOT}
sudo -u www-data wget https://wordpress.org/latest.tar.gz
sudo -u www-data tar -xzf latest.tar.gz
sudo -u www-data mv wordpress/* .
sudo -u www-data rm -rf wordpress latest.tar.gz

# wp-config.php 복사 (웹 서버 권한 유지)
sudo -u www-data cp wp-config-sample.php wp-config.php

# 권한 변경 (이후 sed 작업은 root 또는 ubuntu 유저가 하기 위함)
sudo chown ubuntu:ubuntu wp-config.php

# 내용 치환
sed -i "s/database_name_here/${dbName}/" wp-config.php
sed -i "s/username_here/${dbUser}/" wp-config.php
sed -i "s/password_here/${dbPass}/" wp-config.php

# 권한 복구
sudo chown www-data:www-data wp-config.php

# Nginx 설정
cat << 'EOF' | sudo tee /etc/nginx/sites-available/\${DOMAIN}
server {
    listen 80;
    server_name \${DOMAIN} www.\${DOMAIN};
    root \${WEB_ROOT};
    index index.php index.html index.htm;

    location / {
        try_files \\$uri \\$uri/ /index.php?\\$args;
    }

    location ~ \\.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/\${DOMAIN} /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# SSL 인증서 발급
sudo certbot --nginx -d \${DOMAIN} -d www.\${DOMAIN} --non-interactive --agree-tos --email \${EMAIL} --redirect

# PHP-FPM 재시작
sudo systemctl restart php8.1-fpm

# WordPress 설치 완료
echo "WordPress 설치가 완료되었습니다. https://\${DOMAIN} 에서 확인하세요."
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

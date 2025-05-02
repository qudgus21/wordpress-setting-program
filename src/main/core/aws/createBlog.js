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

    // 변수 정의
    const slug = domain.replace(/\./g, '_');
    const dbName = `wp_${slug}`;
    const webRoot = `/var/www/${domain}`;
    const nginxConf = `/etc/nginx/sites-available/${domain}`;

    // 워드프레스 설치 스크립트 실행
    const script = `#!/bin/bash

# 상수 정의
INSTALL_LOG="/tmp/wordpress_install.log"
MYSQL_PASS="wordpress423!"

# 도메인 설정
DOMAIN="${domain}"
SLUG="${slug}"
DB_NAME="${dbName}"
WEB_ROOT="${webRoot}"
NGINX_CONF="${nginxConf}"

# 설치 진행 상황 저장
touch "\$INSTALL_LOG"

# MySQL 명령어 실행 함수
mysql_exec() {
    # 쿼리를 직접 실행
    sudo MYSQL_PWD="\$MYSQL_PASS" mysql -u root -e "\$1" 2>/dev/null
}

# MySQL 접근 권한 확인 함수
check_mysql_access() {
    echo "🔍 MySQL 접근 권한 확인 중..."
    if ! sudo MYSQL_PWD="\$MYSQL_PASS" mysql -u root -e "SELECT 1;" > /dev/null; then
        echo "❌ MySQL 접근 권한 오류"
        echo "MySQL root 사용자의 접근 권한을 확인해주세요."
        exit 1
    fi
    echo "✅ MySQL 접근 권한 확인 완료"
}

# 중복 체크 함수
check_duplicate() {
    echo "🔍 설치 상태 확인 중..."
    
    local db_exists
    db_exists=\$(sudo MYSQL_PWD="\$MYSQL_PASS" mysql -u root -e "SHOW DATABASES LIKE '\\\`\$DB_NAME\\\`';" | grep -c "\$DB_NAME")
    if [ -d "\$WEB_ROOT" ] || [ -f "\$NGINX_CONF" ] || [ "\$db_exists" -gt 0 ]; then
        echo "❌ 중복 설치 감지: \$DOMAIN"
        echo "이미 해당 도메인으로 설치된 워드프레스가 존재합니다."
        echo "다른 도메인을 선택하거나, 기존 설치를 삭제한 후 다시 시도해주세요."
        exit 1
    fi
}

# 에러 발생 시 롤백을 위한 함수
rollback() {
    echo "⚠️  롤백 시작..."
    
    # 설치 로그 확인
    if [ -f "$INSTALL_LOG" ]; then
        local last_step
        last_step=$(tail -n 1 "$INSTALL_LOG")
        echo "마지막 완료된 단계: $last_step"
    fi
    
    # 1. 웹 루트 디렉토리 삭제
    if [ -d "${webRoot}" ]; then
        echo "🗑️  웹 루트 디렉토리 삭제 중..."
        sudo rm -rf "${webRoot}"
    fi
    
    # 2. 데이터베이스 삭제
    echo "🗑️  데이터베이스 삭제 중..."
    sudo MYSQL_PWD="$MYSQL_PASS" mysql -u root -e "DROP DATABASE IF EXISTS ${dbName};"
    
    # 3. Nginx 설정 삭제
    if [ -f "${nginxConf}" ]; then
        echo "🗑️  Nginx 설정 삭제 중..."
        sudo rm -f "${nginxConf}"
        sudo rm -f "/etc/nginx/sites-enabled/${domain}"
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    # 4. 설치 로그 삭제
    rm -f "$INSTALL_LOG"
    
    echo "✅ 롤백 완료"
    exit 1
}

# 에러 발생 시 롤백 실행
trap rollback ERR

# 1. 중복 확인
check_duplicate

# 2. MySQL 접근 권한 확인
check_mysql_access

# 3. 워드프레스 다운로드 및 디렉토리 생성
echo "📥 워드프레스 다운로드 중..."
sudo mkdir -p "${webRoot}"
sudo wget -q https://wordpress.org/latest.zip -O /tmp/latest.zip
sudo unzip -q /tmp/latest.zip -d /tmp/
sudo mv /tmp/wordpress/* "${webRoot}"
sudo rm -rf /tmp/latest.zip /tmp/wordpress
echo "wordpress_downloaded" > "$INSTALL_LOG"

# 4. DB 생성
echo "🗄️  데이터베이스 생성 중..."
sudo MYSQL_PWD="\$MYSQL_PASS" mysql -u root -e "CREATE DATABASE IF NOT EXISTS \\\`\$DB_NAME\\\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "database_created" > "\$INSTALL_LOG"

# 5. wp-config.php 설정
echo "⚙️  wp-config.php 설정 중..."
cd "${webRoot}"
sudo cp wp-config-sample.php wp-config.php
sudo sed -i "s/database_name_here/${dbName}/" wp-config.php
sudo sed -i "s/username_here/root/" wp-config.php
sudo sed -i "s/password_here/$MYSQL_PASS/" wp-config.php

# 보안 키 설정
if ! grep -q "AUTH_KEY" wp-config.php; then
    local auth_keys
    auth_keys=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
    echo "$auth_keys" | sudo tee -a wp-config.php > /dev/null
fi
echo "wp_config_created" > "$INSTALL_LOG"

# 6. 권한 설정
echo "🔒 파일 권한 설정 중..."
sudo chown -R www-data:www-data "${webRoot}"
sudo find "${webRoot}" -type d -exec chmod 755 {} \\;
sudo find "${webRoot}" -type f -exec chmod 644 {} \\;
echo "permissions_set" > "$INSTALL_LOG"

# 7. Nginx 설정
echo "🌐 Nginx 설정 중..."
sudo bash -c "cat > \$NGINX_CONF" <<'EOF'
server {
    listen 80;
    server_name \$DOMAIN www.\$DOMAIN;
    root \$WEB_ROOT;
    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

# 기존 심볼릭 링크가 있으면 제거
if [ -L "/etc/nginx/sites-enabled/${domain}" ]; then
    echo "🗑️  기존 Nginx 심볼릭 링크 제거 중..."
    sudo rm -f "/etc/nginx/sites-enabled/${domain}"
fi

# 새로운 심볼릭 링크 생성
echo "🔗 Nginx 심볼릭 링크 생성 중..."
sudo ln -sf ${nginxConf} "/etc/nginx/sites-enabled/${domain}"

# Nginx 설정 테스트 및 재시작
echo "🔄 Nginx 설정 테스트 중..."
if sudo nginx -t; then
    echo "🔄 Nginx 재시작 중..."
    sudo systemctl reload nginx
else
    echo "❌ Nginx 설정 테스트 실패"
    exit 1
fi

echo "nginx_configured" > "$INSTALL_LOG"

# 8. SSL 발급
echo "🔐 SSL 인증서 발급 중..."
sudo certbot --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos -m admin@${domain}
echo "ssl_issued" > "$INSTALL_LOG"

# 설치 로그 삭제
rm -f "$INSTALL_LOG"

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

#!/bin/bash

# echo "실행전 권한 부여 했어? chmod +x setup-wordpress.sh"
# sudo ./setup-wordpress.sh

# 1. 도메인 입력
read -p "🌐 도메인을 입력하세요: " DOMAIN
if [ -z "$DOMAIN" ]; then
  echo "❌ 도메인을 입력해야 합니다."
  exit 1
fi

SLUG=${DOMAIN//./_}
DB_NAME="wp_${SLUG}"
WEB_ROOT="/var/www/$DOMAIN"
NGINX_CONF="/etc/nginx/sites-available/$SLUG"

# 2. 중복 확인
if [ -d "$WEB_ROOT" ]; then
  echo "⚠️  이미 $DOMAIN 사이트가 존재합니다. 중복 설치를 방지합니다."
  exit 1
fi

# 3. MySQL root 비밀번호 입력
read -s -p "🔐 MySQL root 비밀번호를 입력하세요: " DB_ROOT_PASS
echo ""

echo "✅ 설치 준비 완료: $DOMAIN"
echo "-----------------------------------------------------"

# 4. 워드프레스 다운로드 및 디렉토리 생성
echo "📦 워드프레스 다운로드 및 파일 구성 중..."
sudo mkdir -p "$WEB_ROOT"
sudo wget -q https://wordpress.org/latest.zip -O /tmp/latest.zip
sudo unzip -q /tmp/latest.zip -d /tmp/
sudo mv /tmp/wordpress/* "$WEB_ROOT"
sudo rm -rf /tmp/latest.zip /tmp/wordpress

# 5. DB 생성
echo "🗃️  데이터베이스 생성 중... (DB 이름: $DB_NAME)"
sudo mysql -u root -p"$DB_ROOT_PASS" -e "CREATE DATABASE IF NOT EXISTS \$DB_NAME\ DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 6. wp-config.php 설정
echo "⚙️  wp-config.php 구성 중..."
cd "$WEB_ROOT"
sudo cp wp-config-sample.php wp-config.php
sudo sed -i "s/database_name_here/$DB_NAME/" wp-config.php
sudo sed -i "s/username_here/root/" wp-config.php
sudo sed -i "s/password_here/$DB_ROOT_PASS/" wp-config.php

# 보안 키 설정
if ! grep -q "AUTH_KEY" wp-config.php; then
  echo "🔐 보안 키 생성 중..."
  AUTH_KEYS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
  echo "$AUTH_KEYS" | sudo tee -a wp-config.php > /dev/null
else
  echo "✅ 보안 키가 이미 존재합니다. 건너뜁니다."
fi

# 7. 권한 설정
echo "🛠️  파일 권한 설정 중..."
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo find "$WEB_ROOT" -type d -exec chmod 755 {} \;
sudo find "$WEB_ROOT" -type f -exec chmod 644 {} \;

# 8. Nginx 설정
echo "📁 Nginx 서버 블록 생성 중..."
sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $WEB_ROOT;
    index index.php index.html index.htm;

    # Redirect www to non-www
    if (\$host = www.$DOMAIN) {
        return 301 \$scheme://$DOMAIN\$request_uri;
    }

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 9. SSL 발급
echo "🔒 SSL 인증서 발급 중 (Let's Encrypt)..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# 10. 완료 안내
echo ""
echo "🎉 워드프레스 사이트 설정 완료!"
echo "🌐 URL: https://$DOMAIN"
echo "🛠  DB 이름: $DB_NAME"
echo "📁 디렉토리: $WEB_ROOT"
echo "🔐 DB 사용자: root (입력한 비밀번호 사용)"
echo "🚀 브라우저에서 접속하여 워드프레스 설치 마법사를 완료하세요!"
echo "-----------------------------------------------------"
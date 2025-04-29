#!/bin/bash

# echo "실행전 권한 부여 했어? chmod +x init-ubuntu-server.sh"
# sudo ./init-ubuntu-server.sh

echo "✅ Ubuntu EC2 초기 세팅 시작..."

# 시스템 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# Nginx, PHP, MySQL 설치
sudo apt install nginx mysql-server php-fpm php-mysql unzip curl -y
sudo apt install php-curl php-gd php-mbstring php-xml php-xmlrpc php-soap php-intl php-zip -y

# Certbot 설치 (SSL 발급용)
sudo apt install certbot python3-certbot-nginx -y

# Nginx 시작 및 부팅 시 자동 실행 설정
sudo systemctl start nginx
sudo systemctl enable nginx

echo "🎉 초기 세팅 완료!"
echo "- Nginx, PHP, MySQL, Certbot 설치 완료"
echo "- 이제 워드프레스 사이트를 추가할 수 있어요 🚀"

# MySQL root 비밀번호 입력 받기
echo ""
read -s -p "🔐 설정할 MySQL root 비밀번호를 입력하세요: " MYSQL_ROOT_PASSWORD
echo ""
read -s -p "🔐 다시 한 번 비밀번호를 입력하세요: " MYSQL_ROOT_PASSWORD_CONFIRM
echo ""

# 비밀번호 확인
if [ "$MYSQL_ROOT_PASSWORD" != "$MYSQL_ROOT_PASSWORD_CONFIRM" ]; then
  echo "❌ 비밀번호가 일치하지 않습니다. 스크립트를 다시 실행해주세요."
  exit 1
fi

# MySQL root 비밀번호 설정
echo "✅ MySQL root 비밀번호 설정 중..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}'; FLUSH PRIVILEGES;"
echo "✅ MySQL 비밀번호 설정 완료!"
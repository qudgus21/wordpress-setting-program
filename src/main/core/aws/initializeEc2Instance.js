const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

async function waitForInstanceRunning(ec2Client, instanceId) {
  let attempts = 0;
  const maxAttempts = 30; // 최대 5분 (10초 * 30)

  while (attempts < maxAttempts) {
    const describeCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });
    const response = await ec2Client.send(describeCommand);
    const instance = response.Reservations[0].Instances[0];

    if (instance.State.Name === 'running') {
      console.log('인스턴스가 running 상태입니다. 시스템 초기화를 위해 30초 더 대기합니다...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30초 추가 대기
      return instance;
    }

    console.log(`인스턴스 상태: ${instance.State.Name}, 대기 중... (${attempts + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
    attempts++;
  }

  throw new Error('인스턴스가 running 상태가 되지 않았습니다.');
}

async function initializeEc2Instance(instanceId, credentials) {
  const ec2Client = new EC2Client({
    region: 'ap-northeast-2',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  try {
    // 1. 인스턴스가 running 상태가 될 때까지 대기
    console.log('인스턴스가 running 상태가 될 때까지 대기 중...');
    const instance = await waitForInstanceRunning(ec2Client, instanceId);

    if (!instance.PublicIpAddress) {
      throw new Error('인스턴스의 퍼블릭 IP를 찾을 수 없습니다.');
    }

    // 2. SSH 연결
    const ssh = new NodeSSH();
    const keyPath = path.join(process.env.HOME, '.ssh', 'instance-keypair.pem');
    console.log('키 파일 경로:', keyPath);
    console.log('HOME 환경 변수:', process.env.HOME);
    console.log('키 파일 존재 여부:', fs.existsSync(keyPath));

    // 키 파일 내용 확인
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    console.log('키 파일 내용 시작:', keyContent.substring(0, 50));
    console.log('키 파일 내용 끝:', keyContent.substring(keyContent.length - 50));

    if (!fs.existsSync(keyPath)) {
      throw new Error(`SSH 키 파일을 찾을 수 없습니다: ${keyPath}\n키 파일이 올바른 위치에 있는지 확인해주세요.`);
    }

    console.log('SSH 연결 정보:');
    console.log('- 호스트:', instance.PublicIpAddress);
    console.log('- 사용자:', 'ubuntu');
    console.log('- 키 파일:', keyPath);
    console.log('SSH 연결 시도 중...');

    await ssh.connect({
      host: instance.PublicIpAddress,
      username: 'ubuntu',
      privateKey: keyContent,
      debug: false, // 디버그 모드 비활성화
    });
    console.log('SSH 연결 성공');

    // 3. 초기화 스크립트 생성 및 실행
    const scriptPath = '/tmp/initialize.sh';
    const scriptContent = `
#!/bin/bash

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

# MySQL root 비밀번호 설정
echo "✅ MySQL root 비밀번호 설정 중..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'wordpress423!'; FLUSH PRIVILEGES;"
echo "✅ MySQL 비밀번호 설정 완료!"

echo "🎉 초기 세팅 완료!"
echo "- Nginx, PHP, MySQL, Certbot 설치 완료"
echo "- MySQL root 비밀번호: wordpress423!"
echo "- 이제 워드프레스 사이트를 추가할 수 있어요 🚀"
`;

    console.log('초기화 스크립트 생성 중...');
    await ssh.execCommand(`echo '${scriptContent}' > ${scriptPath}`);
    await ssh.execCommand(`chmod +x ${scriptPath}`);

    console.log('초기화 스크립트 실행 중...');
    const { stdout, stderr } = await ssh.execCommand(`bash ${scriptPath}`);
    console.log('스크립트 출력:', stdout);
    if (stderr) console.error('스크립트 오류:', stderr);

    // 스크립트 파일 삭제
    console.log('초기화 스크립트 파일 삭제 중...');
    await ssh.execCommand(`rm ${scriptPath}`);
    console.log('초기화 스크립트 파일 삭제 완료');

    // 4. SSH 연결 종료
    ssh.dispose();
    console.log('SSH 연결 종료');

    return {
      instanceId: instance.InstanceId,
      state: 'running',
      publicIp: instance.PublicIpAddress,
      type: instance.InstanceType,
      name: instance.Tags?.find(tag => tag.Key === 'Name')?.Value || `instance-${instanceId.slice(-8)}`,
    };
  } catch (error) {
    console.error('인스턴스 초기화 중 오류:', error);
    throw error;
  }
}

module.exports = initializeEc2Instance;

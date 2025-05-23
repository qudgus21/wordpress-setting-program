const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function getUsernameByImageId(imageId) {
  // Ubuntu AMI인 경우
  if (imageId.includes('ubuntu') || imageId.includes('ami-0')) {
    return 'ubuntu';
  }
  // Amazon Linux 2 AMI인 경우
  if (imageId.includes('amzn2')) {
    return 'ec2-user';
  }
  // 기본값
  return 'ec2-user';
}

async function getDomainCount(instanceIp, keyName, imageId) {
  const keyPath = path.join(process.env.HOME, '.ssh', `${keyName}.pem`);
  const username = getUsernameByImageId(imageId);

  // 키 파일 존재 여부 확인
  if (!fs.existsSync(keyPath)) {
    console.log(`인스턴스 ${instanceIp}의 키 파일이 존재하지 않습니다: ${keyPath}`);
    return { count: 0, domains: [] };
  }

  // 키 파일 권한 확인 및 설정
  try {
    const stats = fs.statSync(keyPath);
    const currentMode = stats.mode & 0o777;

    if (currentMode !== 0o400) {
      fs.chmodSync(keyPath, 0o400);
    }

    // 키 파일 내용 확인 및 정리
    let keyContent = fs.readFileSync(keyPath, 'utf8');
    keyContent = keyContent.trim();

    if (!keyContent.endsWith('-----END RSA PRIVATE KEY-----')) {
      keyContent = keyContent.replace(/[^a-zA-Z0-9\+\/\=\n\-]/g, '');
      keyContent = keyContent.trim();
      fs.writeFileSync(keyPath, keyContent, { mode: 0o400 });
    }

    // 키 파일의 시작과 끝 확인
    const hasBegin = keyContent.includes('-----BEGIN RSA PRIVATE KEY-----');
    const hasEnd = keyContent.includes('-----END RSA PRIVATE KEY-----');

    if (!hasBegin || !hasEnd) {
      console.error(`인스턴스 ${instanceIp}의 키 파일이 올바른 형식이 아닙니다.`);
      return { count: 0, domains: [] };
    }
  } catch (error) {
    console.error(`인스턴스 ${instanceIp}의 키 파일 확인 중 오류:`, error);
    return { count: 0, domains: [] };
  }

  return new Promise(resolve => {
    // Nginx 설치 여부 확인
    const checkNginxCommand = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${username}@${instanceIp} "which nginx || echo 'nginx not found'"`;

    exec(checkNginxCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`인스턴스 ${instanceIp}의 Nginx 확인 중 오류:`, error);
        resolve({ count: 0, domains: [] });
        return;
      }

      if (stdout.includes('nginx not found')) {
        console.log(`인스턴스 ${instanceIp}에 Nginx가 설치되어 있지 않습니다.`);
        resolve({ count: 0, domains: [] });
        return;
      }

      // Nginx 설정 파일 확인
      const command = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${username}@${instanceIp} "ls -1 /etc/nginx/sites-available/ 2>/dev/null | grep -v '^default$'"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          if (stderr.includes('Operation timed out')) {
            console.log(`인스턴스 ${instanceIp}에 연결할 수 없습니다 (시간 초과)`);
          } else if (stderr.includes('Connection refused')) {
            console.log(`인스턴스 ${instanceIp}의 SSH 포트가 닫혀있습니다`);
          } else if (stderr.includes('Permission denied')) {
            console.log(`인스턴스 ${instanceIp}에 대한 키 인증이 실패했습니다 (사용자: ${username})`);

            // Ubuntu 인스턴스인 경우 사용자 이름을 강제로 ubuntu로 변경하여 재시도
            if (imageId.includes('ubuntu') || imageId.includes('ami-0')) {
              const retryCommand = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@${instanceIp} "ls -1 /etc/nginx/sites-available/ 2>/dev/null | grep -v '^default$'"`;

              exec(retryCommand, (retryError, retryStdout, retryStderr) => {
                if (retryError) {
                  console.log(`인스턴스 ${instanceIp}의 도메인 목록 조회 실패`);
                  resolve({ count: 0, domains: [] });
                  return;
                }
                const domains = retryStdout
                  .trim()
                  .split('\n')
                  .filter(domain => domain);
                console.log(`인스턴스 ${instanceIp}의 도메인 목록:`, domains);
                resolve({ count: domains.length, domains });
              });
              return;
            }
          } else {
            console.error(`인스턴스 ${instanceIp}의 SSH 실행 중 오류:`, error);
          }
          resolve({ count: 0, domains: [] });
          return;
        }

        const domains = stdout
          .trim()
          .split('\n')
          .filter(domain => domain);
        console.log(`인스턴스 ${instanceIp}의 도메인 목록:`, domains);
        resolve({ count: domains.length, domains });
      });
    });
  });
}

async function getDomainCounts(instances) {
  // running 상태이고 public IP가 있는 인스턴스만 필터링
  const runningInstances = instances.filter(instance => instance.state === 'running' && instance.publicIp !== 'N/A');

  console.log(
    '도메인 목록을 조회할 인스턴스:',
    runningInstances.map(inst => ({ id: inst.id, ip: inst.publicIp }))
  );

  // 병렬로 도메인 개수 조회
  const domainCounts = await Promise.all(
    runningInstances.map(async instance => {
      try {
        const result = await getDomainCount(instance.publicIp, instance.keyName, instance.imageId);
        console.log(`인스턴스 ${instance.id} (${instance.publicIp})의 도메인 정보:`, {
          count: result.count,
          domains: result.domains,
        });
        return {
          ...instance,
          domainCount: result.count,
          domains: result.domains,
        };
      } catch (error) {
        console.error(`인스턴스 ${instance.publicIp}의 도메인 카운트 조회 중 오류:`, error);
        return {
          ...instance,
          domainCount: 0,
          domains: [],
        };
      }
    })
  );

  // 도메인 개수가 추가된 인스턴스와 그렇지 않은 인스턴스 합치기
  const domainCountMap = new Map(domainCounts.map(instance => [instance.id, instance.domainCount]));
  const domainsMap = new Map(domainCounts.map(instance => [instance.id, instance.domains]));

  const result = instances.map(instance => ({
    ...instance,
    domainCount: domainCountMap.get(instance.id) || 0,
    domains: domainsMap.get(instance.id) || [],
  }));

  console.log(
    '최종 도메인 정보:',
    result.map(inst => ({
      id: inst.id,
      ip: inst.publicIp,
      count: inst.domainCount,
      domains: inst.domains,
    }))
  );

  return result;
}

module.exports = getDomainCounts;

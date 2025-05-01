const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);
const resolve4 = promisify(dns.resolve4);

const checkValidDomain = async (domain, instanceIp) => {
  console.log('도메인 검증 시작:', domain, '인스턴스 IP:', instanceIp);

  try {
    // 도메인 등록 여부 확인
    console.log('도메인 등록 여부 확인 중...');
    const { address } = await lookup(domain);
    console.log('도메인 등록 확인됨, IP:', address);

    if (address !== instanceIp) {
      throw new Error('도메인에 등록된 IP가 인스턴스 IP와 일치하지 않습니다.');
    }

    // A 레코드 확인
    console.log('A 레코드 확인 중...');
    const aRecords = await resolve4(domain);
    console.log('A 레코드 확인됨:', aRecords);

    if (!aRecords || aRecords.length === 0) {
      throw new Error('도메인에 A 레코드가 설정되어 있지 않습니다.');
    }

    if (!aRecords.includes(instanceIp)) {
      throw new Error('A 레코드에 등록된 IP가 인스턴스 IP와 일치하지 않습니다.');
    }

    return {
      success: true,
      message: '도메인과 A 레코드가 모두 인스턴스 IP와 일치합니다.',
      data: {
        aRecords,
      },
    };
  } catch (error) {
    console.log('도메인 검증 중 오류:', error);
    if (error.code === 'ENOTFOUND') {
      throw new Error('등록되지 않은 도메인입니다.');
    }
    if (error.code === 'ENODATA') {
      throw new Error('도메인에 A 레코드가 설정되어 있지 않습니다.');
    }
    throw new Error('도메인 검증 중 오류가 발생했습니다.');
  }
};

module.exports = checkValidDomain;

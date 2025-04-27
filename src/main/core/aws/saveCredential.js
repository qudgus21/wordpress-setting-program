const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const Store = require('electron-store');

const store = new Store({
  name: 'aws-config',
  encryptionKey: 'your-secret-key',
});

async function saveCredential(credentials) {
  try {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error('AWS Access Key와 Secret Key는 필수입니다.');
    }

    // 자격 증명 유효성 검사
    const stsClient = new STSClient({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    try {
      await stsClient.send(new GetCallerIdentityCommand({}));
    } catch (error) {
      if (error.name === 'InvalidClientTokenId') {
        throw new Error('Access Key가 올바르지 않습니다. 다시 확인해주세요.');
      }
      if (error.name === 'SignatureDoesNotMatch') {
        throw new Error('Secret Key가 올바르지 않습니다. 다시 확인해주세요.');
      }
      throw error;
    }

    // 유효성 검사 통과 후 저장
    store.set('credentials', {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      lastUpdated: new Date().toISOString(),
    });

    return {
      accessKeyId: credentials.accessKeyId,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AWS 자격 증명 저장 중 오류:', error);
    throw error;
  }
}

module.exports = saveCredential;

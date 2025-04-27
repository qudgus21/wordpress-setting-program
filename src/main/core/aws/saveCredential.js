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

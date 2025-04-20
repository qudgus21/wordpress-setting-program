const Store = require('electron-store');
const store = new Store({
  name: 'aws-config',
  encryptionKey: 'your-secret-key',
});

async function getCredential() {
  try {
    const credentials = store.get('credentials');
    if (!credentials) {
      throw new Error('저장된 AWS 자격 증명이 없습니다.');
    }
    return credentials;
  } catch (error) {
    console.error('AWS 자격 증명 조회 중 오류:', error);
    throw error;
  }
}

module.exports = getCredential;

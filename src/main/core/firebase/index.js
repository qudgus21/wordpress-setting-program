require("module-alias/register");
const admin = require("firebase-admin");

// serviceAccountKey.json 파일 확인
const serviceAccount = require("@/serviceAccountKey.json");

// Firebase 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 모듈 import
const registerLicense = require("./registerLicense");
const checkLicense = require("./checkLicense");

module.exports = {
  registerLicense,
  checkLicense,
};

require("module-alias/register");
const admin = require("firebase-admin");
const { machineIdSync } = require("node-machine-id");
const config = require("@/config.json");

const checkLicense = async () => {
  try {
    const deviceId = machineIdSync();
    const db = admin.firestore();

    // 라이센스 키로 문서를 찾기 위해 쿼리 사용
    const licenseQuery = await db
      .collection(config.firestore.collection)
      .doc(config.firestore.appId)
      .collection(config.firestore.subcollection)
      .where("deviceId", "==", deviceId)
      .get();

    if (licenseQuery.empty) {
      throw new Error("등록된 라이센스가 존재하지 않습니다.");
    }

    const licenseDoc = licenseQuery.docs[0];
    const licenseData = licenseDoc.data();

    // 만료일 체크
    if (licenseData.expiredAt) {
      const now = new Date();
      const expiredAt = licenseData.expiredAt.toDate();

      if (now > expiredAt) {
        throw new Error("라이센스가 만료되었습니다.");
      }
    }

    // 유효성 체크
    if (!licenseData.valid) {
      throw new Error("유효하지 않은 라이센스입니다.");
    }

    return {
      success: true,
      message: "라이센스가 유효합니다.",
      data: licenseData,
    };
  } catch (error) {
    console.error("라이센스 체크 중 오류 발생:", error);
    throw error;
  }
};

module.exports = checkLicense;

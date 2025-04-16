require("module-alias/register");
const admin = require("firebase-admin");
const { machineIdSync } = require("node-machine-id");

const config = require("@/config.json");

const registerLicense = async (licenseKey) => {
  try {
    const docRef = admin
      .firestore()
      .collection(config.firestore.collection)
      .doc(config.firestore.appId)
      .collection(config.firestore.subcollection)
      .doc(licenseKey);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("존재하지 않는 라이센스 키입니다.");
    }

    const docData = doc.data();

    // 이미 등록된 라이센스인 경우
    if (docData.registeredAt) {
      throw new Error("이미 등록된 라이센스 키입니다.");
    }

    // 종료된 라이센스인 경우
    if (docData.expiredAt) {
      const now = new Date();
      const expiredAt = docData.expiredAt.toDate();
      if (now > expiredAt) {
        throw new Error("종료된 라이센스 키입니다.");
      }
    }

    const deviceId = machineIdSync();

    await docRef.update({
      valid: true,
      deviceId: deviceId,
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "라이센스가 성공적으로 등록되었습니다." };
  } catch (error) {
    console.error("라이센스 등록 에러:", error);
    throw error;
  }
};

module.exports = registerLicense;

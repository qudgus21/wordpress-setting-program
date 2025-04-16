// src/main/ipc/firebase.js
const { ipcMain } = require("electron");
const { registerLicense } = require("@/core/firebase");

// 라이센스 등록 핸들러
ipcMain.handle("register-license", async (event, licenseKey) => {
  try {
    const result = await registerLicense(licenseKey);
    return {
      success: true,
      message: "라이센스가 성공적으로 등록되었습니다.",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
});

// 라이센스 상태 확인 핸들러
ipcMain.handle("check-license", async () => {
  try {
    // TODO: 로컬 저장소에서 라이센스 정보 확인
    return {
      success: true,
      isValid: true,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
});

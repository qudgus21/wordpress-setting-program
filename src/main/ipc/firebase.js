// src/main/ipc/firebase.js
const { ipcMain } = require("electron");
const { registerLicense, checkLicense } = require("@/core/firebase");

// 라이센스 등록 핸들러
ipcMain.handle("register-license", async (event, licenseKey) => {
  try {
    const license = await registerLicense(licenseKey);
    return {
      success: true,
      message: "라이센스가 성공적으로 등록되었습니다.",
      data: license,
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
    const license = await checkLicense();
    return {
      success: true,
      message: "라이센스가 유효합니다.",
      data: license,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
});

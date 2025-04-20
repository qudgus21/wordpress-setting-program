const { ipcMain } = require('electron');
const { getCredential, setCredential, getInstances } = require('@/core/aws');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

// AWS 자격 증명 저장 핸들러
ipcMain.handle('saveCredential', async (event, credentials) => {
  try {
    const result = await setCredential(credentials);
    return {
      success: true,
      message: 'AWS 자격 증명이 성공적으로 저장되었습니다.',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
});

// AWS 자격 증명 조회 핸들러
ipcMain.handle('getCredential', async () => {
  try {
    const result = await getCredential();
    return {
      success: true,
      message: 'AWS 자격 증명을 성공적으로 불러왔습니다.',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
});

// EC2 인스턴스 목록 조회 핸들러
ipcMain.handle('getInstances', async () => {
  try {
    const credentials = await getCredential();
    const instances = await getInstances(credentials);
    return {
      success: true,
      message: 'EC2 인스턴스 목록을 성공적으로 불러왔습니다.',
      data: instances,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
});

const { ipcMain } = require('electron');
const {
  getCredential,
  saveCredential,
  getEc2Instances,
  createEc2Instance,
  deleteEc2Instance,
  getDomainCounts,
  initializeEc2Instance,
  checkValidDomain,
  createBlog,
  deleteBlog,
} = require('@/core/aws');

const {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  AllocateAddressCommand,
  AssociateAddressCommand,
} = require('@aws-sdk/client-ec2');

// AWS 자격 증명 저장 핸들러
ipcMain.handle('saveCredential', async credentials => {
  try {
    const result = await saveCredential(credentials);
    return {
      success: true,
      message: 'AWS 자격 증명이 성공적으로 저장되었습니다.',
      data: result,
    };
  } catch (error) {
    throw error;
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
    throw error;
  }
});

// EC2 인스턴스 목록 조회 핸들러
ipcMain.handle('getEc2Instances', async () => {
  try {
    const credentials = await getCredential();
    const instances = await getEc2Instances(credentials);
    const instancesWithDomainCount = await getDomainCounts(instances);

    return {
      success: true,
      message: 'EC2 인스턴스 목록을 성공적으로 불러왔습니다.',
      data: instancesWithDomainCount,
    };
  } catch (error) {
    throw error;
  }
});

// EC2 인스턴스 생성 핸들러
ipcMain.handle('createEc2Instance', async () => {
  try {
    const credentials = await getCredential();
    const instance = await createEc2Instance(credentials);
    return {
      success: true,
      message: '인스턴스가 성공적으로 생성되었습니다.',
      data: instance,
    };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('deleteEc2Instance', async (event, instanceId) => {
  try {
    const credentials = await getCredential();
    const result = await deleteEc2Instance(credentials, instanceId);
    return { success: true, data: result };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('initializeEc2Instance', async (event, instanceId) => {
  try {
    const credentials = await getCredential();
    const instance = await initializeEc2Instance(instanceId, credentials);
    return {
      success: true,
      message: '인스턴스 초기화가 완료되었습니다.',
      data: instance,
    };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('createBlog', async (event, { instance, domain }) => {
  try {
    const credentials = await getCredential();
    await checkValidDomain(domain, instance.publicIp);
    await createBlog(credentials, instance, domain);

    return {
      success: true,
      message: '블로그가 성공적으로 생성되었습니다.',
      data: { instanceId: instance.id, domain },
    };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('deleteBlog', async (event, { instance, domain }) => {
  try {
    const credentials = await getCredential();
    await deleteBlog(credentials, instance, domain);

    return {
      success: true,
      message: '블로그가 삭제되었습니다.',
      data: { instanceId: instance.id, domain },
    };
  } catch (error) {
    throw error;
  }
});

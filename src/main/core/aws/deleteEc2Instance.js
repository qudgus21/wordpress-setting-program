const {
  EC2Client,
  TerminateInstancesCommand,
  DescribeInstancesCommand,
  ReleaseAddressCommand,
  DescribeAddressesCommand,
  DeleteSecurityGroupCommand,
  DeleteVolumeCommand,
} = require('@aws-sdk/client-ec2');

async function deleteEc2Instance(credentials, instanceId) {
  try {
    const ec2Client = new EC2Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    // 1. 인스턴스의 탄력적 IP 정보 조회
    const describeInstancesCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });
    const describeResponse = await ec2Client.send(describeInstancesCommand);
    const instance = describeResponse.Reservations[0].Instances[0];
    const publicIp = instance.PublicIpAddress;
    const securityGroupIds = instance.SecurityGroups.map(sg => sg.GroupId);
    const volumeIds = instance.BlockDeviceMappings.map(bdm => bdm.Ebs.VolumeId);

    // 2. 탄력적 IP 해제
    if (publicIp) {
      try {
        const describeAddressesCommand = new DescribeAddressesCommand({
          PublicIps: [publicIp],
        });
        const addressesResponse = await ec2Client.send(describeAddressesCommand);

        if (addressesResponse.Addresses && addressesResponse.Addresses.length > 0) {
          const allocationId = addressesResponse.Addresses[0].AllocationId;
          const releaseAddressCommand = new ReleaseAddressCommand({
            AllocationId: allocationId,
          });
          await ec2Client.send(releaseAddressCommand);
        }
      } catch (error) {
        // Elastic IP 관련 오류는 무시하고 계속 진행
        console.warn(`탄력적 IP 해제 중 오류 발생: ${error.message}`);
      }
    }

    // 3. 인스턴스 종료
    const terminateCommand = new TerminateInstancesCommand({
      InstanceIds: [instanceId],
    });
    await ec2Client.send(terminateCommand);

    // 4. 보안 그룹 삭제
    for (const securityGroupId of securityGroupIds) {
      try {
        const deleteSecurityGroupCommand = new DeleteSecurityGroupCommand({
          GroupId: securityGroupId,
        });
        await ec2Client.send(deleteSecurityGroupCommand);
      } catch (error) {
        console.warn(`보안 그룹 ${securityGroupId} 삭제 중 오류 발생: ${error.message}`);
      }
    }

    // 5. EBS 볼륨 삭제
    for (const volumeId of volumeIds) {
      try {
        const deleteVolumeCommand = new DeleteVolumeCommand({
          VolumeId: volumeId,
        });
        await ec2Client.send(deleteVolumeCommand);
      } catch (error) {
        console.warn(`EBS 볼륨 ${volumeId} 삭제 중 오류 발생: ${error.message}`);
      }
    }

    return {
      instanceId,
      message: '인스턴스와 관련 리소스가 성공적으로 삭제되었습니다.',
    };
  } catch (error) {
    throw new Error(`인스턴스 삭제 중 오류 발생: ${error.message}`);
  }
}

module.exports = deleteEc2Instance;

const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

const getEc2Instances = async credentials => {
  try {
    const ec2Client = new EC2Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    return response.Reservations.flatMap(reservation =>
      reservation.Instances.map(instance => ({
        id: instance.InstanceId,
        name: instance.Tags?.find(tag => tag.Key === 'Name')?.Value || 'N/A',
        type: instance.InstanceType,
        state: instance.State.Name,
        publicIp: instance.PublicIpAddress || 'N/A',
        privateIp: instance.PrivateIpAddress || 'N/A',
        launchTime: instance.LaunchTime,
      }))
    );
  } catch (error) {
    console.error('EC2 인스턴스 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

module.exports = getEc2Instances;

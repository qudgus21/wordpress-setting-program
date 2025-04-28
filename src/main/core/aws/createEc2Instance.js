const {
  EC2Client,
  RunInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  AllocateAddressCommand,
  AssociateAddressCommand,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  CreateTagsCommand,
  CreateKeyPairCommand,
  DescribeKeyPairsCommand,
} = require('@aws-sdk/client-ec2');
const fs = require('fs');
const path = require('path');

const getDefaultVpcAndSubnet = async ec2Client => {
  try {
    // 기본 VPC 조회
    const vpcsCommand = new DescribeVpcsCommand({
      Filters: [{ Name: 'isDefault', Values: ['true'] }],
    });
    const vpcsResponse = await ec2Client.send(vpcsCommand);

    if (!vpcsResponse.Vpcs || vpcsResponse.Vpcs.length === 0) {
      throw new Error('기본 VPC를 찾을 수 없습니다.');
    }

    const vpcId = vpcsResponse.Vpcs[0].VpcId;

    // 기본 VPC의 서브넷 조회
    const subnetsCommand = new DescribeSubnetsCommand({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
    });
    const subnetsResponse = await ec2Client.send(subnetsCommand);

    if (!subnetsResponse.Subnets || subnetsResponse.Subnets.length === 0) {
      throw new Error('기본 VPC에 서브넷이 없습니다.');
    }

    // t2.micro를 지원하는 가용 영역(a 또는 c)의 서브넷 찾기
    const supportedSubnet = subnetsResponse.Subnets.find(
      subnet => subnet.AvailabilityZone === 'ap-northeast-2a' || subnet.AvailabilityZone === 'ap-northeast-2c'
    );

    if (!supportedSubnet) {
      throw new Error('t2.micro를 지원하는 가용 영역의 서브넷을 찾을 수 없습니다.');
    }

    const subnetId = supportedSubnet.SubnetId;
    console.log('선택된 서브넷의 가용 영역:', supportedSubnet.AvailabilityZone);

    return { vpcId, subnetId };
  } catch (error) {
    throw new Error(`VPC/서브넷 조회 중 오류 발생: ${error.message}`);
  }
};

async function createEc2Instance(credentials) {
  const ec2Client = new EC2Client({
    region: 'ap-northeast-2',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  try {
    // 키 페어 생성 또는 조회
    const keyPairName = 'instance-keypair';
    const keyPath = path.join(process.env.HOME, '.ssh', `${keyPairName}.pem`);

    try {
      const describeCommand = new DescribeKeyPairsCommand({
        KeyNames: [keyPairName],
      });
      await ec2Client.send(describeCommand);
      console.log('기존 키 페어를 사용합니다.');

      // 키 파일이 없으면 경고 메시지 출력
      if (!fs.existsSync(keyPath)) {
        console.warn(
          '경고: 키 파일이 로컬에 존재하지 않습니다. AWS 콘솔에서 키 페어를 다운로드하여 ~/.ssh/wordpress-keypair.pem에 저장해주세요.'
        );
      }
    } catch (error) {
      if (error.name === 'InvalidKeyPair.NotFound') {
        const createCommand = new CreateKeyPairCommand({
          KeyName: keyPairName,
        });
        const response = await ec2Client.send(createCommand);

        // 프라이빗 키를 파일로 저장
        fs.writeFileSync(keyPath, response.KeyMaterial);
        fs.chmodSync(keyPath, 0o400); // 읽기 전용으로 권한 설정
        console.log('새로운 키 페어를 생성하고 저장했습니다.');
      } else {
        throw error;
      }
    }

    // 기본 VPC와 서브넷 가져오기
    const { vpcId, subnetId } = await getDefaultVpcAndSubnet(ec2Client);

    // 1. 보안 그룹 생성
    const createSecurityGroupCommand = new CreateSecurityGroupCommand({
      GroupName: `wordpress-sg-${Date.now()}`,
      Description: 'WordPress Security Group',
      VpcId: vpcId,
    });

    const securityGroupResponse = await ec2Client.send(createSecurityGroupCommand);
    const groupId = securityGroupResponse.GroupId;

    // 보안 그룹 인바운드 규칙 설정
    const ingressCommand = new AuthorizeSecurityGroupIngressCommand({
      GroupId: groupId,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
      ],
    });

    await ec2Client.send(ingressCommand);

    // 2. EC2 인스턴스 생성
    const runInstancesCommand = new RunInstancesCommand({
      ImageId: 'ami-0c9c942bd7bf113a2', // Amazon Linux 2 AMI
      InstanceType: 't2.micro',
      MinCount: 1,
      MaxCount: 1,
      KeyName: keyPairName,
      SecurityGroupIds: [groupId],
      SubnetId: subnetId,
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            {
              Key: 'Name',
              Value: `wordpress-${Date.now()}`,
            },
          ],
        },
      ],
    });

    const instanceResponse = await ec2Client.send(runInstancesCommand);
    const instanceId = instanceResponse.Instances[0].InstanceId;

    // 3. Elastic IP 할당 및 연결
    const allocateAddressCommand = new AllocateAddressCommand({
      Domain: 'vpc',
    });
    const allocateResponse = await ec2Client.send(allocateAddressCommand);
    const allocationId = allocateResponse.AllocationId;

    // 인스턴스가 실행될 때까지 대기
    let instanceState = 'pending';
    while (instanceState === 'pending') {
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const describeResponse = await ec2Client.send(describeCommand);
      instanceState = describeResponse.Reservations[0].Instances[0].State.Name;

      if (instanceState === 'running') {
        break;
      }

      // 5초 대기
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Elastic IP 연결
    const associateAddressCommand = new AssociateAddressCommand({
      AllocationId: allocationId,
      InstanceId: instanceId,
    });
    await ec2Client.send(associateAddressCommand);

    return {
      success: true,
      message: 'EC2 인스턴스가 성공적으로 생성되었습니다.',
      data: {
        instanceId,
        publicIp: allocateResponse.PublicIp,
        securityGroupId: groupId,
      },
    };
  } catch (error) {
    console.error('EC2 인스턴스 생성 중 오류:', error);
    throw error;
  }
}

module.exports = createEc2Instance;

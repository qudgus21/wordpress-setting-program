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
} = require('@aws-sdk/client-ec2');

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

    const defaultVpcId = vpcsResponse.Vpcs[0].VpcId;

    // 기본 VPC의 서브넷 조회
    const subnetsCommand = new DescribeSubnetsCommand({
      Filters: [{ Name: 'vpc-id', Values: [defaultVpcId] }],
    });
    const subnetsResponse = await ec2Client.send(subnetsCommand);

    if (!subnetsResponse.Subnets || subnetsResponse.Subnets.length === 0) {
      throw new Error('기본 VPC에 서브넷이 없습니다.');
    }

    const defaultSubnetId = subnetsResponse.Subnets[0].SubnetId;

    return {
      vpcId: defaultVpcId,
      subnetId: defaultSubnetId,
    };
  } catch (error) {
    throw new Error(`VPC/서브넷 조회 중 오류 발생: ${error.message}`);
  }
};

const createEc2Instance = async credentials => {
  try {
    const ec2Client = new EC2Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    // 기본 VPC와 서브넷 조회
    const { vpcId, subnetId } = await getDefaultVpcAndSubnet(ec2Client);

    // 1. 보안 그룹 생성
    const createSecurityGroupCommand = new CreateSecurityGroupCommand({
      GroupName: `wordpress-sg-${Date.now()}`,
      Description: 'WordPress 보안 그룹',
      VpcId: vpcId,
    });

    const securityGroupResponse = await ec2Client.send(createSecurityGroupCommand);
    const groupId = securityGroupResponse.GroupId;

    // 보안 그룹 인바운드 규칙 설정
    const ingressCommand = new AuthorizeSecurityGroupIngressCommand({
      GroupId: groupId,
      IpPermissions: [
        // SSH (22)
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
        // HTTP (80)
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
        // HTTPS (443)
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
      ],
    });

    await ec2Client.send(ingressCommand);

    // 2. EC2 인스턴스 생성
    const runInstancesCommand = new RunInstancesCommand({
      ImageId: 'ami-0c9c942bd7bf113a2', // Amazon Linux 2 AMI
      InstanceType: 't2.micro', // 프리 티어
      MinCount: 1,
      MaxCount: 1,
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

    // 3. 탄력적 IP 할당
    const allocateAddressCommand = new AllocateAddressCommand({
      Domain: 'vpc',
    });

    const elasticIpResponse = await ec2Client.send(allocateAddressCommand);
    const allocationId = elasticIpResponse.AllocationId;

    // 4. 탄력적 IP 연결
    const associateAddressCommand = new AssociateAddressCommand({
      AllocationId: allocationId,
      InstanceId: instanceId,
    });

    await ec2Client.send(associateAddressCommand);

    // 5. 인스턴스 정보 조회
    const describeInstancesCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });

    const describeResponse = await ec2Client.send(describeInstancesCommand);
    const instance = describeResponse.Reservations[0].Instances[0];

    return {
      instanceId: instance.InstanceId,
      publicIp: elasticIpResponse.PublicIp,
      privateIp: instance.PrivateIpAddress,
      state: instance.State.Name,
      securityGroupId: groupId,
      tags: instance.Tags,
    };
  } catch (error) {
    throw new Error(`EC2 인스턴스 생성 중 오류 발생: ${error.message}`);
  }
};

module.exports = createEc2Instance;

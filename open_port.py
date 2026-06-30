import boto3

def open_port():
    ec2 = boto3.client('ec2', region_name='us-east-1')
    instance_id = 'i-0c2a7446638df1ddb'
    
    print("Checking Security Groups for instance...")
    response = ec2.describe_instances(InstanceIds=[instance_id])
    sg_id = response['Reservations'][0]['Instances'][0]['SecurityGroups'][0]['GroupId']
    print(f"Found Security Group: {sg_id}")
    
    try:
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 8000,
                    'ToPort': 8000,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'FunTechPay Backend API'}]
                }
            ]
        )
        print("SUCCESS: Port 8000 is now open to the public!")
    except Exception as e:
        if 'InvalidPermission.Duplicate' in str(e):
            print("Port 8000 is already open.")
        else:
            print(f"Error opening port: {e}")
            
    # Also double check if the backend is actually running
    ssm = boto3.client('ssm', region_name='us-east-1')
    print("Checking if backend is running...")
    commands = [
        "ps aux | grep uvicorn",
        "netstat -tulnp | grep 8000"
    ]
    resp = ssm.send_command(
        InstanceIds=[instance_id],
        DocumentName="AWS-RunShellScript",
        Parameters={'commands': commands}
    )
    print("SSM Command Sent to check backend process.")

if __name__ == "__main__":
    open_port()

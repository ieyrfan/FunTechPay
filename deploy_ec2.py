import boto3
import time
import sys

def deploy():
    ec2 = boto3.client('ec2', region_name='us-east-1')
    ssm = boto3.client('ssm', region_name='us-east-1')
    
    response = ec2.describe_instances(Filters=[{'Name': 'instance-state-name', 'Values': ['running']}])
    instances = []
    for res in response['Reservations']:
        for inst in res['Instances']:
            instances.append((inst['InstanceId'], inst.get('PublicIpAddress', 'None')))
            
    if not instances:
        print("No running EC2 instances found!")
        sys.exit(1)
        
    instance_id, public_ip = instances[0]
    
    commands = [
        "sudo dnf install -y python3-pip unzip",
        "mkdir -p /home/ec2-user/funtechpay_backend",
        "cd /home/ec2-user/funtechpay_backend",
        "curl -O https://funtechpay-live-app-8fb71ff4.s3.amazonaws.com/backend_bundle.zip",
        "unzip -o backend_bundle.zip",
        "sudo pip3 install -r requirements.txt",
        "sudo fuser -k 8000/tcp || true",
        "nohup /usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > /home/ec2-user/funtechpay_backend/api.log 2>&1 &",
        "echo 'Deployment complete!'"
    ]
    
    try:
        response = ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={'commands': commands}
        )
        command_id = response['Command']['CommandId']
        print(f"Command ID: {command_id}. Waiting for completion...")
        
        while True:
            time.sleep(3)
            status_res = ssm.get_command_invocation(CommandId=command_id, InstanceId=instance_id)
            status = status_res['Status']
            if status in ['Pending', 'InProgress', 'Delayed']:
                continue
            
            print(f"Final Status: {status}")
            print(status_res.get('StandardOutputContent', ''))
            print(status_res.get('StandardErrorContent', ''))
            break
            
    except Exception as e:
        print(f"SSM Failed: {e}")

if __name__ == "__main__":
    deploy()

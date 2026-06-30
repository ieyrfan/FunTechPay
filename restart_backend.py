import boto3
import time

def restart_backend():
    ssm = boto3.client('ssm', region_name='us-east-1')
    instance_id = 'i-0c2a7446638df1ddb'
    
    print("Restarting Python Backend on AWS EC2...")
    commands = [
        "sudo fuser -k 8000/tcp || true",
        "cd /home/ec2-user/funtechpay_backend",
        "nohup /usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > /home/ec2-user/funtechpay_backend/api.log 2>&1 &",
        "echo 'Backend Restarted!'"
    ]
    
    resp = ssm.send_command(
        InstanceIds=[instance_id],
        DocumentName="AWS-RunShellScript",
        Parameters={'commands': commands}
    )
    command_id = resp['Command']['CommandId']
    
    while True:
        time.sleep(2)
        status_res = ssm.get_command_invocation(CommandId=command_id, InstanceId=instance_id)
        if status_res['Status'] not in ['Pending', 'InProgress']:
            print(f"Status: {status_res['Status']}")
            print(status_res.get('StandardOutputContent', ''))
            print(status_res.get('StandardErrorContent', ''))
            break

if __name__ == "__main__":
    restart_backend()

import boto3
import os
import zipfile
import time
import sys

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if 'dist' in dirs:
            dirs.remove('dist')
        for file in files:
            ziph.write(os.path.join(root, file), 
                       os.path.relpath(os.path.join(root, file), 
                                       os.path.join(path, '..')))

def deploy():
    s3 = boto3.client('s3', region_name='us-east-1')
    ssm = boto3.client('ssm', region_name='us-east-1')
    instance_id = "i-0c2a7446638df1ddb"
    bucket_name = "funtechpay-build-bucket-12345"
    
    # 2. Zip frontend source
    print("Zipping frontend source code...")
    zip_path = 'frontend_source.zip'
    zipf = zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED)
    zipdir('c:/Users/User/Downloads/habiskan/aegispay/frontend', zipf)
    zipf.close()
    
    # 3. Upload source to AWS S3
    print("Uploading updated source to AWS S3...")
    s3.upload_file(zip_path, bucket_name, 'frontend_source.zip')

    # 4. Trigger AWS EC2 to build the React App!
    print("Commanding AWS EC2 to build and host the React application...")
    commands = [
        "if command -v apt-get &> /dev/null; then",
        "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
        "  sudo apt-get install -y nodejs nginx unzip",
        "elif command -v yum &> /dev/null; then",
        "  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -",
        "  sudo yum install -y nodejs nginx unzip",
        "fi",
        f"aws s3 cp s3://{bucket_name}/frontend_source.zip /home/ec2-user/frontend_source.zip",
        "cd /home/ec2-user",
        "rm -rf frontend_build_dir",
        "mkdir frontend_build_dir",
        "unzip -q frontend_source.zip -d frontend_build_dir",
        "cd frontend_build_dir/frontend",
        "npm install",
        "npm run build",
        "sudo rm -rf /usr/share/nginx/html/*",
        "sudo rm -rf /var/www/html/*",
        "sudo cp -r dist/* /usr/share/nginx/html/ || sudo cp -r dist/* /var/www/html/",
        "sudo systemctl enable nginx",
        "sudo systemctl restart nginx || sudo service nginx restart",
        "echo 'AWS CLOUD BUILD COMPLETE! NGINX HOSTING ACTIVE!'"
    ]
    
    try:
        response = ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={'commands': commands}
        )
        command_id = response['Command']['CommandId']
        print(f"Command ID: {command_id}. Waiting for AWS Build to complete...")
        
        while True:
            time.sleep(5)
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

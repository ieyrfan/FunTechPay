import subprocess
import boto3
import os
import mimetypes

def deploy():
    print("Installing new NPM packages (html5-qrcode)...")
    subprocess.run(["cmd", "/c", "npm install"], cwd="c:/Users/User/Downloads/habiskan/aegispay/frontend")

    print("Compiling React Application...")
    result = subprocess.run(["cmd", "/c", "npm run build"], cwd="c:/Users/User/Downloads/habiskan/aegispay/frontend", capture_output=True, text=True)
    
    print("Build Output:")
    print(result.stdout)
    if result.stderr:
        print("Build Errors:")
        print(result.stderr)
        
    if result.returncode != 0:
        print("BUILD FAILED! Aborting deployment.")
        return
        
    print("Build Succeeded! Uploading to AWS S3 Static Hosting...")
    s3_client = boto3.client('s3', region_name='us-east-1')
    bucket_name = "funtechpay-live-app-8fb71ff4"
    dist_dir = 'c:/Users/User/Downloads/habiskan/aegispay/frontend/dist'
    
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            file_path = os.path.join(root, file)
            s3_key = os.path.relpath(file_path, dist_dir).replace('\\', '/')
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = 'binary/octet-stream'
                
            print(f"Uploading {s3_key}...")
            s3_client.upload_file(
                file_path, bucket_name, s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            
    print("SUPER-APP DEPLOY COMPLETE!")

if __name__ == "__main__":
    deploy()

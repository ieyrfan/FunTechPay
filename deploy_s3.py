import boto3
import os
import mimetypes
import uuid
import json

def deploy_to_s3():
    s3_client = boto3.client('s3', region_name='us-east-1')
    bucket_name = f"funtechpay-live-app-{uuid.uuid4().hex[:8]}"
    print(f"Creating bucket {bucket_name}...")
    
    try:
        s3_client.create_bucket(Bucket=bucket_name)
    except Exception as e:
        print(f"Failed to create bucket: {e}")
        return

    # Disable block public access
    s3_client.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': False,
            'IgnorePublicAcls': False,
            'BlockPublicPolicy': False,
            'RestrictPublicBuckets': False
        }
    )

    # Attach bucket policy for public read
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            }
        ]
    }
    s3_client.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))

    # Enable static website hosting
    s3_client.put_bucket_website(
        Bucket=bucket_name,
        WebsiteConfiguration={
            'ErrorDocument': {'Key': 'index.html'},
            'IndexDocument': {'Suffix': 'index.html'},
        }
    )

    # Upload files
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

    website_url = f"http://{bucket_name}.s3-website-us-east-1.amazonaws.com"
    print("\n" + "="*50)
    print("SUCCESS! YOUR LIVE AWS URL IS:")
    print(website_url)
    print("="*50 + "\n")

if __name__ == "__main__":
    deploy_to_s3()

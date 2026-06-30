import boto3
import json

def fix_s3_permissions():
    s3 = boto3.client('s3', region_name='us-east-1')
    bucket_name = "funtechpay-live-app-8fb71ff4"
    
    # 1. Disable Block Public Access
    print("Disabling Block Public Access...")
    try:
        s3.delete_public_access_block(Bucket=bucket_name)
    except Exception as e:
        print(f"Delete public access block error (ignoring): {e}")

    # 2. Attach Public Read Bucket Policy
    print("Attaching Public Read Bucket Policy...")
    bucket_policy = {
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
    
    try:
        s3.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(bucket_policy)
        )
        print("SUCCESS: Bucket policy applied! The HTTPS link is now fully public.")
    except Exception as e:
        print(f"Error applying bucket policy: {e}")

if __name__ == "__main__":
    fix_s3_permissions()

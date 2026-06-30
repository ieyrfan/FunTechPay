import shutil
import boto3

def prepare_backend():
    print("Zipping backend folder...")
    shutil.make_archive('c:/Users/User/Downloads/habiskan/aegispay/backend_bundle', 'zip', 'c:/Users/User/Downloads/habiskan/aegispay/backend')
    
    print("Uploading backend_bundle.zip to S3...")
    s3 = boto3.client('s3', region_name='us-east-1')
    s3.upload_file(
        'c:/Users/User/Downloads/habiskan/aegispay/backend_bundle.zip',
        'funtechpay-live-app-8fb71ff4',
        'backend_bundle.zip'
    )
    print("Successfully uploaded backend_bundle.zip to S3.")

if __name__ == "__main__":
    prepare_backend()

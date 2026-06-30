import boto3

s3 = boto3.client('s3', region_name='us-east-1')
bucket = 'funtechpay-live-app-8fb71ff4'
try:
    response = s3.list_objects_v2(Bucket=bucket)
    print("Objects in bucket:")
    for obj in response.get('Contents', []):
        print(f"- {obj['Key']}")
except Exception as e:
    print(f"Error listing objects: {e}")

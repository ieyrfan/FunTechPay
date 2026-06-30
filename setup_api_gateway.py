import boto3
import json

def create_api_gateway_proxy():
    client = boto3.client('apigatewayv2', region_name='us-east-1')
    ec2_ip = "54.162.133.171"
    
    print("Creating AWS API Gateway (HTTP Proxy)...")
    
    # 1. Create HTTP API
    api_response = client.create_api(
        Name='FunTechPay-Backend-Proxy',
        ProtocolType='HTTP',
        CorsConfiguration={
            'AllowOrigins': ['*'],
            'AllowMethods': ['*'],
            'AllowHeaders': ['*']
        }
    )
    api_id = api_response['ApiId']
    api_endpoint = api_response['ApiEndpoint']
    print(f"API Created: {api_endpoint}")
    
    # 2. Create HTTP Proxy Integration to EC2
    print(f"Creating Integration to http://{ec2_ip}:8000/{{proxy}}")
    integration_response = client.create_integration(
        ApiId=api_id,
        IntegrationType='HTTP_PROXY',
        IntegrationMethod='ANY',
        IntegrationUri=f"http://{ec2_ip}:8000/{{proxy}}",
        PayloadFormatVersion='1.0'
    )
    integration_id = integration_response['IntegrationId']
    
    # 3. Create Route
    print("Creating Route ANY /{proxy+}")
    client.create_route(
        ApiId=api_id,
        RouteKey='ANY /{proxy+}',
        Target=f'integrations/{integration_id}'
    )
    
    # 4. Create Stage
    print("Creating $default Stage")
    client.create_stage(
        ApiId=api_id,
        StageName='$default',
        AutoDeploy=True
    )
    
    print("\nSUCCESS! HTTPS API GATEWAY DEPLOYED:")
    print(f"---> {api_endpoint} <---")

if __name__ == "__main__":
    create_api_gateway_proxy()

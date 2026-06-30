import boto3
from decimal import Decimal

def seed_database():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table('FunTechPay_Users')
    
    users_to_seed = [
        {
            'phone': '0123456789',
            'pin': '123456',
            'name': 'Irfan Rizal',
            'balance': Decimal('14050.20')
        },
        {
            'phone': '0111111111',
            'pin': '111111',
            'name': 'Ahmad Ali',
            'balance': Decimal('500.00')
        },
        {
            'phone': '0222222222',
            'pin': '222222',
            'name': 'Siti Nurhaliza',
            'balance': Decimal('8800.00')
        },
        {
            'phone': '0333333333',
            'pin': '333333',
            'name': 'Jason Lee',
            'balance': Decimal('120.50')
        }
    ]
    
    print("Seeding AWS DynamoDB with users (Decimal fixed)...")
    for user in users_to_seed:
        try:
            table.put_item(Item=user)
            print(f"Added {user['name']} ({user['phone']}) to DynamoDB!")
        except Exception as e:
            print(f"Failed to add {user['name']}: {e}")
            
    print("Database Seed Complete!")

if __name__ == "__main__":
    seed_database()

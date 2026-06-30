import boto3
from decimal import Decimal

REGION = 'us-east-1'
dynamodb = boto3.resource('dynamodb', region_name=REGION)
USERS_TABLE = "FunTechPay_Users"

dummy_users = [
    {"phone": "0111111111", "name": "Ahmad Ali", "pin": "123456", "balance": Decimal("500.00")},
    {"phone": "0122222222", "name": "Siti Nurhaliza", "pin": "123456", "balance": Decimal("15000.50")},
    {"phone": "0133333333", "name": "Jason Lee", "pin": "123456", "balance": Decimal("250.00")},
    {"phone": "0144444444", "name": "Muthu Kumar", "pin": "123456", "balance": Decimal("890.20")},
    {"phone": "0155555555", "name": "Farah Ann", "pin": "123456", "balance": Decimal("45000.00")},
    {"phone": "0166666666", "name": "Goh V Shem", "pin": "123456", "balance": Decimal("12.50")},
    {"phone": "0177777777", "name": "Nur Dhabitah", "pin": "123456", "balance": Decimal("1200.00")},
    {"phone": "0188888888", "name": "Khairul Aming", "pin": "123456", "balance": Decimal("99999.99")},
    {"phone": "0199999999", "name": "Izzat Haikal", "pin": "123456", "balance": Decimal("300.00")},
    {"phone": "0100000000", "name": "Sofea Jane", "pin": "123456", "balance": Decimal("50.00")},
    {"phone": "0123451234", "name": "Uncle Roger", "pin": "123456", "balance": Decimal("9000.00")},
    {"phone": "0198765432", "name": "Gordon Ramsay", "pin": "123456", "balance": Decimal("150.00")}
]

def seed():
    table = dynamodb.Table(USERS_TABLE)
    print(f"Seeding {len(dummy_users)} dummy users into {USERS_TABLE}...")
    for u in dummy_users:
        table.put_item(Item=u)
        print(f"Added {u['name']} (Phone: {u['phone']}) - Balance: RM {u['balance']}")
    print("\nDatabase Seeding Complete! ✅")

if __name__ == "__main__":
    seed()

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import boto3
import uuid
import datetime
import os
import jwt
import random
from decimal import Decimal

SECRET_KEY = "SUPER_SECRET_BANK_KEY"
ALGORITHM = "HS256"
security = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

app = FastAPI(title="FunTechPay Real API")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS Configuration (Uses local credentials automatically)
REGION = 'us-east-1'
dynamodb = boto3.resource('dynamodb', region_name=REGION)
sqs = boto3.client('sqs', region_name=REGION)

# DynamoDB Table Names
USERS_TABLE = "FunTechPay_Users"
TX_TABLE = "FunTechPay_Transactions"
QUEUE_NAME = "FunTechPay_TxQueue"

queue_url = ""

# --- System Initialization ---
def setup_aws_infrastructure():
    global queue_url
    print("Setting up AWS Infrastructure (DynamoDB & SQS)...")
    
    # 1. Create Users Table
    try:
        table = dynamodb.create_table(
            TableName=USERS_TABLE,
            KeySchema=[{'AttributeName': 'phone', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone', 'AttributeType': 'S'}],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print("Waiting for Users table to create...")
        table.wait_until_exists()
    except Exception as e:
        if "ResourceInUseException" not in str(e): print(f"Error Users Table: {e}")

    # 2. Create Transactions Table
    try:
        table = dynamodb.create_table(
            TableName=TX_TABLE,
            KeySchema=[{'AttributeName': 'tx_id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'tx_id', 'AttributeType': 'S'}],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print("Waiting for Transactions table to create...")
        table.wait_until_exists()
    except Exception as e:
        if "ResourceInUseException" not in str(e): print(f"Error TX Table: {e}")

    # 3. Create SQS Queue
    try:
        response = sqs.create_queue(QueueName=QUEUE_NAME)
        queue_url = response['QueueUrl']
        print(f"SQS Queue Ready: {queue_url}")
    except Exception as e:
        print(f"Error SQS: {e}")

# Call setup on startup
setup_aws_infrastructure()


# --- API Models ---
class UserLogin(BaseModel):
    phone: str
    pin: str

class UserRegister(BaseModel):
    phone: str
    pin: str
    name: str

class TransferRequest(BaseModel):
    sender_phone: str
    receiver_phone: str
    amount: float
    description: str

class TransferConfirmRequest(BaseModel):
    sender_phone: str
    receiver_phone: str
    amount: float
    description: str
    tac: str

# --- API Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "Real FunTechPay Backend Active (AWS DynamoDB Connected)"}

@app.post("/register")
def register_user(user: UserRegister):
    table = dynamodb.Table(USERS_TABLE)
    
    # Check if exists
    response = table.get_item(Key={'phone': user.phone})
    if 'Item' in response:
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    # Create Real AWS User
    table.put_item(
        Item={
            'phone': user.phone,
            'pin': user.pin,
            'name': user.name,
            'balance': Decimal('1500.00'), # Free money for testing
            'points': Decimal('0')
        }
    )
    return {"message": "User successfully registered in AWS DynamoDB!"}

@app.post("/login")
def login(user: UserLogin):
    table = dynamodb.Table(USERS_TABLE)
    response = table.get_item(Key={'phone': user.phone})
    
    if 'Item' not in response:
        raise HTTPException(status_code=401, detail="Invalid phone number or PIN")
        
    db_user = response['Item']
    now = datetime.datetime.now(datetime.timezone.utc).timestamp()
    
    lockout_until = float(db_user.get('lockout_until', 0))
    if lockout_until > now:
        raise HTTPException(status_code=403, detail="Account locked. Try again in 5 minutes.")
        
    if user.pin != 'face-id' and db_user['pin'] != user.pin:
        failed = int(db_user.get('failed_attempts', 0)) + 1
        update_expr = "SET failed_attempts = :f"
        expr_vals = {':f': failed}
        
        if failed >= 3:
            update_expr += ", lockout_until = :l"
            expr_vals[':l'] = Decimal(str(now + 300))
            
        table.update_item(
            Key={'phone': user.phone},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_vals
        )
        raise HTTPException(status_code=401, detail=f"Invalid PIN. Failed attempts: {failed}")
        
    # Reset attempts
    table.update_item(
        Key={'phone': user.phone},
        UpdateExpression="SET failed_attempts = :f, lockout_until = :l",
        ExpressionAttributeValues={':f': 0, ':l': 0}
    )
    
    exp = now + 900 # 15 mins
    token = jwt.encode({"phone": db_user['phone'], "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "message": "Login Successful",
        "token": token,
        "user_data": {
            "phone": db_user['phone'],
            "name": db_user['name'],
            "balance": float(db_user['balance']),
            "points": float(db_user.get('points', 0))
        }
    }

@app.get("/user/{phone}")
def get_user(phone: str, token_data: dict = Depends(verify_jwt)):
    if token_data['phone'] != phone:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    table = dynamodb.Table(USERS_TABLE)
    response = table.get_item(Key={'phone': phone})
    
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "phone": response['Item']['phone'],
        "name": response['Item']['name'],
        "balance": float(response['Item']['balance']),
        "points": float(response['Item'].get('points', 0))
    }

from fastapi import Header

@app.get("/admin/users")
def get_all_users(x_admin_key: str = Header(None)):
    if x_admin_key != "RAHSIA99":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")
        
    table = dynamodb.Table(USERS_TABLE)
    response = table.scan()
    items = response.get('Items', [])
    
    # Sort by balance descending
    users = []
    total_liquidity = 0
    for item in items:
        bal = float(item.get('balance', 0))
        total_liquidity += bal
        users.append({
            "phone": item.get('phone'),
            "name": item.get('name'),
            "balance": bal
        })
        
    users.sort(key=lambda x: x['balance'], reverse=True)
    
    return {
        "total_users": len(users),
        "total_liquidity": total_liquidity,
        "users": users
    }

@app.post("/transfer")
def request_transfer(req: TransferRequest, token_data: dict = Depends(verify_jwt)):
    if token_data['phone'] != req.sender_phone:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    users_table = dynamodb.Table(USERS_TABLE)
    
    sender = users_table.get_item(Key={'phone': req.sender_phone})
    if 'Item' not in sender:
        raise HTTPException(status_code=404, detail="Sender not found")
        
    if float(sender['Item']['balance']) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    is_real_user = req.receiver_phone not in ["Biller-001", "Vault-001"]
    if is_real_user:
        receiver = users_table.get_item(Key={'phone': req.receiver_phone})
        if 'Item' not in receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
            
    tac = str(random.randint(100000, 999999))
    
    users_table.update_item(
        Key={'phone': req.sender_phone},
        UpdateExpression="SET current_tac = :t",
        ExpressionAttributeValues={':t': tac}
    )
    
    return {
        "message": "TAC generated",
        "tac_required": True,
        "mock_tac_sms": tac
    }

@app.post("/transfer/confirm")
def confirm_transfer(req: TransferConfirmRequest, token_data: dict = Depends(verify_jwt)):
    if token_data['phone'] != req.sender_phone:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    users_table = dynamodb.Table(USERS_TABLE)
    tx_table = dynamodb.Table(TX_TABLE)
    
    sender = users_table.get_item(Key={'phone': req.sender_phone})
    if 'Item' not in sender:
        raise HTTPException(status_code=404, detail="Sender not found")
        
    stored_tac = sender['Item'].get('current_tac')
    if not stored_tac or stored_tac != req.tac:
        raise HTTPException(status_code=400, detail="Invalid TAC")
        
    users_table.update_item(
        Key={'phone': req.sender_phone},
        UpdateExpression="REMOVE current_tac"
    )
    
    if float(sender['Item']['balance']) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    is_real_user = req.receiver_phone not in ["Biller-001", "Vault-001"]
    if is_real_user:
        receiver = users_table.get_item(Key={'phone': req.receiver_phone})
        if 'Item' not in receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

    tx_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_balance = float(sender['Item']['balance']) - req.amount
    new_points = float(sender['Item'].get('points', 0)) + req.amount

    users_table.update_item(
        Key={'phone': req.sender_phone},
        UpdateExpression="SET balance = :val, points = :p",
        ExpressionAttributeValues={
            ':val': Decimal(str(new_balance)),
            ':p': Decimal(str(new_points))
        }
    )

    if is_real_user:
        new_receiver_balance = float(receiver['Item']['balance']) + req.amount
        users_table.update_item(
            Key={'phone': req.receiver_phone},
            UpdateExpression="SET balance = :val",
            ExpressionAttributeValues={':val': Decimal(str(new_receiver_balance))}
        )

    tx_table.put_item(
        Item={
            'tx_id': tx_id,
            'sender_phone': req.sender_phone,
            'receiver_phone': req.receiver_phone,
            'amount': Decimal(str(req.amount)),
            'description': req.description,
            'date': date_str
        }
    )

    if queue_url:
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=f"Process transfer {tx_id}: {req.amount} from {req.sender_phone} to {req.receiver_phone}"
        )

    return {
        "message": "Transfer successful and logged in AWS!",
        "tx_id": tx_id,
        "new_balance": new_balance
    }

@app.get("/transactions/{phone}")
def get_transactions(phone: str, token_data: dict = Depends(verify_jwt)):
    if token_data['phone'] != phone:
        raise HTTPException(status_code=401, detail="Unauthorized")
    tx_table = dynamodb.Table(TX_TABLE)
    
    # Since we didn't setup complex indexes for the demo, we will scan (fine for MVP)
    response = tx_table.scan()
    items = response.get('Items', [])
    
    # Filter for user
    user_txns = []
    for tx in items:
        if tx.get('sender_phone') == phone or tx.get('receiver_phone') == phone:
            user_txns.append({
                'tx_id': tx.get('tx_id'),
                'description': tx.get('description'),
                'amount': float(tx.get('amount')),
                'date': tx.get('date'),
                'type': 'out' if tx.get('sender_phone') == phone else 'in'
            })
            
    # Sort newest first
    user_txns.sort(key=lambda x: x['date'], reverse=True)
    return {"transactions": user_txns}

class TopUpRequest(BaseModel):
    phone: str
    amount: float

@app.post("/topup")
def top_up_account(req: TopUpRequest, token_data: dict = Depends(verify_jwt)):
    if token_data['phone'] != req.phone:
        raise HTTPException(status_code=401, detail="Unauthorized")
    users_table = dynamodb.Table(USERS_TABLE)
    tx_table = dynamodb.Table(TX_TABLE)
    
    user = users_table.get_item(Key={'phone': req.phone})
    if 'Item' not in user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_balance = float(user['Item']['balance']) + req.amount
    users_table.update_item(
        Key={'phone': req.phone},
        UpdateExpression="SET balance = :val",
        ExpressionAttributeValues={':val': Decimal(str(new_balance))}
    )
    
    tx_id = f"TOPUP-{uuid.uuid4().hex[:8].upper()}"
    date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    tx_table.put_item(
        Item={
            'tx_id': tx_id,
            'sender_phone': 'FPX-BANK',
            'receiver_phone': req.phone,
            'amount': Decimal(str(req.amount)),
            'description': 'FPX Top Up',
            'date': date_str
        }
    )
    return {"message": "Top up successful", "new_balance": new_balance, "tx_id": tx_id}

class RedeemRequest(BaseModel):
    phone: str

@app.post("/redeem")
def redeem_points(req: RedeemRequest, token_data: dict = Depends(verify_jwt)):
    if token_data['phone'] != req.phone:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    users_table = dynamodb.Table(USERS_TABLE)
    tx_table = dynamodb.Table(TX_TABLE)
    
    user = users_table.get_item(Key={'phone': req.phone})
    if 'Item' not in user:
        raise HTTPException(status_code=404, detail="User not found")
        
    current_points = float(user['Item'].get('points', 0))
    if current_points < 1000:
        raise HTTPException(status_code=400, detail="Insufficient points. Need 1000.")
        
    new_balance = float(user['Item']['balance']) + 10.0
    new_points = current_points - 1000
    
    users_table.update_item(
        Key={'phone': req.phone},
        UpdateExpression="SET balance = :val, points = :p",
        ExpressionAttributeValues={':val': Decimal(str(new_balance)), ':p': Decimal(str(new_points))}
    )
    
    tx_id = f"RWD-{uuid.uuid4().hex[:8].upper()}"
    date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    tx_table.put_item(
        Item={
            'tx_id': tx_id,
            'sender_phone': 'FunTech Rewards',
            'receiver_phone': req.phone,
            'amount': Decimal('10.0'),
            'description': 'Redeemed 1000 Points Cashback',
            'date': date_str
        }
    )
    return {"message": "Redeemed successfully", "new_balance": new_balance, "new_points": new_points, "tx_id": tx_id}

class UpdateUserRequest(BaseModel):
    phone: str
    name: str

@app.put("/user")
def update_user(req: UpdateUserRequest):
    users_table = dynamodb.Table(USERS_TABLE)
    user = users_table.get_item(Key={'phone': req.phone})
    if 'Item' not in user:
        raise HTTPException(status_code=404, detail="User not found")
        
    users_table.update_item(
        Key={'phone': req.phone},
        UpdateExpression="SET #nm = :n",
        ExpressionAttributeNames={'#nm': 'name'},
        ExpressionAttributeValues={':n': req.name}
    )
    return {"message": "User profile updated successfully"}

class DeleteUserRequest(BaseModel):
    phone: str

@app.delete("/user")
def delete_user(req: DeleteUserRequest):
    users_table = dynamodb.Table(USERS_TABLE)
    user = users_table.get_item(Key={'phone': req.phone})
    if 'Item' not in user:
        raise HTTPException(status_code=404, detail="User not found")
        
    users_table.delete_item(Key={'phone': req.phone})
    return {"message": "User account deleted successfully"}

app.mount('/', StaticFiles(directory='dist', html=True), name='static')

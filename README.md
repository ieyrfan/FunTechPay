<div align="center">
  <h1>FunTechPay Enterprise Platform</h1>
  <p>
    <strong>Next-Generation Digital Neo-Banking Proof of Concept</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/FastAPI-0.103-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/AWS-DynamoDB-232F3E?style=flat-square&logo=amazonaws" alt="AWS DynamoDB" />
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
  </p>
</div>

---

## Overview

**FunTechPay** is a comprehensive, full-stack mock digital banking ecosystem designed to demonstrate modern financial technology (FinTech) capabilities. Built on a monolithic architecture utilizing a highly responsive React frontend and a robust Python FastAPI backend, it serves as a technical showcase for enterprise-grade UI/UX design, AWS cloud integration, and innovative banking features.

## Core Capabilities

### 1. Interactive 3D Financial Dashboard
- **Spatial UI**: The virtual bank card implements dynamic CSS3 3D transforms (`perspective`, `rotateX`, `rotateY`) bound to cursor coordinates, simulating physical card depth.
- **Dynamic Glare**: Procedural glare effects mapped to user interaction for a premium, tactile user experience.

### 2. AI-Driven Financial Analysis
- **Behavioral Insights**: Implements heuristic algorithms to analyze real-time outflow distributions.
- **Predictive Warnings**: Identifies anomalous spending patterns (e.g., exceeding predefined category thresholds such as fast food) and triggers automated advisory alerts to encourage fiscal responsibility.

### 3. Integrated Split-Bill Engine
- **Algorithmic Division**: Calculates equitable sub-totals for group transactions.
- **Dynamic QR Generation**: Leverages client-side rendering to generate distinct DuitNow-compatible QR payloads (`split_XX`) for seamless peer-to-peer (P2P) reimbursements.

### 4. Automated Gamification & Loyalty System
- **Event-Driven Rewards**: Every outbound transaction automatically triggers state mutations in the DynamoDB `points` ledger.
- **Cashback Redemption**: Implements a threshold-based redemption endpoint (`/redeem`) that securely processes point deductions and credits fiat equivalents.

## Enterprise Security Implementation

Security is a foundational pillar of the FunTechPay architecture:

- **Stateless Session Management (JWT)**: Authentication relies on encrypted JSON Web Tokens with strict 15-minute expiration policies, minimizing horizontal escalation risks.
- **Brute-Force Mitigation**: Endpoint-level rate limiting restricts authentication attempts, resulting in temporary account lockouts upon sequential failures.
- **Multi-Factor Authorization**: Employs a Transaction Authorization Code (TAC) protocol requiring secondary 6-digit verification for all high-risk state mutations (e.g., fund transfers).

## System Architecture

The application operates on a unified monolithic paradigm optimized for rapid containerized deployment:

- **Frontend Environment**: Vite-optimized React SPA (Single Page Application) utilizing Glassmorphism design principles.
- **Backend Environment**: High-concurrency ASGI Python server powered by FastAPI.
- **Persistence Layer**: AWS DynamoDB utilized for schema-less, sub-millisecond document storage.
- **Infrastructure as Code**: Terraform configurations orchestrating an AWS EC2 deployment via Systems Manager (SSM) and S3 bundle transfers.

## Developer Setup

### Prerequisites
- Node.js (v18.x or higher)
- Python (v3.9 or higher)
- AWS CLI configured with active IAM credentials

### Local Initialization

**1. Clone the repository:**
```bash
git clone https://github.com/ieyrfan/FunTechPay.git
cd FunTechPay
```

**2. Initialize the Backend:**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**3. Initialize the Frontend (New Terminal):**
```bash
cd frontend
npm install
npm run dev
```
*The client environment will be accessible at `http://localhost:5173`.*

## Deployment Topology

The project includes an automated deployment pipeline (`unify_stack.py` -> `deploy_ec2.py`). The pipeline automatically compiles the Vite frontend, mounts it statically to the FastAPI application layer, compresses the payload, and orchestrates an AWS SSM deployment sequence to a target EC2 instance.

## Disclaimer

This system is a **Proof of Concept (POC)** developed strictly for educational and demonstrative purposes. It is not connected to any real banking APIs, payment gateways, or financial institutions. Do not input real banking credentials, NRIC, or sensitive personal data.

---
*Developed by ieyrfan.*

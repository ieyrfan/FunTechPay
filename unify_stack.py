import os
import subprocess
import shutil

def unify_stack():
    # 1. Update Frontend API calls to relative paths
    print("Updating React API calls to relative paths...")
    login_path = "c:/Users/User/Downloads/habiskan/aegispay/frontend/src/pages/Login.jsx"
    dash_path = "c:/Users/User/Downloads/habiskan/aegispay/frontend/src/pages/Dashboard.jsx"
    
    with open(login_path, 'r', encoding='utf-8') as f: content = f.read()
    content = content.replace("'https://6mlpz5qqbk.execute-api.us-east-1.amazonaws.com/login'", "'/login'")
    with open(login_path, 'w', encoding='utf-8') as f: f.write(content)
    
    with open(dash_path, 'r', encoding='utf-8') as f: content = f.read()
    content = content.replace("`https://6mlpz5qqbk.execute-api.us-east-1.amazonaws.com/transactions/${phone}`", "`/transactions/${phone}`")
    content = content.replace("'https://6mlpz5qqbk.execute-api.us-east-1.amazonaws.com/transfer'", "'/transfer'")
    with open(dash_path, 'w', encoding='utf-8') as f: f.write(content)

    # 2. Build Frontend
    print("Building React App...")
    subprocess.run(["cmd", "/c", "npm run build"], cwd="c:/Users/User/Downloads/habiskan/aegispay/frontend")

    # 3. Copy dist to backend
    print("Copying dist to backend...")
    src_dist = "c:/Users/User/Downloads/habiskan/aegispay/frontend/dist"
    dst_dist = "c:/Users/User/Downloads/habiskan/aegispay/backend/dist"
    if os.path.exists(dst_dist):
        shutil.rmtree(dst_dist)
    shutil.copytree(src_dist, dst_dist)

    # 4. Update Backend to serve StaticFiles
    print("Updating main.py to mount StaticFiles...")
    main_path = "c:/Users/User/Downloads/habiskan/aegispay/backend/main.py"
    with open(main_path, 'r') as f: main_content = f.read()
    
    if "from fastapi.staticfiles import StaticFiles" not in main_content:
        main_content = main_content.replace(
            "from fastapi import FastAPI, HTTPException",
            "from fastapi import FastAPI, HTTPException\nfrom fastapi.staticfiles import StaticFiles"
        )
        # Mount at the end
        main_content += "\n\napp.mount('/', StaticFiles(directory='dist', html=True), name='static')\n"
        with open(main_path, 'w') as f: f.write(main_content)

    print("Unification complete! Ready to deploy to EC2.")

if __name__ == "__main__":
    unify_stack()

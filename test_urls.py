import requests

url1 = "https://funtechpay-live-app-8fb71ff4.s3.amazonaws.com/index.html"
url2 = "https://s3.us-east-1.amazonaws.com/funtechpay-live-app-8fb71ff4/index.html"
url3 = "http://funtechpay-live-app-8fb71ff4.s3-website-us-east-1.amazonaws.com"

print("Testing URL 1 (HTTPS Virtual Hosted):")
r1 = requests.get(url1)
print(r1.status_code, r1.text[:100])

print("\nTesting URL 2 (HTTPS Path Style):")
r2 = requests.get(url2)
print(r2.status_code, r2.text[:100])

print("\nTesting URL 3 (HTTP Website Endpoint):")
r3 = requests.get(url3)
print(r3.status_code, r3.text[:100])

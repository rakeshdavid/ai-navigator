import requests
import json
import sys
from datetime import datetime

class AINavigatorAPITester:
    def __init__(self, base_url="https://5f6a5921-01eb-4826-9aa9-c3a3bfafbe22.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        else:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        print(f"Response: {json.dumps(response.json(), indent=2)}")
                    except:
                        print(f"Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"Response: {response.text[:200]}...")

            return success, response

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api",
            200
        )

    def test_status_endpoint(self):
        """Test the status endpoint"""
        return self.run_test(
            "Status Endpoint",
            "GET",
            "api/status",
            200
        )

    def test_create_status(self):
        """Test creating a status check"""
        data = {
            "client_name": f"test_client_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }
        return self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data=data
        )
    
    def test_generate_roadmap_free_query(self):
        """Test generating a roadmap with the free query"""
        data = {
            "business_goals": "Improve customer service with AI",
            "maturity_levels": {
                "AI Strategy": {"current": 1, "target": 3},
                "AI Value": {"current": 1, "target": 3},
                "AI Organization": {"current": 1, "target": 3},
                "People & Culture": {"current": 1, "target": 3}
            }
        }
        return self.run_test(
            "Generate Roadmap (Free Query)",
            "POST",
            "api/generate",
            200,
            data=data
        )
    
    def test_generate_roadmap_with_api_key(self):
        """Test generating a roadmap with a provided API key"""
        data = {
            "business_goals": "Improve customer service with AI",
            "maturity_levels": {
                "AI Strategy": {"current": 1, "target": 3},
                "AI Value": {"current": 1, "target": 3},
                "AI Organization": {"current": 1, "target": 3},
                "People & Culture": {"current": 1, "target": 3}
            }
        }
        headers = {
            "X-API-Key": "test-key-123",
            "X-API-Provider": "gemini"
        }
        return self.run_test(
            "Generate Roadmap (With API Key)",
            "POST",
            "api/generate",
            200,
            data=data,
            headers=headers
        )

def main():
    # Setup
    tester = AINavigatorAPITester()
    
    # Run basic API tests
    print("\n=== Basic API Tests ===")
    tester.test_root_endpoint()
    tester.test_status_endpoint()
    tester.test_create_status()
    
    # Run BYOK functionality tests
    print("\n=== BYOK Functionality Tests ===")
    tester.test_generate_roadmap_free_query()
    tester.test_generate_roadmap_with_api_key()

    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
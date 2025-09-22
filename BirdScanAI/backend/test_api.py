import requests
import time

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get("http://127.0.0.1:5001/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_search_endpoint():
    """Test the bird search endpoint"""
    try:
        response = requests.get("http://127.0.0.1:5001/search-bird?name=American%20Robin")
        print(f"Search test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found bird: {data.get('bird_details', {}).get('common_name', 'Unknown')}")
        return response.status_code in [200, 404]  # 404 is expected for some birds
    except Exception as e:
        print(f"Search test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing BirdScan AI API...")
    
    # Wait a moment for the server to start
    time.sleep(2)
    
    # Test health endpoint
    health_ok = test_health_endpoint()
    
    # Test search endpoint
    search_ok = test_search_endpoint()
    
    if health_ok and search_ok:
        print("✅ API tests passed!")
    else:
        print("❌ Some API tests failed!") 
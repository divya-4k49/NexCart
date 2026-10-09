import uvicorn
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  LAUNCHING NEXCART E-COMMERCE API (FASTAPI)")
    print("  NexCart – \"Your Next Shopping Experience\"")
    print("=" * 70)
    print("  Local API URL:       http://localhost:8000")
    print("  Interactive Docs:    http://localhost:8000/docs")
    print("  Alternative Docs:    http://localhost:8000/redoc")
    print("  Health Diagnostic:   http://localhost:8000/api/health")
    print("=" * 70 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

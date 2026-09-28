"""
KitchenOS FastAPI Application Entrypoint
Run with:
    uvicorn app:app --host 0.0.0.0 --port 8001 --reload
"""
from server import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)

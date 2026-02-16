from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, market
from sqlalchemy import text

# ... (omitted)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(market.router)
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Lunes Explorer Admin API"}

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, market
from sqlalchemy import text
import os

app = FastAPI(title="Lunes Explorer Admin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(market.router)
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Lunes Explorer Admin API"}

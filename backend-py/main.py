from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth
from sqlalchemy import text

# Create schema if not exists
with engine.connect() as conn:
    conn.execute(text("CREATE SCHEMA IF NOT EXISTS auth"))
    conn.commit()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lunes Explorer Admin API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporarily allow all for easier debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Lunes Explorer Admin API"}

from sqlalchemy import text
from database import SessionLocal, engine, Base
import models
import auth
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Creating schema 'auth' if not exists...")
    with engine.connect() as conn:
        conn.execute(text('CREATE SCHEMA IF NOT EXISTS auth'))
        conn.commit()
    logger.info("Creating tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created.")

    db = SessionLocal()
    
    admin_email = "cardeal@lunes.io"
    admin_password = os.environ.get("ADMIN_DEFAULT_PASSWORD")
    if not admin_password:
        raise RuntimeError("ADMIN_DEFAULT_PASSWORD environment variable is required for seeding.")
    
    user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not user:
        logger.info(f"Creating superuser {admin_email}...")
        hashed_password = auth.get_password_hash(admin_password)
        db_user = models.User(
            email=admin_email, 
            hashed_password=hashed_password,
            full_name="Admin Cardeal",
            is_active=True,
            is_superuser=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info("Superuser created successfully.")
    else:
        logger.info(f"Superuser {admin_email} already exists.")
    
    db.close()

if __name__ == "__main__":
    print("Running database initialization...")
    init_db()

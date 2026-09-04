import os
from sqlmodel import create_engine, SQLModel
from dotenv import load_dotenv

load_dotenv()

# SQLAlchemy requires the psycopg2 driver specified in the URL
raw_url = os.getenv("DATABASE_URL")
if raw_url and raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(raw_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
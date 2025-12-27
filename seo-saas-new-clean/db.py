from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, create_engine, Session

# SQLite database file
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=False)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    plan: str = Field(default="free")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OptimizationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    seo_score: int
    content_length: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

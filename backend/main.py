"""
Inbasket-Triage: Core Backend API
---------------------------------
Context: Healthcare providers get overwhelmed by unstructured patient messages in 
their EHR inbox (appointment requests, symptom reports, prescription refills, 
billing questions). This tool reduces provider inbox triage time by automatically 
classifying urgency, routing by category, extracting key clinical entities, and 
drafting a response for a human to review and approve. 

This is a human-in-the-loop system: it never auto-sends anything, mitigating 
risk while solving clinical inbasket overload.
"""

import enum
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum as SQLEnum, JSON, case
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel, Field

# ==========================================
# 1. DATABASE & ORM SETUP (SQLite)
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./inbasket.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. DATA MODELS (SQLAlchemy)
# ==========================================
class UrgencyLevel(str, enum.Enum):
    critical = "Critical"
    urgent = "Urgent"
    standard = "Standard"

class CategoryType(str, enum.Enum):
    clinical = "Clinical"
    billing = "Billing"
    prescription = "Prescription Refill"
    scheduling = "Scheduling"

class StatusLevel(str, enum.Enum):
    pending = "pending"
    approved = "approved"

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, index=True)
    raw_text = Column(Text, nullable=False)
    
    # AI-generated fields
    urgency = Column(SQLEnum(UrgencyLevel), nullable=True)
    category = Column(SQLEnum(CategoryType), nullable=True)
    extracted_entities = Column(JSON, nullable=True) # e.g., {"symptoms": [], "medications": []}
    ai_draft = Column(Text, nullable=True)
    
    # Workflow state
    status = Column(SQLEnum(StatusLevel), default=StatusLevel.pending, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# ==========================================
# 3. SCHEMAS (Pydantic)
# ==========================================
class MessageBase(BaseModel):
    patient_name: str
    raw_text: str

class MessageUpdate(BaseModel):
    ai_draft: Optional[str] = None
    status: Optional[StatusLevel] = None

class MessageOut(MessageBase):
    id: int
    urgency: Optional[UrgencyLevel]
    category: Optional[CategoryType]
    extracted_entities: Optional[Dict[str, Any]]
    ai_draft: Optional[str]
    status: StatusLevel
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# 4. FASTAPI APP & ENDPOINTS
# ==========================================
app = FastAPI(title="Inbasket-Triage API", description="LLM-powered clinical inbox copilot")

# Allow frontend to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/messages", response_model=List[MessageOut])
def list_messages(db: Session = Depends(get_db)):
    """
    List all messages, sorting unresolved items by urgency first.
    Critical > Urgent > Standard.
    """
    # Custom SQL sort order for enums
    urgency_sort = case(
        (Message.urgency == UrgencyLevel.critical, 1),
        (Message.urgency == UrgencyLevel.urgent, 2),
        (Message.urgency == UrgencyLevel.standard, 3),
        else_=4
    )
    
    messages = db.query(Message).order_by(
        Message.status, # Pending first, then approved
        urgency_sort, 
        Message.created_at.desc()
    ).all()
    
    return messages

@app.get("/messages/{message_id}", response_model=MessageOut)
def get_message(message_id: int, db: Session = Depends(get_db)):
    """Fetch a single message by ID."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message

@app.patch("/messages/{message_id}", response_model=MessageOut)
def update_message(message_id: int, updates: MessageUpdate, db: Session = Depends(get_db)):
    """Update AI draft text and/or approve the message."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(message, key, value)
        
    db.commit()
    db.refresh(message)
    return message

@app.post("/messages/seed")
def trigger_seed(db: Session = Depends(get_db)):
    """
    Trigger the seed script to populate realistic fake patient messages 
    and process them through the LLM pipeline.
    """
    # TODO: Implement seed script call (Part 4)
    # e.g., seed_database(db)
    return {"status": "Seed initiated - (Implementation pending)"}
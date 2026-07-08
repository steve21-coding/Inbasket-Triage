"""
Inbasket-Triage: Database Seeder
--------------------------------
Generates 8 realistic patient messages designed to explicitly trigger all combinations
of Urgency (Critical, Urgent, Standard) and Category (Clinical, Billing, Prescription, Scheduling).
Runs them through the LLM triage service, and saves them to the database.
"""

import time
from sqlalchemy.orm import Session
from main import SessionLocal, Message, engine, Base
from llm_service import process_patient_message

# Re-create tables just in case
Base.metadata.create_all(bind=engine)

SEED_MESSAGES = [
    # 1. Clinical / Critical
    {
        "patient_name": "James Wilson",
        "raw_text": "I am having severe chest pain right now, it feels like an elephant is sitting on my chest and my left arm is completely numb. I'm having trouble breathing."
    },
    # 2. Clinical / Urgent
    {
        "patient_name": "Maria Garcia",
        "raw_text": "My surgical incision from Tuesday is bright red, oozing yellow pus, and I just took my temperature—it's 102.5. It hurts significantly more than yesterday."
    },
    # 3. Clinical / Standard
    {
        "patient_name": "David Chen",
        "raw_text": "I've had a mild headache on and off for the past two days. I've been drinking plenty of water, but should I take Tylenol or Ibuprofen for this?"
    },
    # 4. Prescription Refill / Urgent
    {
        "patient_name": "Sarah Jenkins",
        "raw_text": "I dropped my Albuterol inhaler in a puddle and it's ruined. My asthma is acting up and I'm starting to wheeze. Can you please send an emergency replacement to the CVS on Main St right away?"
    },
    # 5. Prescription Refill / Standard
    {
        "patient_name": "Linda Smith",
        "raw_text": "Hi, I am out of refills for my Atorvastatin 20mg. I know I'm due for lab work soon, but can I get a 30-day supply sent to my pharmacy so I don't miss any doses?"
    },
    # 6. Billing / Standard
    {
        "patient_name": "Robert Taylor",
        "raw_text": "I got a bill in the mail today for $150 from my visit last month, but my Explanation of Benefits says my copay should only be $20. Can someone explain these charges?"
    },
    # 7. Scheduling / Urgent
    {
        "patient_name": "Michael Chang",
        "raw_text": "I just tested positive for COVID-19 this morning. I need to cancel my in-person physical scheduled for tomorrow at 9 AM, but I would like to do a telehealth visit instead if possible."
    },
    # 8. Scheduling / Standard
    {
        "patient_name": "Emma Thompson",
        "raw_text": "Hello, I need to reschedule my annual wellness checkup that's booked for next month. Tuesday mornings don't work for me anymore, do you have anything on a Thursday afternoon?"
    }
]

def run_seed():
    db: Session = SessionLocal()
    
    print("Clearing existing messages...")
    db.query(Message).delete()
    db.commit()
    
    print(f"Seeding {len(SEED_MESSAGES)} categorized messages. This will take a moment as it calls the LLM...")
    
    for idx, msg_data in enumerate(SEED_MESSAGES):
        print(f"[{idx+1}/{len(SEED_MESSAGES)}] Processing message for {msg_data['patient_name']}...")
        
        # Call LLM to triage and draft response
        triage_data = process_patient_message(msg_data["raw_text"])
        
        # Combine raw data with LLM generated data
        db_message = Message(
            patient_name=msg_data["patient_name"],
            raw_text=msg_data["raw_text"],
            urgency=triage_data.get("urgency"),
            category=triage_data.get("category"),
            extracted_entities=triage_data.get("extracted_entities"),
            ai_draft=triage_data.get("ai_draft"),
            status="pending"
        )
        
        db.add(db_message)
        
        # Sleep briefly to avoid hitting OpenAI rate limits
        time.sleep(1.5)

    db.commit()
    db.close()
    print("✅ Seeding complete! Database is populated with diverse clinical scenarios.")

if __name__ == "__main__":
    run_seed()

"""
Inbasket-Triage: LLM Integration Service (Gemini Version)
----------------------------------------
Handles the core AI logic: formatting the system prompt, enforcing structured 
JSON output via Pydantic, and managing API retries/fallbacks using Google's Gemini.
"""

import os
from typing import List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load the secret keys from the .env file
load_dotenv()

# Initialize Gemini client
# We use gemini-2.5-flash as it is fast, free-tier eligible, and excellent at structured extraction
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", "dummy_key"))
MODEL_ID = "gemini-2.5-flash"

# ==========================================
# 1. LLM OUTPUT SCHEMAS (Pydantic)
# ==========================================
# These mirror the SQLAlchemy Enums in main.py to ensure perfect mapping

class ExtractedEntities(BaseModel):
    symptoms: list[str] = Field(description="List of physical or mental symptoms mentioned. Empty list if none.")
    medications: list[str] = Field(description="List of medications mentioned. Empty list if none.")
    vitals: list[str] = Field(description="Any vital signs mentioned (e.g., '101 fever', '140/90 bp'). Empty list if none.")

class LLMTriageResponse(BaseModel):
    urgency: str = Field(
        description="Must be exactly one of: 'Critical', 'Urgent', or 'Standard'"
    )
    category: str = Field(
        description="Must be exactly one of: 'Clinical', 'Billing', 'Prescription Refill', or 'Scheduling'"
    )
    extracted_entities: ExtractedEntities
    ai_draft: str = Field(
        description="A drafted response to the patient. Must be HIPAA-compliant, warm but clinical, and never provide a definitive diagnosis."
    )

# ==========================================
# 2. SYSTEM PROMPT
# ==========================================
SYSTEM_PROMPT = """
You are an expert clinical AI assistant integrated into a healthcare provider's Electronic Health Record (EHR) system.
Your goal is to mitigate "inbasket overload" by triaging incoming patient messages, extracting key clinical data, and drafting a response for the provider to review.

INSTRUCTIONS:
1. Categorize the message into exactly one of: 'Clinical', 'Billing', 'Prescription Refill', or 'Scheduling'.
2. Assign an urgency level:
   - 'Critical': Medical emergencies, mentions of severe chest pain, stroke symptoms, suicidal ideation, or extreme difficulty breathing. (Draft should advise calling 911/going to ER).
   - 'Urgent': Acute illness, infections, worsening of existing conditions needing attention within 24 hours.
   - 'Standard': Routine refills, scheduling, billing, or general non-acute questions.
3. Extract relevant clinical entities (symptoms, medications, vitals) into lists. If none exist, return empty lists.
4. Draft a response to the patient.
   - Tone: Warm, professional, empathetic, and clinical. 
   - Constraint: NEVER provide a definitive medical diagnosis. Use phrasing like "This sounds like it could be..." or "The doctor will need to evaluate...".
   - Constraint: Maintain HIPAA compliance (do not unnecessarily repeat sensitive PII if not needed for context, though the channel is secure).
   - Sign off the draft with: "Drafted by AI Assistant - Pending Provider Review"

Keep the draft concise, actionable, and ready for a human doctor or nurse to quickly approve or slightly edit.
"""

# ==========================================
# 3. CORE SERVICE FUNCTION
# ==========================================
def process_patient_message(raw_text: str, retries: int = 1) -> dict:
    """
    Calls Gemini to triage a message. Enforces structured output via Pydantic.
    If it fails, it retries once. If it completely fails, returns a safe fallback.
    """
    for attempt in range(retries + 1):
        try:
            # Configure the request to strictly follow our Pydantic schema
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=f"Patient Message: {raw_text}",
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=LLMTriageResponse,
                    temperature=0.0 # Deterministic output
                ),
            )
            
            # The new SDK automatically parses the JSON back into the Pydantic object
            triage_result = response.parsed
            
            return triage_result.model_dump()
            
        except Exception as e:
            print(f"LLM attempt {attempt + 1} failed: {str(e)}")
            if attempt == retries:
                # ==========================================
                # 4. GRACEFUL FALLBACK
                # ==========================================
                print("Max retries reached. Using fallback triage.")
                return {
                    "urgency": "Standard",
                    "category": "Clinical",
                    "extracted_entities": {"symptoms": [], "medications": [], "vitals": []},
                    "ai_draft": (
                        "Thank you for your message. We have received it and a member "
                        "of our clinical team will review it shortly. If this is a medical "
                        "emergency, please call 911 or go to the nearest emergency room.\n\n"
                        "[SYSTEM NOTE: AI draft failed. Manual review required.]"
                    )
                }

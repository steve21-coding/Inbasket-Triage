# Inbasket-Triage: AI Clinical Copilot

An LLM-powered clinical inbox copilot that triages, extracts entities, and auto-drafts responses to patient EHR messages.

## Context & Problem Statement

Healthcare providers get overwhelmed by unstructured patient messages in their EHR inbox — ranging from routine appointment requests to critical symptom reports. This tool reduces provider inbox triage time and eases administrative bottlenecks by automatically classifying urgency, routing messages by category, extracting key clinical entities (symptoms, meds, vitals), and drafting a response for a human to review.

By maintaining a HIPAA-compliant tone and requiring explicit human approval before any message is sent, this copilot helps with clinical inbasket overload without assuming medical liability.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`), structured output via Pydantic schemas

## Local Setup & Installation

### 1. Backend Setup

Requires Python 3.9+.

```bash
# Enter the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file with your Gemini API key
echo "GEMINI_API_KEY=your-api-key-here" > .env

# Run the seed script to populate the SQLite database with mock patient messages
python seed_script.py

# Start the FastAPI server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. You can view the interactive API docs at `http://localhost:8000/docs`.

> **Note:** `requirements.txt` currently lists `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic`, and `openai`, but `llm_service.py` actually uses `google-genai` and `python-dotenv`. Update `requirements.txt` to match before running `pip install`, or install those two packages manually.

> **Note:** The `POST /messages/seed` endpoint (used by the "Seed Mock Data" button in the UI) is currently a stub and does not call `seed_script.py` yet. Run the seed script manually from the command line for now.

### 2. Frontend Setup

Requires Node.js 18+.

```bash
# Open a new terminal tab and enter the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173`. It expects the FastAPI backend to be running on port 8000.

## AI-Assisted Development

This project was built as a rapid prototype (roughly 3-4 hours) with heavy use of LLM assistance for scaffolding, boilerplate, and UI iteration — freeing up time to focus on the domain logic (urgency/category classification, structured entity extraction) and the human-in-the-loop review workflow. The backend's Pydantic-enforced structured output and the frontend's split-pane triage UI were both built and refined iteratively with AI pair-programming.

## Architecture Notes

- **Human-in-the-loop by design:** the system never auto-sends a response. Every AI draft lands in a `pending` state and requires explicit provider approval via the `PATCH /messages/{id}` endpoint.
- **Structured output over free-form JSON:** the LLM response is validated against a Pydantic schema (`LLMTriageResponse`) rather than parsed as loose JSON, so malformed or missing fields fail fast instead of silently corrupting data.
- **Graceful degradation:** if the LLM call fails after retries, `process_patient_message` returns a safe fallback response (flagged for manual review) rather than crashing the request.

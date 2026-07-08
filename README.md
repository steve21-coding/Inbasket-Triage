Inbasket-Triage: AI Clinical Copilot

An LLM-powered clinical inbox copilot that triages, extracts entities, and auto-drafts responses to patient EHR messages.

Context & Problem Statement

Healthcare providers get overwhelmed by unstructured patient messages in their EHR inbox—ranging from routine appointment requests to critical symptom reports. This tool dramatically reduces provider inbox triage time and eases administrative bottlenecks by automatically classifying urgency, routing messages by category, extracting key clinical entities (symptoms, meds, vitals), and drafting a response for a human to review.

By maintaining a HIPAA-compliant tone and requiring explicit human approval before any message is sent, this copilot safely mitigates clinical inbasket overload without assuming medical liability.

Tech Stack

Backend: Python, FastAPI, SQLAlchemy, SQLite

Frontend: React, Vite, Tailwind CSS, Lucide Icons

AI Integration: OpenAI API (gpt-4o-mini), Pydantic Structured Outputs

Local Setup & Installation

1. Backend Setup

Requires Python 3.9+.

# Clone the repository and enter the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic openai

# Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"  # On Windows: set OPENAI_API_KEY="your-api-key-here"

# Run the seed script to populate the SQLite database with mock patient messages
python seed.py

# Start the FastAPI server
uvicorn main:app --reload


The API will be available at http://localhost:8000. You can view the interactive API docs at http://localhost:8000/docs.

2. Frontend Setup

Requires Node.js 18+.

# Open a new terminal tab and enter the frontend directory
cd frontend

# Install dependencies
npm install
npm install lucide-react

# Start the Vite development server
npm run dev


The frontend will run at http://localhost:5173. It expects the FastAPI backend to be running on port 8000.

AI-Assisted Development Log

This project was developed as a 3-4 hour rapid prototype. I utilized Large Language Models (LLMs) to accelerate the scaffolding and boilerplate generation, allowing me to focus heavily on the domain logic, strict AI output parsing, and clinical UI/UX.

Prompts & Iterations

Detail how you prompted the AI for the backend, frontend, and LLM services here.

System Prompt Engineering: (e.g., Explain how you forced the LLM to output valid JSON and avoid giving medical diagnoses.)

Component Architecture: (e.g., Explain how you guided the AI to build the React split-pane inbox view.)

Bugs Encountered & AI Troubleshooting

Detail a specific bug you ran into during development and how you used an LLM to debug it.

Bug 1:

Resolution:

Architecture Decisions Driven by AI

Discuss any structural decisions (like using Pydantic structured parsing vs standard JSON generation).

Decision 1:

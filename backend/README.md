# Milwaukee Tool Tracker

A simple web app for sales managers to track Milwaukee tool samples
and transfer them from the central Warehouse to country Demo Accounts.

Built for the Milwaukee ONE-KEY EMEA Weekend Challenge.

---

## What it does

- Shows all tool samples in the Warehouse with their current status
- Lets a sales manager select tools using checkboxes
- Transfers selected tools to a country Demo Account in one click
- Available in English and German
- Logs every action automatically

---

## How to run it locally (under 5 minutes)

### You will need
- Python 3.10 or higher
- Node.js 18 or higher

### Step 1 — Start the back-end

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is now running at: http://127.0.0.1:8000  
Interactive API docs: http://127.0.0.1:8000/docs

### Step 2 — Start the front-end

Open a second Terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The app is now running at: http://localhost:5173

### Step 3 — Open the app

Go to http://localhost:5173 in your browser.  
Login is handled automatically in the background.

---

## Project structure

```
milwaukee-challenge/
├── backend/
│   ├── main.py          — FastAPI server with all 3 endpoints
│   ├── openapi.yaml     — OpenAPI 3.0 specification
│   ├── requirements.txt — Python dependencies
│   └── actions.log      — Auto-generated action log
└── frontend/
    └── src/
        ├── translations.js — All UI text in English and German
        ├── api.js          — All API calls in one place
        ├── App.jsx         — Main screen component
        └── App.css         — Styling
```

---

## API endpoints

| Endpoint | Method | What it does |
|---|---|---|
| /auth/token | POST | Login — returns a session token |
| /tools | GET | Returns all tools from the Warehouse |
| /transfer | POST | Moves selected tools to a country Demo Account |

---

## Test login credentials

- client_id: `demo-client`
- client_secret: `demo-secret`

---

## What I would do with more time

- Add a real database so transfers persist after a server restart
- Add a visible audit log in the UI filterable by date and country
- Add email notifications to country teams when tools arrive
- Add a login screen with different permission levels
- Deploy it online so no local setup is needed
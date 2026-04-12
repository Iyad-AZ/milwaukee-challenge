# Milwaukee Tool Tracker

A web app for sales managers to track Milwaukee tool samples across
the central Warehouse and country Demo Accounts.

Built for the Milwaukee ONE-KEY EMEA Weekend Challenge.

---

## What it does

- 7 separate accounts — 1 Warehouse Admin + 6 country Demo Accounts
- Warehouse Admin sees all 20 tools and can transfer or return any of them
- Each Demo Account sees only their country's tools + Warehouse tools
- Transfer tools from Warehouse to any country Demo Account
- Transfer tools between country Demo Accounts
- Return tools from Demo Account back to Warehouse
- Confirmation dialog before every action
- Real-time search filter
- Transfer history with tool names
- SQLite database — all data persists after server restart
- Full audit log written automatically
- Available in English and German

---

## Login credentials

| Account | Password | Access |
|---|---|---|
| warehouse-admin | warehouse123 | All 20 tools |
| demo-de | germany123 | Warehouse + DE Demo |
| demo-fr | france123 | Warehouse + FR Demo |
| demo-it | italy123 | Warehouse + IT Demo |
| demo-es | spain123 | Warehouse + ES Demo |
| demo-uk | uk123 | Warehouse + UK Demo |
| demo-pl | poland123 | Warehouse + PL Demo |

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

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The app is now running at: http://localhost:5173

### Step 3 — Open the app

Go to http://localhost:5173 in your browser and log in with any of the credentials above.

---

## Project structure
milwaukee-challenge/
├── backend/
│   ├── main.py          — FastAPI server with all endpoints
│   ├── openapi.yaml     — OpenAPI 3.0 specification
│   ├── requirements.txt — Python dependencies
│   └── tools.db         — SQLite database (auto-created on first run)
├── frontend/
│   └── src/
│       ├── translations.js — All UI text in English and German
│       ├── api.js          — All API calls in one place
│       ├── App.jsx         — Main screen component
│       └── App.css         — Milwaukee-branded styling
├── postman/
│   └── Milwaukee_Tool_Tracker.postman_collection.json
└── README.md

---

## API endpoints

| Endpoint | Method | What it does |
|---|---|---|
| /auth/token | POST | Login — returns a session token with role and country |
| /tools | GET | Returns tools filtered by account role |
| /transfer | POST | Moves selected tools to a country Demo Account |
| /return | POST | Returns selected tools back to Warehouse |
| /history | GET | Returns last 10 transfers with tool names |

---

## What I would do with more time

- Deploy online so no local setup is needed
- Add email notifications to country teams when tools arrive
- Add a dashboard with statistics — how many tools per country, transfer frequency
- Add pagination for larger inventories
- Add an admin panel to manage user accounts
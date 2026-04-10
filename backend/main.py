from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import jwt
import datetime
import logging
import sqlite3
import os

app = FastAPI(
    title="Milwaukee Tool Tracker API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    filename="actions.log",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

SECRET_KEY = "milwaukee-secret-key-2024"
VALID_CLIENT_ID = "demo-client"
VALID_CLIENT_SECRET = "demo-secret"

MESSAGES = {
    "en": {
        "wrong_login":   "Your login details are incorrect. Please check and try again.",
        "expired":       "Your session has expired. Please log in again.",
        "no_permission": "You do not have permission to do this.",
        "server_error":  "Something went wrong. Please try again in a moment.",
        "transfer_ok":   "Tools transferred successfully.",
    },
    "de": {
        "wrong_login":   "Ihre Anmeldedaten sind falsch. Bitte prüfen Sie diese und versuchen Sie es erneut.",
        "expired":       "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
        "no_permission": "Sie haben keine Berechtigung, dies zu tun.",
        "server_error":  "Etwas ist schiefgelaufen. Bitte versuchen Sie es gleich erneut.",
        "transfer_ok":   "Werkzeuge erfolgreich übertragen.",
    }
}

def get_message(lang: str, key: str) -> str:
    return MESSAGES.get(lang, MESSAGES["en"]).get(key, MESSAGES["en"][key])

# ─────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────

DB_PATH = "tools.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tools (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            location TEXT NOT NULL
        )
    """)
    cursor.execute("SELECT COUNT(*) FROM tools")
    count = cursor.fetchone()[0]
    if count == 0:
        initial_tools = [
            ("T001", "M18 FUEL Drill",         "available", "Warehouse"),
            ("T002", "M18 Circular Saw",        "available", "Warehouse"),
            ("T003", "M18 Impact Driver",       "in demo",   "DE Demo"),
            ("T004", "M12 Screwdriver Set",     "available", "Warehouse"),
            ("T005", "M18 Reciprocating Saw",   "available", "Warehouse"),
            ("T006", "M18 Angle Grinder",       "available", "Warehouse"),
            ("T007", "M18 Rotary Hammer",       "in demo",   "FR Demo"),
            ("T008", "M12 Right Angle Drill",   "available", "Warehouse"),
        ]
        cursor.executemany(
            "INSERT INTO tools (id, name, status, location) VALUES (?, ?, ?, ?)",
            initial_tools
        )
        conn.commit()
    conn.close()

init_db()

# ─────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────

class TokenRequest(BaseModel):
    client_id: str
    client_secret: str
    lang: Optional[str] = "en"

class TransferRequest(BaseModel):
    tool_ids: List[str]
    target_country: str
    lang: Optional[str] = "en"

# ─────────────────────────────────────────
# TOKEN HELPER
# ─────────────────────────────────────────

def verify_token(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail=get_message("en", "expired"))
    token = authorization.split(" ")[1]
    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=get_message("en", "expired"))
    except Exception:
        raise HTTPException(status_code=401, detail=get_message("en", "expired"))

# ─────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────

@app.post("/auth/token")
def get_token(req: TokenRequest):
    if req.client_id != VALID_CLIENT_ID or req.client_secret != VALID_CLIENT_SECRET:
        logging.warning(f"Failed login — client_id: {req.client_id}")
        raise HTTPException(status_code=401, detail=get_message(req.lang, "wrong_login"))
    token = jwt.encode(
        {
            "sub": req.client_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        },
        SECRET_KEY,
        algorithm="HS256"
    )
    logging.info(f"Successful login — client_id: {req.client_id}")
    return {"access_token": token, "expires_in": 7200}


@app.get("/tools")
def get_tools(authorization: str = Header(None)):
    verify_token(authorization)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tools")
    tools = [dict(row) for row in cursor.fetchall()]
    conn.close()
    logging.info("Tool list fetched from database")
    return tools


@app.post("/transfer")
def transfer_tools(req: TransferRequest, authorization: str = Header(None)):
    verify_token(authorization)
    conn = get_db()
    cursor = conn.cursor()
    transferred = []
    for tool_id in req.tool_ids:
        cursor.execute(
            "UPDATE tools SET status = 'in demo', location = ? WHERE id = ? AND status = 'available'",
            (f"{req.target_country} Demo", tool_id)
        )
        if cursor.rowcount > 0:
            transferred.append(tool_id)
    conn.commit()
    conn.close()
    logging.info(f"Transferred {transferred} → {req.target_country} Demo")
    return {
        "message": get_message(req.lang, "transfer_ok"),
        "transferred": transferred
    }
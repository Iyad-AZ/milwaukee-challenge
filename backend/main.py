from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import jwt
import datetime
import logging

# Create the FastAPI app
app = FastAPI(
    title="Milwaukee Tool Tracker API",
    description="Tracks tool samples across Warehouse and Demo Accounts",
    version="1.0.0"
)

# Allow the front-end (running on a different port) to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging — writes every action to a file called actions.log
logging.basicConfig(
    filename="actions.log",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# Secret key used to sign login tokens — never share this in a real app
SECRET_KEY = "milwaukee-secret-key-2024"

# The one valid login for this mock app
VALID_CLIENT_ID = "demo-client"
VALID_CLIENT_SECRET = "demo-secret"

# All user-facing messages in both languages
# This is the structured translation system the spec requires
MESSAGES = {
    "en": {
        "wrong_login":  "Your login details are incorrect. Please check and try again.",
        "expired":      "Your session has expired. Please log in again.",
        "no_permission":"You do not have permission to do this.",
        "server_error": "Something went wrong. Please try again in a moment.",
        "transfer_ok":  "Tools transferred successfully.",
    },
    "de": {
        "wrong_login":  "Ihre Anmeldedaten sind falsch. Bitte prüfen Sie diese und versuchen Sie es erneut.",
        "expired":      "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
        "no_permission":"Sie haben keine Berechtigung, dies zu tun.",
        "server_error": "Etwas ist schiefgelaufen. Bitte versuchen Sie es gleich erneut.",
        "transfer_ok":  "Werkzeuge erfolgreich übertragen.",
    }
}

def get_message(lang: str, key: str) -> str:
    """Get a translated message. Falls back to English if language not found."""
    return MESSAGES.get(lang, MESSAGES["en"]).get(key, MESSAGES["en"][key])

# Mock tool data — this is your fake warehouse inventory
# In a real app this would come from a database
TOOLS = [
    {"id": "T001", "name": "M18 FUEL Drill",           "status": "available", "location": "Warehouse"},
    {"id": "T002", "name": "M18 Circular Saw",          "status": "available", "location": "Warehouse"},
    {"id": "T003", "name": "M18 Impact Driver",         "status": "in demo",   "location": "DE Demo"},
    {"id": "T004", "name": "M12 Screwdriver Set",       "status": "available", "location": "Warehouse"},
    {"id": "T005", "name": "M18 Reciprocating Saw",     "status": "available", "location": "Warehouse"},
    {"id": "T006", "name": "M18 Angle Grinder",         "status": "available", "location": "Warehouse"},
    {"id": "T007", "name": "M18 Rotary Hammer",         "status": "in demo",   "location": "FR Demo"},
    {"id": "T008", "name": "M12 Right Angle Drill",     "status": "available", "location": "Warehouse"},
]

# These classes define the shape of incoming requests
# FastAPI uses them to automatically validate what comes in
class TokenRequest(BaseModel):
    client_id: str
    client_secret: str
    lang: Optional[str] = "en"

class TransferRequest(BaseModel):
    tool_ids: List[str]
    target_country: str
    lang: Optional[str] = "en"

def verify_token(authorization: str):
    """
    Check that the Authorization header contains a valid token.
    Called at the start of every protected endpoint.
    """
    if not authorization or not authorization.startswith("Bearer "):
        logging.warning("Request rejected — no token provided")
        raise HTTPException(
            status_code=401,
            detail=get_message("en", "expired")
        )

    token = authorization.split(" ")[1]  # Extract the token after "Bearer "

    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        logging.warning("Request rejected — token expired")
        raise HTTPException(status_code=401, detail=get_message("en", "expired"))
    except Exception:
        logging.warning("Request rejected — invalid token")
        raise HTTPException(status_code=401, detail=get_message("en", "expired"))
    

    # ─────────────────────────────────────────
# ENDPOINT 1: /auth/token
# The login door — give credentials, get a key
# ─────────────────────────────────────────
@app.post("/auth/token")
def get_token(req: TokenRequest):
    # Check if credentials are correct
    if req.client_id != VALID_CLIENT_ID or req.client_secret != VALID_CLIENT_SECRET:
        logging.warning(f"Failed login — client_id: {req.client_id}")
        raise HTTPException(
            status_code=401,
            detail=get_message(req.lang, "wrong_login")
        )

    # Create a token that expires in 2 hours
    token = jwt.encode(
        {
            "sub": req.client_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    logging.info(f"Successful login — client_id: {req.client_id}")
    return {
        "access_token": token,
        "expires_in": 7200  # 2 hours in seconds
    }


# ─────────────────────────────────────────
# ENDPOINT 2: /tools
# The warehouse shelf — show all tools
# ─────────────────────────────────────────
@app.get("/tools")
def get_tools(authorization: str = Header(None)):
    verify_token(authorization)  # Security check first

    logging.info("Tool list fetched successfully")
    return TOOLS


# ─────────────────────────────────────────
# ENDPOINT 3: /transfer
# Move selected tools to a country Demo Account
# ─────────────────────────────────────────
@app.post("/transfer")
def transfer_tools(req: TransferRequest, authorization: str = Header(None)):
    verify_token(authorization)  # Security check first

    transferred = []

    for tool in TOOLS:
        if tool["id"] in req.tool_ids:
            if tool["status"] != "available":
                continue  # Skip tools that are already in demo
            tool["status"] = "in demo"
            tool["location"] = f"{req.target_country} Demo"
            transferred.append(tool["id"])

    logging.info(f"Transferred tools {transferred} → {req.target_country} Demo")

    return {
        "message": get_message(req.lang, "transfer_ok"),
        "transferred": transferred
    }
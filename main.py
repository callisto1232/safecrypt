import base64
import json
from io import BytesIO
import os
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from cryptography.fernet import Fernet, InvalidToken
import qrcode

# Generate a global Fernet key for encryption/decryption.
# In a real-world production scenario, this key should be generated once 
# and stored securely in environment variables (e.g., os.getenv("SECRET_KEY")).
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set.")
fernet = Fernet(SECRET_KEY)
app = FastAPI(title="Secure QR Transaction API")

# Add CORS Middleware to allow requests from React frontends 
# running on different ports during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Request & Response Validation ---

class GenerateRequest(BaseModel):
    message: str

class GenerateResponse(BaseModel):
    qr_image_base64: str
    ciphertext: str

class ScanRequest(BaseModel):
    ciphertext: str

class ScanResponse(BaseModel):
    success: bool
    data: dict

# --- API Endpoints ---

@app.post("/api/qr/generate", response_model=GenerateResponse)
async def generate_qr(request: GenerateRequest):
    """
    Encrypts transaction data and generates a QR code containing the ciphertext.
    """
    # 1. Prepare the payload
    payload = {
        "message": request.message
    }
    
    # 2. Convert payload to JSON bytes
    payload_bytes = json.dumps(payload).encode('utf-8')
    
    # 3. Encrypt the payload using Fernet
    # Fernet automatically embeds the current timestamp into the token,
    # which is required for our replay attack prevention (TTL check later).
    ciphertext_bytes = fernet.encrypt(payload_bytes)
    ciphertext = ciphertext_bytes.decode('utf-8')
    
    # 4. Generate the QR Code containing ONLY the ciphertext string
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(ciphertext)
    qr.make(fit=True)
    
    # 5. Save the QR code image to an in-memory buffer
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    
    # 6. Convert the image buffer to a base64-encoded Data URI
    img_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    data_uri = f"data:image/png;base64,{img_b64}"
    
    return GenerateResponse(
        qr_image_base64=data_uri,
        ciphertext=ciphertext
    )


@app.post("/api/qr/scan", response_model=ScanResponse)
async def scan_qr(request: ScanRequest):
    """
    Scans the ciphertext, decrypts it with a 60-second TTL, and returns the data.
    """
    try:
        # 1. Decrypt the ciphertext
        # The ttl=60 parameter enforces that the token was generated within the last 60 seconds.
        # If the token is older than 60 seconds or tampered with, InvalidToken is raised.
        ciphertext_bytes = request.ciphertext.encode('utf-8')
        decrypted_bytes = fernet.decrypt(ciphertext_bytes, ttl=60)
        
        # 2. Parse the decrypted JSON data
        decrypted_data = json.loads(decrypted_bytes.decode('utf-8'))
        
        return ScanResponse(
            success=True,
            data=decrypted_data
        )
        
    except InvalidToken:
        # Catch tampering or expiration (replay attack prevention)
        raise HTTPException(
            status_code=400,
            detail="The QR code is invalid, tampered with, or expired."
        )
    except json.JSONDecodeError:
        # Failsafe in case decryption somehow yields invalid JSON
        raise HTTPException(
            status_code=400,
            detail="The decrypted data is not valid JSON."
        )
    except Exception as e:
        # Catch-all for any other unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

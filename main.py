import base64
import json
import time
from io import BytesIO
import os
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
import qrcode

# --- 1. Symmetric Encryption Setup (AES via Fernet) ---
# Generate a global Fernet key for encryption/decryption.
# In a real-world production scenario, this key should be generated once 
# and stored securely in environment variables (e.g., os.getenv("SECRET_KEY")).
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set.")
fernet = Fernet(SECRET_KEY)

# --- 2. Asymmetric Encryption Setup (RSA) ---
# Generate an RSA Public/Private key pair for demonstration.
# In reality, the ATM would only have the public_key, and the Scanner backend 
# would securely hold the private_key.
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
public_key = private_key.public_key()

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
    expiration: int = 60  # Expiration time in seconds (0 = never expires)
    encryption_type: str = "SYM"  # "SYM" for Symmetric, "ASY" for Asymmetric

class GenerateResponse(BaseModel):
    qr_image_base64: str
    qr_raw_data: str
    raw_json_payload: str

class ScanRequest(BaseModel):
    ciphertext: str

class ScanResponse(BaseModel):
    success: bool
    encryption_type: str
    data: dict

# --- API Endpoints ---

@app.post("/api/qr/generate", response_model=GenerateResponse)
async def generate_qr(request: GenerateRequest):
    """
    Encrypts transaction data and generates a QR code containing the ciphertext.
    """
    # 1. Prepare the payload
    payload = {
        "message": request.message,
        "expiration": request.expiration,
        "created_at": time.time()
    }
    
    # 2. Convert payload to JSON bytes
    payload_str = json.dumps(payload, indent=2)
    payload_bytes = payload_str.encode('utf-8')
    
    # 3. Encrypt the payload based on the selected method
    if request.encryption_type == "SYM":
        # Symmetric: Encrypt with shared Fernet (AES) key
        ciphertext_bytes = fernet.encrypt(payload_bytes)
        ciphertext_b64 = ciphertext_bytes.decode('utf-8')
        qr_raw_data = f"SYM:{ciphertext_b64}"
    
    elif request.encryption_type == "ASY":
        # Asymmetric: Encrypt with RSA Public Key
        # The padding ensures mathematical security against certain RSA attacks.
        ciphertext_bytes = public_key.encrypt(
            payload_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        # Convert raw binary ciphertext to Base64 so it can be stored in the QR string
        ciphertext_b64 = base64.b64encode(ciphertext_bytes).decode('utf-8')
        qr_raw_data = f"ASY:{ciphertext_b64}"
    
    else:
        raise HTTPException(status_code=400, detail="Invalid encryption type")
    
    # 4. Generate the QR Code containing the prefixed ciphertext string
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_raw_data)
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
        qr_raw_data=qr_raw_data,
        raw_json_payload=payload_str
    )


@app.post("/api/qr/scan", response_model=ScanResponse)
async def scan_qr(request: ScanRequest):
    """
    Scans the ciphertext, decrypts it with a 60-second TTL, and returns the data.
    """
    try:
        # 1. Parse the prefix to determine the encryption method used
        parts = request.ciphertext.split(":", 1)
        if len(parts) != 2:
            raise ValueError("Invalid QR format")
        
        enc_type, raw_ciphertext = parts
        
        # 2. Decrypt based on the method
        if enc_type == "SYM":
            ciphertext_bytes = raw_ciphertext.encode('utf-8')
            decrypted_bytes = fernet.decrypt(ciphertext_bytes)
            
        elif enc_type == "ASY":
            ciphertext_bytes = base64.b64decode(raw_ciphertext)
            decrypted_bytes = private_key.decrypt(
                ciphertext_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
        else:
            raise ValueError("Unknown encryption type")
        
        # 3. Parse the decrypted JSON data
        decrypted_data = json.loads(decrypted_bytes.decode('utf-8'))
        
        # 4. Manually check expiration
        expiration = decrypted_data.get("expiration", 60)
        created_at = decrypted_data.get("created_at", 0)
        
        if expiration > 0 and time.time() > (created_at + expiration):
            raise HTTPException(
                status_code=400,
                detail="The QR code has expired."
            )
        
        return ScanResponse(
            success=True,
            encryption_type="Symmetric (AES)" if enc_type == "SYM" else "Asymmetric (RSA)",
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

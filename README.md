# SafeCrypt - Educational Cryptography Showcase

![Python](https://img.shields.io/badge/Python-3.13-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.139-blue.svg)

SafeCrypt is a highly secure, end-to-end encrypted QR code messaging system and educational "Cryptography Showcase." It demonstrates how to securely transmit data across an untrusted visual medium (QR codes) using symmetric encryption and cryptographic validation.

## 🔑 Key Features & Architectural Decisions

1. **Zero-Knowledge QR Codes (Symmetric Encryption)**
   - The backend utilizes AES-128 (via the `cryptography` library's `Fernet` implementation) to encrypt the JSON payload.
   - The generated QR code contains only raw Base64 ciphertext, ensuring no plaintext data is exposed visually.

2. **Anti-Replay Architecture (TTL Validation)**
   - To prevent intercepted or photographed QR codes from being reused, a `created_at` timestamp and expiration limit (default 60 seconds) are embedded directly into the encrypted JSON payload.
   - Upon scanning, the backend decrypts the payload and manually validates the TTL. Expired codes return an HTTP 400.

3. **Educational "Data Journey" UI**
   - The frontend generator visually breaks down the cryptographic process step-by-step:
     - Step 1: Raw JSON payload.
     - Step 2: AES-128 encryption output (truncated Base64).
     - Step 3: Visual QR matrix.

4. **Interactive Terminal Log**
   - The React scanner component features an asynchronous, dark-mode terminal log that simulates the decryption sequence (`[+] Applying Cryptographic Key...`, `[+] Validating HMAC Signature...`) to demystify the backend process.

5. **HTTPS Local Network Configuration**
   - To bypass modern mobile browser restrictions that block camera access (`getUserMedia`) on insecure origins, the Vite frontend is configured with `@vitejs/plugin-basic-ssl`. This allows local HTTPS access (e.g., `https://<YOUR_IP>:5174`) for mobile scanning.

---

## 🛠 Tech Stack

*   **Backend:** Python 3.13, FastAPI, Pydantic, cryptography (Fernet), qrcode, pillow
*   **Frontend:** React (Vite), Axios, html5-qrcode
*   **Environment:** openSUSE Tumbleweed / Linux
*   **Dependency Management:** `uv`, `pip`, or standard virtual environments

---

## 🚀 Installation & Setup

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/callisto1232/safecrypt.git
cd safecrypt

# Set up a virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn cryptography qrcode pillow python-dotenv

# Generate a secure Fernet key (must be exactly 32 url-safe base64-encoded bytes)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Create a `.env` file in the root directory and paste the generated key:
```env
SECRET_KEY=your_generated_key_here
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

---

## 💻 Usage Guide

### Starting the Servers

**Start the Backend (FastAPI):**
```bash
# From the project root (ensure your virtual environment is active)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Start the Frontend (React):**
```bash
# From the frontend directory
npm run dev -- --host 0.0.0.0 --port 5174
```

### Scanning Workflow
1. Open the generator on your desktop at `https://localhost:5174`.
2. Generate a secure QR code.
3. Open the scanner on your smartphone by navigating to `https://<YOUR_LOCAL_IP>:5174` (accept the self-signed certificate warning).
4. Scan the QR code to watch the decryption terminal in action!

---

## 📚 API Documentation

While the backend is running, FastAPI provides interactive API documentation at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**
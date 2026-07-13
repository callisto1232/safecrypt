# SafeCrypt - Secure QR Transaction System

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)
![React](https://img.shields.io/badge/React-18.3+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-blue.svg)

A highly secure, end-to-end encrypted QR code messaging system for sharing sensitive data via QR codes.

## Overview

SafeCrypt is a robust security demonstration project that enables stateless, secure data transfer via physical or digital QR codes. It was built to solve the problem of transmitting sensitive data (like secret messages, passwords, or personal info) across an untrusted visual medium to another device.

The system uses symmetric AES-128 encryption (via Fernet) to ensure that the QR codes contain **zero human-readable data**. It features built-in replay attack prevention via cryptographic timestamping, ensuring that an intercepted or photographed QR code becomes useless after 60 seconds.

### Key Features
*   **Zero-Knowledge QR Codes:** Payloads are 100% ciphertext.
*   **Anti-Replay Architecture:** Cryptographic 60-second Time-To-Live (TTL) prevents QR code reuse.
*   **Tamper-Proof:** SHA256 HMAC signatures guarantee data integrity.
*   **Dual-Interface Frontend:** Includes both the "Share Data" generator and the "Scan QR" mobile web app.

---

## Architecture & Tech Stack

### Tech Stack
*   **Backend:** Python 3.13, FastAPI, Pydantic, Cryptography (Fernet)
*   **Frontend:** React (Vite), Axios, HTML5-QRCode
*   **Environment:** `uv` for Python dependency management

### System Flow
1.  **ATM Frontend** requests a transaction.
2.  **Backend** bundles data, encrypts it with AES-128, embeds a timestamp, and returns a Base64 PNG of the ciphertext.
3.  **Scanner Frontend** reads the visual QR code and POSTs the ciphertext back to the server.
4.  **Backend** validates the HMAC signature, checks the TTL (< 60s), decrypts the data, and returns the message.

---

## Prerequisites

Before installing, ensure you have the following installed on your system:
*   **Python 3.13+** (Managed via `uv` is highly recommended)
*   **Node.js 18+** & **npm**
*   **uv** (Python package installer and resolver)

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/callisto1232/safecrypt.git
cd safecrypt
```

### 2. Backend Setup
We use `uv` to manage the Python virtual environment to avoid system package conflicts.

```bash
# Create and activate the virtual environment
uv venv .venv
source .venv/bin/activate.fish  # Or activate.bash / activate.zsh depending on your shell

# Install dependencies
uv pip install fastapi uvicorn pydantic cryptography qrcode pillow python-dotenv

# Generate a secure 32-byte Base64 encryption key
.venv/bin/python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" > new_key.txt
```

Create a `.env` file in the root directory and add the generated key:
```env
SECRET_KEY=your_generated_key_here
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## Usage Guide

### Starting the Servers

**Start the Backend (FastAPI):**
```bash
# From the project root
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Start the Frontend (React):**
```bash
# From the frontend directory
npm run dev -- --host 0.0.0.0
```

### Workflows
1.  Navigate to `http://localhost:5173` on your computer.
2.  On the **Share Data**, enter a secret message and click "Generate QR Code".
3.  Using your smartphone (connected to the same Wi-Fi network), navigate to `http://<YOUR_COMPUTER_IP>:5173`.
4.  Switch to the **Scan QR** tab.
5.  Point your phone's camera at your computer screen to scan the QR code.
6.  The app will securely decrypt the payload and display the secret message!

---

## API Documentation

FastAPI automatically generates interactive Swagger documentation. While the backend is running, visit:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

*   `POST /api/qr/generate`: Accepts JSON payload, returns Base64 encrypted QR.
*   `POST /api/qr/scan`: Accepts ciphertext, validates TTL, returns decrypted JSON.

---

## Security Considerations & Future Upgrades

While the mathematical encryption of this system is sound, a production deployment should consider the following upgrades to mitigate the risk of a `.env` leak:

1.  **Database-Backed State:** Implement a database to track `transaction_id` states to ensure a QR code is only used once, rather than relying purely on stateless TTL validation.
2.  **Asymmetric Cryptography:** Transition from symmetric Fernet to ECDSA/RSA so the ATM only holds a Public Key, preventing a compromised ATM from decrypting data.
3.  **KMS Integration:** Store the secret key in AWS KMS or HashiCorp Vault with automated rotation policies.

---

## Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `ValueError: Fernet key must be 32 url-safe base64-encoded bytes` | Invalid `.env` key length. | Regenerate the key using the Python script in the Setup instructions. Ensure it is exactly 44 characters long. |
| `Network Error` on Frontend | Frontend cannot reach backend. | Ensure both servers are running. If testing via a mobile device, ensure both are started with `--host 0.0.0.0` and that you are using your local IP, not `localhost`. |
| `InvalidToken` HTTP 400 | QR Code expired or tampered. | Generate a new QR code. The system strictly enforces a 60-second lifespan. |

---

## Contributing

We welcome contributions to SafeCrypt!
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/SecurityUpgrade`).
3.  Ensure your code adheres to standard PEP-8 guidelines.
4.  Commit your changes and open a Pull Request.

Please open an issue first to discuss major architectural changes.

---

## License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute this software for personal or commercial purposes, provided the original copyright notice is included. See the `LICENSE` file for details.

---

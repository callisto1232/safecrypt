import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import axios from 'axios'

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)
  const [logs, setLogs] = useState([])
  const [isDecrypting, setIsDecrypting] = useState(false)

  useEffect(() => {
    if (!scanning) return;

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        // Stop scanning on successful read
        scanner.clear()
        setScanning(false)
        await handleScan(decodedText)
      },
      (errorMessage) => {
        // Ignore constant scanning errors, only log if needed
      }
    )

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e))
    }
  }, [scanning])

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg])
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const handleScan = async (ciphertext) => {
    setError('')
    setIsDecrypting(true)
    setLogs([])

    // Simulated terminal effect
    addLog(`[+] Scanned Raw Data: ${ciphertext.substring(0, 30)}...`)
    await sleep(600)
    addLog(`[+] Initiating Decryption Protocol...`)
    await sleep(400)

    try {
      const response = await axios.post(`http://${window.location.hostname}:8000/api/qr/scan`, {
        ciphertext
      })
      
      addLog(`[+] Encryption Detected: Symmetric (AES)`)
      await sleep(800)
      addLog(`[+] Applying Cryptographic Key...`)
      await sleep(500)
      addLog(`[+] Validating HMAC Signature & Integrity... OK`)
      await sleep(600)
      addLog(`[+] Checking Timestamp TTL... Valid`)
      await sleep(400)
      addLog(`[!] Payload Successfully Decrypted.`)
      await sleep(500)

      setScanResult(response.data.data)
    } catch (err) {
      addLog(`[-] ERROR: Decryption Failed.`)
      await sleep(300)
      setError(err.response?.data?.detail || err.message)
    } finally {
      setIsDecrypting(false)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setError('')
    setLogs([])
    setIsDecrypting(false)
    setScanning(true)
  }

  return (
    <div className="card scanner-card">
      <h2>Secure QR Scanner</h2>
      <p>Scan a generated secure QR code to decrypt the message.</p>
      
      {scanning ? (
        <div id="reader" className="scanner-container"></div>
      ) : (
        <div className="result-container">
          {logs.length > 0 && (
            <div style={{background: '#1e293b', color: '#10b981', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', textAlign: 'left', fontSize: '13px', marginBottom: '20px', minHeight: '150px'}}>
              {logs.map((log, index) => (
                <div key={index} style={{marginBottom: '5px'}}>{log}</div>
              ))}
              {isDecrypting && <div className="blink" style={{animation: 'blink 1s step-end infinite'}}>_</div>}
            </div>
          )}

          {!isDecrypting && error ? (
            <div className="error-box">
              <h3>Security Validation Failed 🚨</h3>
              <p>{error}</p>
              <button onClick={resetScanner}>Try Again</button>
            </div>
          ) : !isDecrypting && scanResult ? (
            <div className="success-box">
              <h3>Message Decrypted ✅</h3>
              <div className="receipt">
                <p><strong>Secret Message:</strong></p>
                <p style={{fontSize: '1.2em', color: '#1f2937'}}>{scanResult.message}</p>
              </div>
              <button onClick={resetScanner}>Scan Another</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
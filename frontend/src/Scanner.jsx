import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import axios from 'axios'

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

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

  const handleScan = async (ciphertext) => {
    setError('')
    try {
      const response = await axios.post(`http://${window.location.hostname}:8000/api/qr/scan`, {
        ciphertext
      })
      setScanResult(response.data.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setError('')
    setScanning(true)
  }

  return (
    <div className="card scanner-card">
      <h2>Mobile Banking App</h2>
      <p>Scan the ATM QR code to authorize the transaction.</p>
      
      {scanning ? (
        <div id="reader" className="scanner-container"></div>
      ) : (
        <div className="result-container">
          {error ? (
            <div className="error-box">
              <h3>Scan Failed</h3>
              <p>{error}</p>
              <button onClick={resetScanner}>Try Again</button>
            </div>
          ) : scanResult ? (
            <div className="success-box">
              <h3>Transaction Authorized ✅</h3>
              <div className="receipt">
                <p><strong>User ID:</strong> {scanResult.user_id}</p>
                <p><strong>Transaction ID:</strong> {scanResult.transaction_id}</p>
                <p><strong>Amount:</strong> ${scanResult.amount.toFixed(2)}</p>
              </div>
              <button onClick={resetScanner}>Scan Another</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
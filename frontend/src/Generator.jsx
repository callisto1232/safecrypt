import { useState } from 'react'
import axios from 'axios'

export default function Generator() {
  const [message, setMessage] = useState('')
  const [expiration, setExpiration] = useState(60)
  const [qrCode, setQrCode] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setQrCode(null)
    setQrData(null)

    try {
      const response = await axios.post(`http://${window.location.hostname}:8000/api/qr/generate`, {
        message: message,
        expiration: parseInt(expiration)
      })
      setQrCode(response.data.qr_image_base64)
      setQrData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card atm-card">
      <h2>Generate Secure QR</h2>
      <p>Enter a secret message to securely share with another device.</p>
      
      <form onSubmit={handleGenerate}>
        <div className="form-group">
          <label>Secret Message</label>
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required 
            placeholder="e.g., Meet me at 5 PM."
          />
        </div>
        <div className="form-group">
          <label>Expiration Time</label>
          <select 
            value={expiration} 
            onChange={(e) => setExpiration(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px' }}
          >
            <option value={60}>60 Seconds</option>
            <option value={300}>5 Minutes</option>
            <option value={3600}>1 Hour</option>
            <option value={0}>Never Expires</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {qrCode && qrData && (
        <div className="qr-container">
          <div style={{textAlign: 'left', marginBottom: '30px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
            <h3 style={{marginTop: 0, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px'}}>The Data Journey Breakdown</h3>
            
            <p><strong>Step 1: Raw Payload</strong><br/>
              <span style={{fontSize: '12px', color: '#64748b'}}>The backend creates a JSON dictionary and embeds the expiration timer.</span>
            </p>
            <pre style={{background: '#1e293b', color: '#e2e8f0', padding: '10px', borderRadius: '4px', overflowX: 'auto', fontSize: '13px'}}>
              {qrData.raw_json_payload}
            </pre>

            <p style={{marginTop: '20px'}}><strong>Step 2: Encryption</strong><br/>
              <span style={{fontSize: '12px', color: '#64748b'}}>The JSON is converted to bytes and encrypted using AES-128 via Fernet.</span>
            </p>
            <div style={{wordBreak: 'break-all', background: '#f1f5f9', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace', color: '#ef4444'}}>
              {qrData.qr_raw_data.substring(0, 100)}...<span style={{color: '#94a3b8'}}>(truncated for display)</span>
            </div>
            
            <p style={{marginTop: '20px'}}><strong>Step 3: QR Code Matrix</strong><br/>
              <span style={{fontSize: '12px', color: '#64748b'}}>The ciphertext is encoded visually into the QR code matrix below. Notice how there is zero human-readable data left.</span>
            </p>
          </div>

          <h3>Scan with the Scanner App</h3>
          <img src={qrCode} alt="Transaction QR Code" className="qr-image" />
          {parseInt(expiration) > 0 ? (
            <p className="timer-warning">Warning: This QR code expires in {expiration} seconds.</p>
          ) : (
            <p className="timer-warning" style={{color: '#059669'}}>This QR code never expires.</p>
          )}
        </div>
      )}
    </div>
  )
}
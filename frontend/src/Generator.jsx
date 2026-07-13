import { useState } from 'react'
import axios from 'axios'

export default function Generator() {
  const [message, setMessage] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setQrCode(null)

    try {
      const response = await axios.post(`http://${window.location.hostname}:8000/api/qr/generate`, {
        message: message
      })
      setQrCode(response.data.qr_image_base64)
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
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {qrCode && (
        <div className="qr-container">
          <h3>Scan with the Scanner App</h3>
          <img src={qrCode} alt="Transaction QR Code" className="qr-image" />
          <p className="timer-warning">Warning: This QR code expires in 60 seconds.</p>
        </div>
      )}
    </div>
  )
}
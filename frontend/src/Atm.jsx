import { useState } from 'react'
import axios from 'axios'

export default function Atm() {
  const [amount, setAmount] = useState('')
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
        user_id: "user_12345",
        transaction_id: `txn_${Date.now()}`,
        amount: parseFloat(amount)
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
      <h2>ATM Withdrawal</h2>
      <p>Enter the amount to withdraw and scan the QR code with your banking app.</p>
      
      <form onSubmit={handleGenerate}>
        <div className="form-group">
          <label>Amount ($)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required 
            min="1"
            step="0.01"
            placeholder="e.g. 50.00"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {qrCode && (
        <div className="qr-container">
          <h3>Scan with Banking App</h3>
          <img src={qrCode} alt="Transaction QR Code" className="qr-image" />
          <p className="timer-warning">Warning: This QR code expires in 60 seconds.</p>
        </div>
      )}
    </div>
  )
}
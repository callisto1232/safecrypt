import { useState } from 'react'
import Generator from './Generator'
import Scanner from './Scanner'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('generator')

  return (
    <div className="container">
      <header>
        <h1>Secure QR App</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'generator' ? 'active' : ''} 
            onClick={() => setActiveTab('generator')}
          >
            Share Data
          </button>
          <button 
            className={activeTab === 'scanner' ? 'active' : ''} 
            onClick={() => setActiveTab('scanner')}
          >
            Scan QR
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'generator' && <Generator />}
        {activeTab === 'scanner' && <Scanner />}
      </main>
    </div>
  )
}

export default App

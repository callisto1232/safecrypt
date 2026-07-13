import { useState } from 'react'
import Atm from './Atm'
import Scanner from './Scanner'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('atm')

  return (
    <div className="container">
      <header>
        <h1>Secure QR System</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'atm' ? 'active' : ''} 
            onClick={() => setActiveTab('atm')}
          >
            ATM View
          </button>
          <button 
            className={activeTab === 'scanner' ? 'active' : ''} 
            onClick={() => setActiveTab('scanner')}
          >
            Scanner App View
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'atm' && <Atm />}
        {activeTab === 'scanner' && <Scanner />}
      </main>
    </div>
  )
}

export default App

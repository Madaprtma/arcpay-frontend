import { useState, useEffect } from 'react'
import { getWalletClient, arcTestnet } from './utils/client'
import { useArcPay } from './hooks/useArcPay'
import RemittanceForm from './components/RemittanceForm'
import PayrollForm from './components/PayrollForm'
import TransactionHistory from './components/TransactionHistory'
import './App.css'

export default function App() {
  const [account, setAccount]   = useState(null)
  const [balance, setBalance]   = useState('0.00')
  const [mode, setMode]         = useState('remittance') // 'remittance' | 'payroll'
  const [activeTab, setActiveTab] = useState('send')    // 'send' | 'history'
  const { getBalance } = useArcPay()

  const connectWallet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${arcTestnet.id.toString(16)}`,
          chainName: arcTestnet.name,
          nativeCurrency: arcTestnet.nativeCurrency,
          rpcUrls: [arcTestnet.rpcUrls.default.http[0]],
          blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
        }],
      })
      const walletClient = getWalletClient()
      const [addr] = await walletClient.getAddresses()
      setAccount(addr)
    } catch (e) {
      alert('Gagal connect wallet: ' + e.message)
    }
  }

  useEffect(() => {
    if (account) {
      getBalance(account).then(setBalance)
      const interval = setInterval(() => getBalance(account).then(setBalance), 10000)
      return () => clearInterval(interval)
    }
  }, [account])

  const shortAddr = (addr) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : ''

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">ArcPay</span>
          <span className="logo-badge">Testnet</span>
        </div>
        {account ? (
          <div className="wallet-info">
            <div className="balance-pill">
              <span className="usdc-dot" />
              <span>{balance} USDC</span>
            </div>
            <div className="address-pill">{shortAddr(account)}</div>
          </div>
        ) : (
          <button className="btn-connect" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </header>

      {!account ? (
        /* Landing */
        <div className="landing">
          <div className="landing-content">
            <h1>Send money home.<br />Pay your team.</h1>
            <p>Instant cross-border payments & payroll<br />powered by USDC on Arc Testnet</p>
            <div className="features">
              <div className="feature-card">
                <span>🌏</span>
                <strong>UAE → Global</strong>
                <small>Real-time USDC remittance with transparent fees</small>
              </div>
              <div className="feature-card">
                <span>💼</span>
                <strong>B2B Payroll</strong>
                <small>Batch pay up to 50 freelancers in one transaction</small>
              </div>
              <div className="feature-card">
                <span>⚡</span>
                <strong>Instant Settlement</strong>
                <small>Deterministic finality on Arc L1</small>
              </div>
            </div>
            <button className="btn-connect large" onClick={connectWallet}>
              Connect Wallet to Start
            </button>
          </div>
        </div>
      ) : (
        /* Main App */
        <main className="main">
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'remittance' ? 'active' : ''}`}
              onClick={() => setMode('remittance')}
            >
              🌏 Remittance
            </button>
            <button
              className={`mode-btn ${mode === 'payroll' ? 'active' : ''}`}
              onClick={() => setMode('payroll')}
            >
              💼 Payroll
            </button>
          </div>

          {/* Tab */}
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
              onClick={() => setActiveTab('send')}
            >
              Send
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>

          {/* Content */}
          <div className="content">
            {activeTab === 'send' ? (
              mode === 'remittance' ? (
                <RemittanceForm account={account} onSuccess={() => setActiveTab('history')} />
              ) : (
                <PayrollForm account={account} onSuccess={() => setActiveTab('history')} />
              )
            ) : (
              <TransactionHistory account={account} />
            )}
          </div>
        </main>
      )}

      <footer className="footer">
        <span>Built on Arc Testnet · Powered by Circle USDC</span>
      </footer>
    </div>
  )
}

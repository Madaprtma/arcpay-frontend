import { useState, useEffect } from 'react'
import { useArcPay } from '../hooks/useArcPay'
import { fromUSDC } from '../utils/client'

const TX_TYPE  = ['Remittance', 'Payroll']
const TX_STATUS = ['Pending', 'Settled', 'Refunded']
const STATUS_COLOR = { 0: 'yellow', 1: 'green', 2: 'red' }

export default function TransactionHistory({ account }) {
  const { getHistory } = useArcPay()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!account) return
    setLoading(true)
    getHistory(account)
      .then(setHistory)
      .finally(() => setLoading(false))
  }, [account])

  const shortAddr = (addr) => `${addr.slice(0,6)}...${addr.slice(-4)}`
  const formatDate = (ts) => new Date(Number(ts) * 1000).toLocaleString('id-ID')

  if (loading) return <div className="loading-state">⏳ Loading history...</div>
  if (history.length === 0) return (
    <div className="empty-state">
      <span>📭</span>
      <p>Belum ada transaksi</p>
    </div>
  )

  return (
    <div className="history-list">
      <h2>Transaction History</h2>
      {history.map((tx, i) => (
        <div key={i} className="tx-card">
          <div className="tx-header">
            <span className="tx-type-badge">
              {tx.txType === 0 ? '🌏' : '💼'} {TX_TYPE[tx.txType]}
            </span>
            <span className={`tx-status status-${STATUS_COLOR[tx.status]}`}>
              {TX_STATUS[tx.status]}
            </span>
          </div>
          <div className="tx-amount">{fromUSDC(tx.amount)} USDC</div>
          <div className="tx-detail">
            <span>To: {shortAddr(tx.recipient)}</span>
            <span>Fee: {fromUSDC(tx.fee)} USDC</span>
          </div>
          {tx.memo && <div className="tx-memo">"{tx.memo}"</div>}
          <div className="tx-date">{formatDate(tx.timestamp)}</div>
        </div>
      ))}
    </div>
  )
}

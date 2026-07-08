import { useState } from 'react'
import { useArcPay } from '../hooks/useArcPay'

const emptyRow = () => ({ address: '', amount: '', name: '' })

export default function PayrollForm({ account, onSuccess }) {
  const { sendPayrollBatch, loading, error, txHash } = useArcPay()
  const [rows, setRows]     = useState([emptyRow()])
  const [memo, setMemo]     = useState('Juli 2026 Payroll')
  const [success, setSuccess] = useState(false)

  const updateRow = (i, field, val) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const addRow    = () => setRows(r => [...r, emptyRow()])
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i))

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
  const fee   = (total * 0.005).toFixed(2)
  const net   = (total - parseFloat(fee)).toFixed(2)

  const handleSubmit = async () => {
    const valid = rows.filter(r => r.address && r.amount)
    if (valid.length === 0) return alert('Tambahkan minimal 1 recipient!')
    try {
      await sendPayrollBatch({
        recipients: valid.map(r => r.address),
        amounts:    valid.map(r => r.amount),
        memo,
      })
      setSuccess(true)
      setTimeout(onSuccess, 2000)
    } catch {}
  }

  if (success && txHash) {
    return (
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h3>Payroll Sent!</h3>
        <p>{rows.filter(r => r.address).length} freelancer berhasil dibayar</p>
        <a
          href={`${import.meta.env.VITE_ARC_EXPLORER_URL}/tx/${txHash}`}
          target="_blank" rel="noreferrer"
          className="btn-secondary"
        >
          Lihat di Explorer →
        </a>
      </div>
    )
  }

  return (
    <div className="form-card">
      <h2>💼 B2B Payroll</h2>
      <p className="form-subtitle">Bayar semua freelancer dalam 1 transaksi</p>

      {/* Memo */}
      <div className="field">
        <label>Payroll Memo</label>
        <input
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="Nama periode payroll..."
        />
      </div>

      {/* Recipient rows */}
      <div className="field">
        <label>Daftar Freelancer ({rows.length})</label>
        <div className="payroll-table">
          <div className="payroll-header">
            <span>Nama (opsional)</span>
            <span>Wallet Address</span>
            <span>Amount (USDC)</span>
            <span></span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="payroll-row">
              <input
                placeholder="Nama freelancer"
                value={row.name}
                onChange={e => updateRow(i, 'name', e.target.value)}
              />
              <input
                placeholder="0x..."
                value={row.address}
                onChange={e => updateRow(i, 'address', e.target.value)}
              />
              <input
                type="number"
                placeholder="0.00"
                min="0"
                value={row.amount}
                onChange={e => updateRow(i, 'amount', e.target.value)}
              />
              <button
                className="btn-remove"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
              >✕</button>
            </div>
          ))}
        </div>

        <button className="btn-add-row" onClick={addRow} disabled={rows.length >= 50}>
          + Tambah Freelancer
        </button>
      </div>

      {/* Summary */}
      {total > 0 && (
        <div className="fee-box">
          <div className="fee-row">
            <span>Total Gross</span>
            <span>{total.toFixed(2)} USDC</span>
          </div>
          <div className="fee-row">
            <span>Fee (0.5%)</span>
            <span>- {fee} USDC</span>
          </div>
          <div className="fee-row total">
            <span>Total Net ke Freelancer</span>
            <span>{net} USDC</span>
          </div>
          <div className="fee-row">
            <span>Jumlah Penerima</span>
            <span>{rows.filter(r => r.address).length} orang</span>
          </div>
        </div>
      )}

      {error && <div className="error-msg">⚠️ {error}</div>}

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading || total === 0}
      >
        {loading ? '⏳ Processing...' : `⚡ Send Payroll (${total.toFixed(2)} USDC)`}
      </button>
    </div>
  )
}

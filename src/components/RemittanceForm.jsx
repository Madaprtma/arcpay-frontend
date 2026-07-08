import { useState, useEffect } from 'react'
import { useArcPay } from '../hooks/useArcPay'

const CORRIDORS = [
  { flag: '🇮🇩', label: 'Indonesia', code: 'ID' },
  { flag: '🇵🇭', label: 'Philippines', code: 'PH' },
  { flag: '🇮🇳', label: 'India', code: 'IN' },
  { flag: '🇵🇰', label: 'Pakistan', code: 'PK' },
  { flag: '🇧🇩', label: 'Bangladesh', code: 'BD' },
  { flag: '🇳🇬', label: 'Nigeria', code: 'NG' },
]

export default function RemittanceForm({ account, onSuccess }) {
  const { sendRemittance, estimateFee, loading, error, txHash } = useArcPay()
  const [form, setForm] = useState({
    recipient: '',
    amount: '',
    corridor: CORRIDORS[0],
    memo: 'Kiriman dari UAE',
  })
  const [feeInfo, setFeeInfo] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      estimateFee(form.amount).then(setFeeInfo)
    }, 400)
    return () => clearTimeout(timer)
  }, [form.amount])

  const handleSubmit = async () => {
    if (!form.recipient || !form.amount) return alert('Isi semua field!')
    try {
      await sendRemittance({
        recipient: form.recipient,
        amount: form.amount,
        memo: form.memo,
      })
      setSuccess(true)
      setTimeout(onSuccess, 2000)
    } catch {}
  }

  if (success && txHash) {
    return (
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h3>Remittance Sent!</h3>
        <p>USDC berhasil dikirim ke recipient</p>
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
      <h2>🌏 Send Remittance</h2>
      <p className="form-subtitle">UAE → {form.corridor.flag} {form.corridor.label}</p>

      {/* Corridor selector */}
      <div className="field">
        <label>Negara Tujuan</label>
        <div className="corridor-grid">
          {CORRIDORS.map(c => (
            <button
              key={c.code}
              className={`corridor-btn ${form.corridor.code === c.code ? 'active' : ''}`}
              onClick={() => setForm(f => ({ ...f, corridor: c }))}
            >
              {c.flag} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient */}
      <div className="field">
        <label>Recipient Wallet Address</label>
        <input
          placeholder="0x..."
          value={form.recipient}
          onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
        />
      </div>

      {/* Amount */}
      <div className="field">
        <label>Amount (USDC)</label>
        <div className="amount-input-wrap">
          <span className="currency-badge">USDC</span>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
        </div>
      </div>

      {/* Fee breakdown */}
      {feeInfo && form.amount && (
        <div className="fee-box">
          <div className="fee-row">
            <span>Amount</span>
            <span>{form.amount} USDC</span>
          </div>
          <div className="fee-row">
            <span>Fee (0.5%)</span>
            <span>- {feeInfo.fee} USDC</span>
          </div>
          <div className="fee-row total">
            <span>Recipient Gets</span>
            <span>{feeInfo.netAmount} USDC</span>
          </div>
        </div>
      )}

      {/* Memo */}
      <div className="field">
        <label>Memo</label>
        <input
          placeholder="Keterangan kiriman..."
          value={form.memo}
          onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
        />
      </div>

      {error && <div className="error-msg">⚠️ {error}</div>}

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading || !form.recipient || !form.amount}
      >
        {loading ? '⏳ Processing...' : '⚡ Send Now'}
      </button>
    </div>
  )
}

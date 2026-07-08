import { useState, useCallback } from 'react'
import { parseAbi } from 'viem'
import {
  publicClient, getWalletClient,
  ESCROW_ADDRESS, USDC_ADDRESS,
  toUSDC, fromUSDC, USDC_DECIMALS
} from '../utils/client'
import escrowAbi from '../abi/RemittanceEscrow.json'

const USDC_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
])

export function useArcPay() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [txHash, setTxHash]   = useState(null)

  // ── Approve USDC ──
  const approveUSDC = async (walletClient, account, amount) => {
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [account, ESCROW_ADDRESS],
    })
    if (allowance < amount) {
      const hash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [ESCROW_ADDRESS, amount],
        account,
      })
      await publicClient.waitForTransactionReceipt({ hash })
    }
  }

  // ── Mode A: Send Remittance ──
  const sendRemittance = useCallback(async ({ recipient, amount, memo }) => {
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const walletClient = getWalletClient()
      const [account] = await walletClient.getAddresses()
      const amountBig = toUSDC(amount)

      await approveUSDC(walletClient, account, amountBig)

      const hash = await walletClient.writeContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'sendRemittance',
        args: [recipient, amountBig, memo],
        account,
      })

      await publicClient.waitForTransactionReceipt({ hash })
      setTxHash(hash)
      return hash
    } catch (e) {
      setError(e.message || 'Transaction failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Mode B: Send Payroll Batch ──
  const sendPayrollBatch = useCallback(async ({ recipients, amounts, memo }) => {
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const walletClient = getWalletClient()
      const [account] = await walletClient.getAddresses()

      const amountsBig = amounts.map(a => toUSDC(a))
      const total = amountsBig.reduce((a, b) => a + b, 0n)

      await approveUSDC(walletClient, account, total)

      const hash = await walletClient.writeContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'sendPayrollBatch',
        args: [recipients, amountsBig, memo],
        account,
      })

      await publicClient.waitForTransactionReceipt({ hash })
      setTxHash(hash)
      return hash
    } catch (e) {
      setError(e.message || 'Payroll batch failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Estimate Fee ──
  const estimateFee = useCallback(async (amount) => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return null
    try {
      const result = await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'estimateFee',
        args: [toUSDC(amount)],
      })
      return {
        fee: fromUSDC(result[0]),
        netAmount: fromUSDC(result[1]),
      }
    } catch { return null }
  }, [])

  // ── Get USDC Balance ──
  const getBalance = useCallback(async (address) => {
    try {
      const balance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address],
      })
      return fromUSDC(balance)
    } catch { return '0.00' }
  }, [])

  // ── Get Transaction History ──
  const getHistory = useCallback(async (address) => {
    try {
      const txIds = await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'getSenderHistory',
        args: [address],
      })
      const txs = await Promise.all(
        txIds.slice(-10).reverse().map(async (id) => {
          const tx = await publicClient.readContract({
            address: ESCROW_ADDRESS,
            abi: escrowAbi,
            functionName: 'getTransaction',
            args: [id],
          })
          return { id, ...tx }
        })
      )
      return txs
    } catch { return [] }
  }, [])

  return {
    sendRemittance,
    sendPayrollBatch,
    estimateFee,
    getBalance,
    getHistory,
    loading,
    error,
    txHash,
  }
}

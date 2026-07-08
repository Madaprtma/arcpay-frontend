import { createPublicClient, createWalletClient, custom, http } from 'viem'

// Arc Testnet chain config
export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.arc-testnet.circle.com'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: import.meta.env.VITE_ARC_EXPLORER_URL || 'https://explorer.arc-testnet.circle.com' },
  },
  testnet: true,
}

export const ESCROW_ADDRESS = import.meta.env.VITE_ESCROW_ADDRESS
export const USDC_ADDRESS   = import.meta.env.VITE_USDC_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

// USDC punya 6 desimal
export const USDC_DECIMALS = 6
export const toUSDC  = (amount) => BigInt(Math.round(parseFloat(amount) * 1e6))
export const fromUSDC = (amount) => (Number(amount) / 1e6).toFixed(2)

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
})

export const getWalletClient = () =>
  createWalletClient({
    chain: arcTestnet,
    transport: custom(window.ethereum),
  })

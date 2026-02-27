/**
 * WalletButton — Wallet Standard connect/disconnect UI
 *
 * Uses Wallet Standard discovery (no wallet-adapter-react).
 * Shows a wallet picker when no wallet is connected, and account info when connected.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'

export default function WalletButton() {
  const {
    wallets,
    isConnected,
    isConnecting,
    connectedAddress,
    selectedWallet,
    error,
    connect,
    cancelConnect,
    disconnect,
  } = useWallet()

  const [showDropdown, setShowDropdown] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`

  if (isConnected && connectedAddress) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-solana-purple/20 border border-solana-purple/40 hover:bg-solana-purple/30 transition-all"
        >
          {selectedWallet?.icon && (
            <img
              src={selectedWallet.icon}
              alt={selectedWallet.name}
              className="w-4 h-4 rounded"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <span className="text-sm font-medium text-white">
            {truncateAddress(connectedAddress)}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-white/10">
              <p className="text-xs text-gray-400">Connected via</p>
              <p className="text-sm text-white font-medium">{selectedWallet?.name}</p>
            </div>
            <button
              onClick={() => {
                disconnect()
                setShowDropdown(false)
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (isConnecting) {
            // Allow cancelling by reopening the dropdown
            setShowDropdown(true)
          } else {
            setShowDropdown(!showDropdown)
          }
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-solana-purple to-solana-green text-white font-medium text-sm hover:opacity-90 transition-all"
      >
        <Wallet className={`w-4 h-4 ${isConnecting ? 'animate-pulse' : ''}`} />
        <span>{isConnecting ? `Connecting${connectingWallet ? ` to ${connectingWallet}` : ''}…` : 'Connect Wallet'}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-white/10">
            <p className="text-sm text-gray-400">Select a wallet</p>
          </div>

          {/* Connection error banner */}
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Connecting spinner / cancel prompt */}
          {isConnecting && (
            <div className="px-3 py-2 bg-solana-purple/10 border-b border-solana-purple/20 flex items-center justify-between">
              <p className="text-xs text-solana-purple animate-pulse">Waiting for wallet approval…</p>
              <button
                onClick={() => {
                  // Force-reset the connecting state so user isn't stuck
                  setConnectingWallet(null)
                  setShowDropdown(false)
                  cancelConnect()
                }}
                className="text-xs text-gray-400 hover:text-white ml-2 underline"
              >
                Cancel
              </button>
            </div>
          )}

          {wallets.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-400">No Solana wallets found</p>
              <p className="text-xs text-gray-500 mt-1">Install a browser wallet extension</p>
              <div className="flex flex-col gap-1 mt-2">
                <a
                  href="https://phantom.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-solana-purple hover:underline"
                >
                  Get Phantom
                </a>
                <a
                  href="https://solflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-solana-purple hover:underline"
                >
                  Get Solflare
                </a>
              </div>
            </div>
          ) : (
            <div className="py-1">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  disabled={isConnecting}
                  onClick={async () => {
                    setConnectingWallet(wallet.name)
                    try {
                      await connect(wallet)
                      // connect() resolves only on success; errors are caught inside context
                      setShowDropdown(false)
                    } catch {
                      // error is set in context; keep dropdown open so user sees it
                    } finally {
                      setConnectingWallet(null)
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  {wallet.icon && (
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-6 h-6 rounded"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <span className="text-sm text-white">{wallet.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

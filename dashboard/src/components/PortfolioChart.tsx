'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Eye, EyeOff, RefreshCw, Zap } from 'lucide-react'

const portfolioData = [
  { time: '00:00', value: 385 },
  { time: '04:00', value: 390 },
  { time: '08:00', value: 388 },
  { time: '12:00', value: 395 },
  { time: '16:00', value: 392 },
  { time: '20:00', value: 397.5 },
]

const allocationData = [
  { name: 'SOL', value: 50, amount: 198.75, color: '#9945FF' },
  { name: 'USDC', value: 30, amount: 119.25, color: '#14F195' },
  { name: 'JUP', value: 10, amount: 39.75, color: '#80ecff' },
  { name: 'BONK', value: 10, amount: 39.75, color: '#FF6B6B' },
]

export default function PortfolioChart() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(new Set())
  const [isRebalancing, setIsRebalancing] = useState(false)

  const totalValue = 397.50
  const dayChange = 12.50
  const dayChangePercent = (dayChange / (totalValue - dayChange)) * 100

  const toggleToken = (tokenName: string) => {
    const newHidden = new Set(hiddenTokens)
    if (newHidden.has(tokenName)) {
      newHidden.delete(tokenName)
    } else {
      newHidden.add(tokenName)
    }
    setHiddenTokens(newHidden)
  }

  const handleRebalance = () => {
    setIsRebalancing(true)
    setTimeout(() => setIsRebalancing(false), 2000)
  }

  const visibleAllocationData = allocationData.filter(token => !hiddenTokens.has(token.name))

  return (
    <div className="space-y-6">
      {/* Portfolio Value Card */}
      <div className="card-gradient rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Portfolio Value</h2>
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-white">${totalValue.toFixed(2)}</span>
              <div className={`flex items-center space-x-1 ${dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dayChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-lg font-semibold">+${Math.abs(dayChange).toFixed(2)}</span>
                <span className="text-sm">({dayChangePercent.toFixed(2)}%)</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-1">Last 24 hours</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9945FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9945FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                domain={[380, 400]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(153,69,255,0.5)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#9945FF" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Allocation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="card-gradient rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Asset Allocation</h3>
            <button
              onClick={handleRebalance}
              disabled={isRebalancing}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-solana-purple/20 hover:bg-solana-purple/30 border border-solana-purple/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRebalancing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{isRebalancing ? 'Rebalancing...' : 'Rebalance'}</span>
            </button>
          </div>
          <div className="h-64 flex items-center justify-center relative">
            {visibleAllocationData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visibleAllocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} ${entry.value}%`}
                      outerRadius={selectedToken ? 75 : 80}
                      innerRadius={selectedToken ? 40 : 0}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={800}
                      onMouseEnter={(data) => setSelectedToken(data.name)}
                      onMouseLeave={() => setSelectedToken(null)}
                    >
                      {visibleAllocationData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          opacity={selectedToken ? (selectedToken === entry.name ? 1 : 0.3) : 1}
                          className="cursor-pointer transition-all hover:scale-110"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        border: '1px solid rgba(153,69,255,0.5)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {selectedToken && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-gray-900/90 rounded-lg p-4 border border-solana-purple/50">
                      <p className="text-white font-bold text-xl">{selectedToken}</p>
                      <p className="text-gray-400 text-sm">
                        {allocationData.find(t => t.name === selectedToken)?.value}% allocation
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All tokens hidden</p>
                <p className="text-sm">Click to show tokens</p>
              </div>
            )}
          </div>
        </div>

        {/* Holdings List */}
        <div className="card-gradient rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Holdings</h3>
            <div className="text-xs text-gray-400">
              {visibleAllocationData.length} / {allocationData.length} visible
            </div>
          </div>
          <div className="space-y-3">
            {allocationData.map((token) => {
              const isHidden = hiddenTokens.has(token.name)
              const isSelected = selectedToken === token.name
              
              return (
                <div 
                  key={token.name} 
                  className={`group relative p-3 rounded-lg transition-all cursor-pointer border ${
                    isHidden 
                      ? 'bg-white/5 opacity-50 border-white/10' 
                      : isSelected
                      ? 'bg-white/20 border-solana-purple scale-105 shadow-lg'
                      : 'bg-white/10 border-white/10 hover:bg-white/15 hover:scale-102 hover:border-solana-purple/50'
                  }`}
                  onMouseEnter={() => !isHidden && setSelectedToken(token.name)}
                  onMouseLeave={() => setSelectedToken(null)}
                  onClick={() => toggleToken(token.name)}
                >
                  {/* Progress bar background */}
                  <div 
                    className="absolute inset-0 rounded-lg opacity-20 transition-all"
                    style={{ 
                      background: `linear-gradient(to right, ${token.color} ${isHidden ? 0 : token.value}%, transparent ${isHidden ? 0 : token.value}%)`,
                    }}
                  />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-transform ${
                          isSelected ? 'scale-110' : 'group-hover:scale-110'
                        }`}
                        style={{ backgroundColor: token.color }}
                      >
                        {token.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold text-white">{token.name}</div>
                          {isHidden && <EyeOff className="w-4 h-4 text-gray-400" />}
                          {!isHidden && isSelected && <Eye className="w-4 h-4 text-solana-green animate-pulse" />}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>{token.value}% allocation</span>
                          {!isHidden && (
                            <>
                              <span>•</span>
                              <span className="text-green-400 flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>+2.5%</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {!isHidden && (
                        <>
                          <div className="font-semibold text-white">${token.amount.toFixed(2)}</div>
                          <div className="text-sm text-green-400">+2.5%</div>
                        </>
                      )}
                      {isHidden && (
                        <div className="text-sm text-gray-500">Hidden</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover action hint */}
                  <div className={`absolute -top-2 -right-2 transition-all ${
                    isSelected || isHidden 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'
                  }`}>
                    <div className={`p-1 rounded-full ${isHidden ? 'bg-gray-600' : 'bg-solana-purple'}`}>
                      {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
            <button
              onClick={() => setHiddenTokens(new Set())}
              disabled={hiddenTokens.size === 0}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Show All</span>
            </button>
            <button
              onClick={() => setSelectedToken(null)}
              disabled={!selectedToken}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Clear Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

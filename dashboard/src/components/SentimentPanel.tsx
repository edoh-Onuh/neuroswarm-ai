"use client";

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, MessageCircle, Newspaper, Link2, Info } from 'lucide-react';
import type { SentimentData } from '@/types';

const MOCK_SENTIMENTS: SentimentData[] = [
  {
    token: 'SOL',
    score: 0.75,
    sentiment: 'bullish',
    sources: { twitter: 0.8, reddit: 0.7, news: 0.75, onchain: 0.7 },
    confidence: 0.85
  },
  {
    token: 'BONK',
    score: 0.65,
    sentiment: 'bullish',
    sources: { twitter: 0.9, reddit: 0.6, news: 0.5, onchain: 0.6 },
    confidence: 0.75
  },
  {
    token: 'JUP',
    score: 0.55,
    sentiment: 'neutral',
    sources: { twitter: 0.6, reddit: 0.5, news: 0.55, onchain: 0.55 },
    confidence: 0.70
  }
];

export default function SentimentPanel() {
  const [sentiments] = useState<SentimentData[]>(MOCK_SENTIMENTS);

  const getSentimentColor = (sentiment: SentimentData['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getSentimentIcon = (sentiment: SentimentData['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-4 h-4" />;
      case 'bearish': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Search className="w-6 h-6 text-solana-purple" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Sentiment Analysis</h2>
        </div>
        <span className="text-xs text-gray-400">Live data</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sentiments.map((data) => (
          <div key={data.token} className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:border-solana-purple/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">{data.token}</h3>
              <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(data.sentiment)}`}>
                {getSentimentIcon(data.sentiment)}
                <span>{data.sentiment.toUpperCase()}</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Composite Score</span>
                  <span className="font-medium text-white">{(data.score * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.score * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Confidence</span>
                  <span className="font-medium text-white">{(data.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Source Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-gray-400"><MessageCircle className="w-3 h-3" /><span>Twitter</span></span>
                    <span className="font-medium text-white">{(data.sources.twitter * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-gray-400"><Newspaper className="w-3 h-3" /><span>News</span></span>
                    <span className="font-medium text-white">{(data.sources.news * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-gray-400"><MessageCircle className="w-3 h-3" /><span>Reddit</span></span>
                    <span className="font-medium text-white">{(data.sources.reddit * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-gray-400"><Link2 className="w-3 h-3" /><span>On-Chain</span></span>
                    <span className="font-medium text-white">{(data.sources.onchain * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Sentiment Agent Active</h4>
            <p className="text-sm text-gray-300">
              Monitoring Twitter, Reddit, news outlets, and on-chain data to inform trading decisions.
              Proposals are automatically created when strong sentiment signals are detected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

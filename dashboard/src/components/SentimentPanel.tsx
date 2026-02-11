"use client";

import { useState } from 'react';

interface SentimentData {
  token: string;
  score: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sources: {
    twitter: number;
    reddit: number;
    news: number;
    onchain: number;
  };
  confidence: number;
}

export default function SentimentPanel() {
  const [sentiments] = useState<SentimentData[]>([
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
  ]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🔍 Sentiment Analysis</h2>
        <span className="text-xs text-gray-400">Updated 2 min ago</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sentiments.map((data) => (
          <div key={data.token} className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{data.token}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(data.sentiment)}`}>
                {data.sentiment.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              {/* Composite Score */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Composite Score</span>
                  <span className="font-medium">{(data.score * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.score * 100}%` }}
                  />
                </div>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Confidence</span>
                  <span className="font-medium">{(data.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Sources */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Source Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">🐦 Twitter</span>
                    <span className="font-medium">{(data.sources.twitter * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">📰 News</span>
                    <span className="font-medium">{(data.sources.news * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">💬 Reddit</span>
                    <span className="font-medium">{(data.sources.reddit * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">⛓️ On-Chain</span>
                    <span className="font-medium">{(data.sources.onchain * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
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

/**
 * Shared types for the NeuroSwarm AI dashboard.
 * All components should import from here instead of using `any`.
 */

import type { Address } from '@solana/kit'

// ─── Agent Types ────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'idle' | 'voting' | 'error'

export type AgentType =
  | 'Consensus'
  | 'Analytics'
  | 'Execution'
  | 'Risk'
  | 'Learning'
  | 'Sentiment'
  | 'Arbitrage'
  | 'Governance'
  | 'Security'
  | 'Liquidity'
  | 'Custom'

export interface Agent {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  reputation: number
  votescast: number
  successRate: number
  /** On-chain address (when loaded from chain) */
  address?: Address
  /** Last heartbeat timestamp (ms since epoch) */
  lastSeen?: number
}

// ─── Proposal Types ─────────────────────────────────────────────────

export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'executed'

export type ProposalType = 'Rebalance' | 'Trade' | 'Risk Limit' | 'Strategy' | 'Emergency'

export interface Proposal {
  id: number
  title: string
  type: ProposalType
  proposer: string
  status: ProposalStatus
  votesFor: number
  votesAgainst: number
  totalVotes: number
  timeLeft: string
  description?: string
  createdAt?: number
}

// ─── Sentiment Types ────────────────────────────────────────────────

export type SentimentLabel = 'bullish' | 'bearish' | 'neutral'

export interface SentimentSources {
  twitter: number
  reddit: number
  news: number
  onchain: number
}

export interface SentimentData {
  token: string
  score: number
  sentiment: SentimentLabel
  sources: SentimentSources
  confidence: number
  updatedAt?: number
}

// ─── Arbitrage Types ────────────────────────────────────────────────

export interface ArbitrageOpportunity {
  tokenPair: string
  buyDex: string
  sellDex: string
  buyPrice: number
  sellPrice: number
  profitBps: number
  profitPercentage: number
  estimatedProfit: number
  updatedAt?: number
}

// ─── Marketplace Types ──────────────────────────────────────────────

export type AgentRating = 'legendary' | 'elite' | 'expert' | 'proficient' | 'developing'

export interface AgentListing {
  id: string
  name: string
  rating: AgentRating
  reputation: number
  winRate: number
  totalProposals: number
  avgROI: number
  rentalPrice: number
  capabilities: string[]
}

// ─── Governance Types ───────────────────────────────────────────────

export type VotingMethod = 'Simple' | 'Supermajority' | 'Unanimous' | 'Quadratic' | 'Reputation'

export interface GovernanceStats {
  totalVotesCast: number
  consensusRate: number
  avgReputation: number
}

export interface LeaderboardEntry {
  agent: string
  reputation: number
  votes: number
  winRate: number
}

// ─── Portfolio Types ────────────────────────────────────────────────

export interface PortfolioDataPoint {
  time: string
  value: number
}

export interface TokenAllocation {
  name: string
  value: number
  amount: number
  color: string
}

// ─── AI Insights ────────────────────────────────────────────────────

export type InsightType = 'positive' | 'warning' | 'info' | 'error'

export interface Insight {
  type: InsightType
  title: string
  message: string
  confidence: number
}

// ─── Notification ───────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
}

// ─── Dashboard Metrics ──────────────────────────────────────────────

export interface SwarmMetrics {
  totalAgents: number
  totalProposals: number
  activeProposals: number
  portfolioValue: number
  /** Previous values for computing deltas */
  prevTotalAgents?: number
  prevTotalProposals?: number
  prevActiveProposals?: number
  prevPortfolioValue?: number
}

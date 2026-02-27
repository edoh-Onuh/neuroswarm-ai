/**
 * useSwarmAccounts
 * ────────────────
 * Fetches ALL on-chain agent and proposal accounts once, exposes the decoded
 * data to any component.  Polling interval: 30 s.
 *
 * Known agent keypair owner addresses are hardcoded here because the program
 * derives each agent's PDA from the owner's pubkey — there is no on-chain
 * registry to enumerate them from.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { address } from '@solana/kit'
import { useSolana } from '@/context/SolanaContext'
import {
  fetchSwarmState,
  fetchAgentAccount,
  fetchProposalAccount,
  type AgentData,
  type ProposalAccountData,
  type SwarmStateData,
} from '@/lib/solana/client'
import type { Agent, Proposal, AgentType, AgentStatus, ProposalType, ProposalStatus } from '@/types'

// ── Known agent owner addresses (from keys/ keypairs) ──────────────────────
const AGENT_OWNERS = [
  { key: '2cRxRHSrTZURQpyBkPFZ3Y9YrUqRbXtBrmPXnyozz7mJ', name: 'Consensus Agent',  type: 0 },
  { key: '9oGGEqdbG1cfrhJsjZpZvN4yCGgRV8CqoUEVS4GBgDtW', name: 'Analytics Agent',  type: 1 },
  { key: 'BwokxVPRutvANCQAoDM5qHizmwqNwPJPAVHT9moaG2NK',  name: 'Execution Agent',  type: 2 },
  { key: 'HdmfqqUhn2ExkJYsBpB8JfCwoYVrvR1TtPsy8JogZeii',  name: 'Risk Management',  type: 3 },
  { key: 'DWn1GihfH9MndzLpW518aa3jMmWa5FpnyYVbGAUytNVu', name: 'Learning Agent',   type: 4 },
] as const

// ── Derived / enriched types ───────────────────────────────────────────────

export interface SwarmAccounts {
  agents: Agent[]
  proposals: Proposal[]
  swarmState: SwarmStateData | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

const AGENT_TYPE_MAP = ['Consensus', 'Analytics', 'Execution', 'Risk', 'Learning',
                        'Governance', 'Security', 'Liquidity', 'Arbitrage', 'Custom'] as const

const PROPOSAL_TYPE_MAP = ['Rebalance', 'Trade', 'Risk Limit', 'Strategy', 'Emergency'] as const

function agentTypeName(t: number): string {
  return AGENT_TYPE_MAP[t] ?? 'Custom'
}

function proposalTypeName(t: number): string {
  return PROPOSAL_TYPE_MAP[t] ?? 'Other'
}

function formatTimeLeft(expiresAt: number): string {
  const diff = expiresAt - Math.floor(Date.now() / 1000)
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function proposalStatus(p: ProposalAccountData): LiveProposal['status'] {
  if (p.executed) return 'executed'
  const now = Math.floor(Date.now() / 1000)
  if (p.expiresAt < now) {
    return p.votesFor > p.votesAgainst ? 'passed' : 'rejected'
  }
  return 'active'
}

function mapAgent(raw: AgentData, meta: typeof AGENT_OWNERS[number]): Agent {
  const successRate = raw.proposalsCreated > 0
    ? Math.round((raw.successfulProposals / raw.proposalsCreated) * 100)
    : 100
  const now = Math.floor(Date.now() / 1000)
  const recentlyActive = raw.lastActive > now - 3600
  const status: AgentStatus = !raw.isActive ? 'idle' : recentlyActive ? 'active' : 'voting'

  return {
    id: meta.key,
    name: raw.name || meta.name,
    type: agentTypeName(raw.agentType) as AgentType,
    status,
    reputation: raw.reputation / 10,
    votescast: raw.votesCast,
    successRate,
    proposalsCreated: raw.proposalsCreated,
    registeredAt: raw.registeredAt,
    lastActive: raw.lastActive,
  }
}

function mapProposal(raw: ProposalAccountData, id: number): Proposal {
  const status = proposalStatus(raw) as ProposalStatus
  const totalVotes = raw.votesFor + raw.votesAgainst + raw.votesAbstain
  const shortProposer = `${raw.proposer.slice(0, 6)}...${raw.proposer.slice(-4)}`

  return {
    id,
    title: raw.description || `Proposal #${id}`,
    type: proposalTypeName(raw.proposalType) as ProposalType,
    proposer: shortProposer,
    status,
    votesFor: raw.votesFor,
    votesAgainst: raw.votesAgainst,
    totalVotes,
    timeLeft: status === 'executed' ? 'Executed'
             : status === 'passed'   ? 'Awaiting Execution'
             : status === 'rejected' ? 'Rejected'
             : formatTimeLeft(raw.expiresAt),
    votesAbstain: raw.votesAbstain,
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    description: raw.description,
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSwarmAccounts(): SwarmAccounts {
  const { rpc } = useSolana()
  const [agents,     setAgents]     = useState<Agent[]>([])
  const [proposals,  setProposals]  = useState<Proposal[]>([])
  const [swarmState, setSwarmState] = useState<SwarmStateData | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const state = await fetchSwarmState(rpc)
      setSwarmState(state)

      const agentResults = await Promise.allSettled(
        AGENT_OWNERS.map(meta =>
          fetchAgentAccount(rpc, address(meta.key)).then(raw => ({ raw, meta }))
        )
      )
      const liveAgents: Agent[] = agentResults.flatMap(r => {
        if (r.status === 'fulfilled' && r.value.raw) {
          return [mapAgent(r.value.raw, r.value.meta)]
        }
        if (r.status === 'fulfilled') {
          const { meta } = r.value
          return [{
            id: meta.key,
            name: meta.name,
            type: agentTypeName(meta.type) as AgentType,
            status: 'idle' as AgentStatus,
            reputation: 100.0,
            votescast: 0,
            successRate: 100,
            proposalsCreated: 0,
            registeredAt: 0,
            lastActive: 0,
          }]
        }
        return []
      })
      setAgents(liveAgents)

      const total = state ? Number(state.totalProposals) : 0
      if (total > 0) {
        const proposalResults = await Promise.allSettled(
          Array.from({ length: total }, (_, i) =>
            fetchProposalAccount(rpc, BigInt(i)).then(raw => ({ raw, id: i }))
          )
        )
        const liveProposals: Proposal[] = proposalResults.flatMap(r => {
          if (r.status === 'fulfilled' && r.value.raw) {
            return [mapProposal(r.value.raw, r.value.id)]
          }
          return []
        })
        setProposals(liveProposals)
      } else {
        setProposals([])
      }
    } catch (err) {
      console.error('[useSwarmAccounts]', err)
      setError('Could not reach on-chain program. Is the RPC endpoint correct?')
    } finally {
      setIsLoading(false)
    }
  }, [rpc])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  return { agents, proposals, swarmState, isLoading, error, refresh }
}

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootState} from '../store/store';
import {useAgents} from '../hooks/useAgents';
import {useProposals} from '../hooks/useProposals';
import AgentCard from '../components/AgentCard';
import PerformanceChart from '../components/PerformanceChart';
import NotificationBadge from '../components/NotificationBadge';

export default function DashboardScreen({navigation}: any) {
  const {agents, loading: agentsLoading, refresh: refreshAgents} = useAgents();
  const {proposals, loading: proposalsLoading} = useProposals();
  const portfolio = useSelector((state: RootState) => state.portfolio);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshAgents();
    setRefreshing(false);
  }, []);

  const activeAgents = agents.filter(a => a.status === 'active');
  const pendingProposals = proposals.filter(p => p.status === 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NeuroSwarm AI</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}>
            <NotificationBadge count={pendingProposals.length} />
            <Icon name="bell" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Portfolio Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Portfolio Value</Text>
          <Text style={styles.portfolioValue}>
            ${portfolio.totalValue.toLocaleString()}
          </Text>
          <View style={styles.profitRow}>
            <Text
              style={[
                styles.profitText,
                {color: portfolio.dailyChange >= 0 ? '#10b981' : '#ef4444'},
              ]}>
              {portfolio.dailyChange >= 0 ? '+' : ''}
              {portfolio.dailyChange.toFixed(2)}%
            </Text>
            <Text style={styles.profitLabel}>Today</Text>
          </View>
        </View>

        {/* Performance Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>7-Day Performance</Text>
          <PerformanceChart data={portfolio.history} />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="robot" size={32} color="#8b5cf6" />
            <Text style={styles.statValue}>{activeAgents.length}</Text>
            <Text style={styles.statLabel}>Active Agents</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="vote" size={32} color="#3b82f6" />
            <Text style={styles.statValue}>{pendingProposals.length}</Text>
            <Text style={styles.statLabel}>Pending Votes</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="chart-line" size={32} color="#10b981" />
            <Text style={styles.statValue}>
              {portfolio.totalTrades}
            </Text>
            <Text style={styles.statLabel}>Total Trades</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="trophy" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>
              {portfolio.winRate.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>

        {/* Active Agents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Agents</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Agents')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {activeAgents.slice(0, 3).map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </View>

        {/* Recent Proposals */}
        {pendingProposals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Proposals</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Proposals')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.alertBanner}>
              <Icon name="alert-circle" size={20} color="#f59e0b" />
              <Text style={styles.alertText}>
                {pendingProposals.length} proposal
                {pendingProposals.length > 1 ? 's' : ''} need your vote
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitText: {
    fontSize: 18,
    fontWeight: '600',
  },
  profitLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  seeAll: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#fbbf24',
  },
});

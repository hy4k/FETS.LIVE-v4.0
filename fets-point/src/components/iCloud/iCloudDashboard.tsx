import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle,
  AlertTriangle,
  Users,
  Plus,
  Activity,
  FileText,
  ArrowRight,
  TrendingUp,
  Zap,
  Target,
  Award,
  Calendar
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCandidateMetrics, useIncidentStats } from '../../hooks/useQueries'
import { GlassCard } from './GlassCard'
import { AnimatedCounter } from './AnimatedCounter'
import { ProgressRing } from './ProgressRing'
import { TimelineWidget } from './TimelineWidget'
import { QuickActions } from './QuickActions'
import { StatusIndicator } from './StatusIndicator'

interface iCloudDashboardProps {
  onNavigate?: (tab: string) => void
}

export function ICloudDashboard({ onNavigate }: iCloudDashboardProps = {}) {
  const today = new Date().toISOString().split('T')[0]
  
  // Data fetching
  const { data: candidateMetrics, isLoading: candidateLoading } = useCandidateMetrics(today)
  const { data: incidentStats, isLoading: incidentLoading } = useIncidentStats()
  
  // Mock checklist data (replace with actual data fetching)
  const [checklistProgress, setChecklistProgress] = useState(11)
  
  return (
    <div className={`icloud-dashboard light`}>
      {/* Hero Welcome Banner */}
      <div className="dashboard-hero-banner">
        <div className="hero-content">
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Zap size={16} className="hero-badge-icon" />
            <span>Premium Dashboard</span>
          </motion.div>
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Welcome to FETS Command Center
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Your centralized hub for managing examinations, candidates, and operations
          </motion.p>
          <motion.div 
            className="hero-stats-mini"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="hero-stat-item">
              <Calendar size={16} />
              <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="hero-stat-item">
              <TrendingUp size={16} />
              <span>All Systems Operational</span>
            </div>
          </motion.div>
        </div>
        <div className="hero-decoration">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
        </div>
      </div>
      
      <div className="dashboard-content">
        {/* Primary KPI Section (Hero Cards) */}
        <section className="kpi-section">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-title-wrapper">
              <Target size={24} className="section-icon" />
              <div>
                <h2 className="section-title">Key Performance Indicators</h2>
                <p className="section-subtitle">Real-time overview of today's operations</p>
              </div>
            </div>
            <div className="section-badge">
              <span className="live-indicator"></span>
              <span>Live Data</span>
            </div>
          </motion.div>
          <div className="kpi-grid">
            {/* Candidates Today */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <GlassCard 
                className="kpi-card candidates-card premium-card"
                onClick={() => onNavigate?.('candidate-tracker')}
              >
                <div className="kpi-card-header">
                  <div className="kpi-icon">
                    <Users size={24} />
                  </div>
                  <StatusIndicator 
                    status={candidateMetrics?.total ? 'active' : 'inactive'} 
                  />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value-wrapper">
                    <AnimatedCounter 
                      value={candidateMetrics?.total || 0} 
                      className="kpi-value"
                      loading={candidateLoading}
                    />
                    <span className="kpi-trend kpi-trend-up">+12%</span>
                  </div>
                  <p className="kpi-label">Scheduled Candidates</p>
                  <p className="kpi-sublabel">Ready for examination</p>
                </div>
                <div className="kpi-card-footer">
                  <span className="kpi-footer-text">View Details</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>
            </motion.div>
            
            {/* Active Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <GlassCard className="kpi-card exams-card premium-card">
                <div className="kpi-card-header">
                  <div className="kpi-icon">
                    <Activity size={24} />
                  </div>
                  <StatusIndicator 
                    status={candidateMetrics?.inProgress ? 'active' : 'inactive'} 
                  />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value-wrapper">
                    <AnimatedCounter 
                      value={candidateMetrics?.inProgress || 0} 
                      className="kpi-value"
                      loading={candidateLoading}
                    />
                    <span className="kpi-trend kpi-trend-neutral">Live</span>
                  </div>
                  <p className="kpi-label">Active Examinations</p>
                  <p className="kpi-sublabel">Currently in progress</p>
                </div>
                <div className="kpi-card-footer">
                  <span className="kpi-footer-text">Monitor Now</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>
            </motion.div>
            
            {/* Open Incidents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <GlassCard className="kpi-card incidents-card premium-card">
                <div className="kpi-card-header">
                  <div className="kpi-icon">
                    <AlertTriangle size={24} />
                  </div>
                  <StatusIndicator 
                    status={incidentStats?.open === 0 ? 'success' : 'warning'} 
                  />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value-wrapper">
                    <AnimatedCounter 
                      value={incidentStats?.open || 0} 
                      className="kpi-value"
                      loading={incidentLoading}
                    />
                    {incidentStats?.open === 0 ? (
                      <span className="kpi-trend kpi-trend-success">✓ Clear</span>
                    ) : (
                      <span className="kpi-trend kpi-trend-down">-3%</span>
                    )}
                  </div>
                  <p className="kpi-label">{incidentStats?.open === 0 ? 'No Active Issues' : 'Open Incidents'}</p>
                  <p className="kpi-sublabel">{incidentStats?.open === 0 ? 'System running smoothly' : 'Requires attention'}</p>
                </div>
                <div className="kpi-card-footer">
                  <span className="kpi-footer-text">View Issues</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>
            </motion.div>
            
            {/* Task Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <GlassCard className="kpi-card progress-card premium-card">
                <div className="kpi-card-header">
                  <div className="kpi-icon">
                    <Award size={24} />
                  </div>
                  <StatusIndicator 
                    status={checklistProgress > 50 ? 'success' : checklistProgress > 0 ? 'warning' : 'inactive'} 
                  />
                </div>
                <div className="kpi-content">
                  <div className="progress-value">
                    <ProgressRing 
                      progress={checklistProgress} 
                      size={70}
                      strokeWidth={7}
                    />
                    <span className="progress-text">{checklistProgress}%</span>
                  </div>
                  <p className="kpi-label">Task Completion</p>
                  <p className="kpi-sublabel">2 of 20 tasks done</p>
                </div>
                <div className="kpi-card-footer">
                  <span className="kpi-footer-text">View Tasks</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>
        
        {/* Timeline / Next Few Days Component */}
        <motion.section 
          className="timeline-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <TimelineWidget onNavigate={onNavigate} />
        </motion.section>
        
        {/* Workflow Snapshot Panel */}
        <motion.section 
          className="workflow-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div className="workflow-grid">
            {/* Incident Overview */}
            <GlassCard className="workflow-card incident-overview">
              <div className="workflow-header">
                <div className="workflow-icon incidents">
                  <AlertTriangle size={20} />
                </div>
                <div className="workflow-info">
                  <h3>Incident Overview</h3>
                  <p>Track and resolve issues</p>
                </div>
                <button 
                  className="workflow-action"
                  onClick={() => onNavigate?.('log-incident')}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
              
              <div className="incident-stats">
                <div className="stat-item open">
                  <span className="stat-value">{incidentStats?.open || 0}</span>
                  <span className="stat-label">Open</span>
                </div>
                <div className="stat-item progress">
                  <span className="stat-value">{incidentStats?.inProgress || 0}</span>
                  <span className="stat-label">In Progress</span>
                </div>
                <div className="stat-item resolved">
                  <span className="stat-value">{incidentStats?.resolved || 0}</span>
                  <span className="stat-label">Resolved</span>
                </div>
              </div>
              
              <div className="incident-chart">
                <div className="chart-container">
                  <div 
                    className="chart-segment open"
                    style={{ 
                      width: `${incidentStats?.total ? (incidentStats.open / incidentStats.total) * 100 : 0}%` 
                    }}
                  />
                  <div 
                    className="chart-segment progress"
                    style={{ 
                      width: `${incidentStats?.total ? (incidentStats.inProgress / incidentStats.total) * 100 : 0}%` 
                    }}
                  />
                  <div 
                    className="chart-segment resolved"
                    style={{ 
                      width: `${incidentStats?.total ? (incidentStats.resolved / incidentStats.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </GlassCard>
            
            {/* Tasks/Checklist Progress */}
            <GlassCard className="workflow-card tasks-overview">
              <div className="workflow-header">
                <div className="workflow-icon tasks">
                  <FileText size={20} />
                </div>
                <div className="workflow-info">
                  <h3>Tasks Progress</h3>
                  <p>Monitor task completion</p>
                </div>
                <button 
                  className="workflow-action"
                  onClick={() => onNavigate?.('checklist-management')}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
              
              <div className="tasks-progress">
                <div className="progress-ring-container">
                  <ProgressRing 
                    progress={checklistProgress} 
                    size={80}
                    strokeWidth={8}
                  />
                  <div className="progress-center">
                    <span className="progress-percentage">{checklistProgress}%</span>
                    <span className="progress-label">Complete</span>
                  </div>
                </div>
                
                <div className="task-breakdown">
                  <p className="task-count">2/20 tasks today</p>
                  <p className="overall-progress">{checklistProgress}% completed</p>
                </div>
              </div>
              
              <button className="create-task-btn">
                <Plus size={16} />
                Quick Task
              </button>
            </GlassCard>
          </div>
        </motion.section>
        
        {/* Quick Actions Strip */}
        <motion.section
          className="quick-actions-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <QuickActions onNavigate={onNavigate} />
        </motion.section>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, FileText, ArrowRight, AlertCircle } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'
import { cn, formatDuration } from '@/lib/utils'
import { getInterviewHistory } from '@/lib/api'

export function History() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function load() {
      setError('')
      setIsLoading(true)
      try {
        const data = await getInterviewHistory()
        if (!mounted) return
        setItems(data.items || [])
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Failed to load history')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleString()
  }

  const getScoreLabel = (score) => {
    if (score == null) return 'Pending'
    if (score >= 85) return 'Strong'
    if (score >= 70) return 'Good'
    if (score >= 55) return 'Fair'
    return 'Needs Work'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITIONS.slow}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primaryMuted flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary">
              Interview History
            </h1>
            <p className="text-sm text-text-secondary">
              Browse your past interviews and review how your performance has evolved over time.
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-semantic-errorMuted/40 border border-semantic-error/50">
          <AlertCircle className="w-4 h-4 text-semantic-error mt-0.5 flex-shrink-0" />
          <p className="text-xs text-semantic-error">{error}</p>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading interview history…</p>
      ) : items.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-text-secondary mb-3">
            You haven&apos;t completed any interviews yet.
          </p>
          <Button size="lg" onClick={() => navigate('/setup')}>
            Start Your First Interview
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const durationSeconds =
              item.startedAt && item.completedAt
                ? (new Date(item.completedAt) - new Date(item.startedAt)) / 1000
                : null

            return (
              <GlassCard key={item.id} hover padding="md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.role || 'Interview'}
                      </Badge>
                      {item.experienceLevel && (
                        <span className="text-[11px] text-text-muted uppercase tracking-wide">
                          {item.experienceLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mb-1">
                      {formatDate(item.startedAt)}
                      {durationSeconds != null && (
                        <>
                          {' · '}
                          <Clock className="inline-block w-3 h-3 mr-0.5" />
                          <span>{formatDuration(Math.round(durationSeconds))}</span>
                        </>
                      )}
                    </p>
                    {item.skills?.length > 0 && (
                      <p className="text-xs text-text-muted mb-1 truncate">
                        Skills:{' '}
                        <span className="text-text-secondary">
                          {item.skills.join(', ')}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-text-secondary">
                      Status:{' '}
                      <span className="font-medium text-text-primary">
                        {item.status === 'completed'
                          ? 'Completed'
                          : item.status === 'active'
                            ? 'In Progress'
                            : 'Abandoned'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-xs text-text-muted mb-0.5">
                        Overall Score
                      </div>
                      <div className="text-lg font-semibold text-accent-primary">
                        {item.overallScore != null ? `${item.overallScore}/100` : '—'}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {item.overallScore != null ? getScoreLabel(item.overallScore) : 'Pending'}
                      </div>
                    </div>
                    {item.verdict && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[11px] uppercase tracking-wide',
                          item.verdict === 'Strong Hire'
                            ? 'border-semantic-success text-semantic-success'
                            : item.verdict === 'No Hire'
                              ? 'border-semantic-error text-semantic-error'
                              : ''
                        )}
                      >
                        {item.verdict}
                      </Badge>
                    )}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default History


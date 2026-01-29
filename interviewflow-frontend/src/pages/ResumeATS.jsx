import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Upload,
  AlertCircle,
  Target,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button, Badge, Progress } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'
import { analyzeResumeATS } from '@/lib/api'
import { cn } from '@/lib/utils'

export function ResumeATS() {
  const [file, setFile] = useState(null)
  const [targetRole, setTargetRole] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (!['application/pdf', 'text/plain'].includes(f.type)) {
      setError('Please upload a PDF or TXT resume file.')
      setFile(null)
      return
    }

    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      setFile(null)
      return
    }

    setError('')
    setFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload your resume first.')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const atsResult = await analyzeResumeATS(file, targetRole)
      setResult(atsResult)
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sectionLabels = {
    structure: 'Structure',
    clarity: 'Clarity',
    impact: 'Impact',
    keywords: 'Role Keywords',
    readability: 'Readability',
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
              Resume ATS Check
            </h1>
            <p className="text-sm text-text-secondary">
              Get an honest, ATS-style score and precise recommendations to improve your resume.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Upload & Target Role */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...TRANSITIONS.smooth }}
        >
          <GlassCard>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-elevated hover:bg-surface-muted transition-colors">
                    <Upload className="w-4 h-4 text-text-muted" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary">
                        {file ? file.name : 'Upload your resume (PDF or TXT)'}
                      </span>
                      <span className="text-xs text-text-muted">
                        We only analyze the text locally on the server to generate feedback.
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                    Target Role (optional)
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface-elevated focus-within:border-accent-primary">
                    <Target className="w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="e.g. Frontend Engineer, Backend Intern, Full-Stack Developer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-text-primary placeholder:text-text-muted"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    If provided, the analysis checks alignment with this specific role.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-semantic-errorMuted/40 border border-semantic-error/50">
                  <AlertCircle className="w-4 h-4 text-semantic-error mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-semantic-error">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button size="lg" onClick={handleAnalyze} disabled={!file || isLoading}>
                  {isLoading ? 'Analyzing…' : 'Run ATS Check'}
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Results */}
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...TRANSITIONS.smooth }}
          >
            <div className="space-y-6">
              {/* Overall Score */}
              <GlassCard variant="bordered" glow className="py-8 px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-text-primary mb-1">
                      ATS Fit Score
                    </h2>
                    <p className="text-sm text-text-secondary max-w-md">
                      {result.summary ||
                        'This score estimates how well your resume is likely to match typical ATS filters and recruiter expectations for this role.'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent-primary leading-none mb-1">
                      {result.overallScore}
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">
                      /100 Overall
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Section Scores */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-text-muted" />
                  <h3 className="text-sm font-medium text-text-primary">
                    Section Breakdown
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(result.sectionScores || {}).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-text-secondary">
                          {sectionLabels[key] || key}
                        </span>
                        <span className="text-sm font-semibold text-text-primary">
                          {value}%
                        </span>
                      </div>
                      <Progress
                        value={value}
                        className="h-2.5"
                        variant={value >= 70 ? 'success' : value >= 50 ? 'warning' : 'error'}
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Strengths & Issues */}
              <div className="grid md:grid-cols-2 gap-4">
                <GlassCard>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-semantic-success" />
                    <h3 className="text-sm font-medium text-text-primary">Strengths</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(result.strengths || []).length > 0 ? (
                      result.strengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-semantic-success flex-shrink-0" />
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {item}
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-text-muted">
                        Run the ATS check to see identified strengths.
                      </li>
                    )}
                  </ul>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-semantic-warning" />
                    <h3 className="text-sm font-medium text-text-primary">Issues</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(result.issues || []).length > 0 ? (
                      result.issues.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-semantic-warning flex-shrink-0" />
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {item}
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-text-muted">
                        Any structural or content issues will be highlighted here.
                      </li>
                    )}
                  </ul>
                </GlassCard>
              </div>

              {/* Missing Keywords & Recommendations */}
              <div className="grid md:grid-cols-2 gap-4">
                <GlassCard>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                      Missing Keywords
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(result.missingKeywords || []).length > 0 ? (
                      result.missingKeywords.map((kw) => (
                        <span
                          key={kw}
                          className={cn(
                            'px-2 py-1 rounded-full text-[11px] font-medium',
                            'bg-semantic-warningMuted text-text-primary'
                          )}
                        >
                          {kw}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-text-muted">
                        If the AI detects important missing concepts for the target role, they will
                        appear here.
                      </p>
                    )}
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                      Recommendations
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {(result.recommendations || []).length > 0 ? (
                      result.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" />
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {rec}
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-text-muted">
                        Concrete, ATS-friendly suggestions will appear here after analysis.
                      </li>
                    )}
                  </ul>
                </GlassCard>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}

export default ResumeATS


import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Briefcase, Check, Upload, AlertCircle } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { SKILL_CATEGORIES, DIFFICULTY_LEVELS, TRANSITIONS } from '@/lib/constants'
import { cn, staggerDelay } from '@/lib/utils'
import { analyzeResume } from '@/lib/api'

export function Setup() {
  const navigate = useNavigate()
  const [selectedSkills, setSelectedSkills] = useState([])
  const [difficulty, setDifficulty] = useState('mid')
  const [duration, setDuration] = useState(20)

  // Resume-based configuration
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeTopics, setResumeTopics] = useState([])
  const [selectedResumeTopics, setSelectedResumeTopics] = useState([])
  const [mode, setMode] = useState('skills') // 'skills' | 'resume_only' | 'mixed'
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false)
  const [resumeError, setResumeError] = useState('')

  const toggleSkill = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    )
  }

  const handleResumeFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      setResumeError('Please upload a PDF or TXT file')
      setResumeFile(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File size must be less than 5MB')
      setResumeFile(null)
      return
    }

    setResumeError('')
    setResumeFile(file)
  }

  const handleAnalyzeResume = async () => {
    if (!resumeFile) {
      setResumeError('Please choose a resume file first')
      return
    }

    setIsAnalyzingResume(true)
    setResumeError('')

    try {
      const result = await analyzeResume(resumeFile)
      const topics = result.topics || []
      setResumeTopics(topics)
      setSelectedResumeTopics(topics)
      if (topics.length > 0 && mode === 'skills') {
        setMode('mixed')
      }
    } catch (error) {
      setResumeError(error.message || 'Failed to analyze resume')
    } finally {
      setIsAnalyzingResume(false)
    }
  }

  const toggleResumeTopic = (topic) => {
    setSelectedResumeTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    )
  }

  const canStart = (() => {
    if (mode === 'skills') return selectedSkills.length > 0
    if (mode === 'resume_only') return selectedResumeTopics.length > 0
    // mixed
    return selectedSkills.length > 0 || selectedResumeTopics.length > 0
  })()

  const handleStart = () => {
    navigate('/interview', {
      state: {
        skills: selectedSkills,
        difficulty,
        duration,
        resumeTopics: selectedResumeTopics,
        mode,
      },
    })
  }

  const allSkills = [
    ...SKILL_CATEGORIES.technical,
    ...SKILL_CATEGORIES.behavioral,
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITIONS.slow}
      >
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-text-primary mb-3">
          Configure Your Interview
        </h1>
        <p className="text-text-secondary">
          Customize your practice session to focus on the skills that matter most.
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Resume Upload & Mode Selection (Optional) */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...TRANSITIONS.smooth }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-accent-primaryMuted/50 flex items-center justify-center">
                <Upload className="w-4 h-4 text-accent-primary" />
              </div>
              <div>
                <h2 className="font-medium text-text-primary">Resume (optional)</h2>
                <p className="text-sm text-text-muted">
                  Upload your resume to extract topics and get resume-based or mixed questions.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-elevated hover:bg-surface-muted cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-text-muted" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary">
                        {resumeFile ? resumeFile.name : 'Choose resume file (PDF or TXT)'}
                      </span>
                      <span className="text-xs text-text-muted">
                        Max 5MB. We only analyze text, nothing is stored.
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleResumeFileChange}
                    className="hidden"
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!resumeFile || isAnalyzingResume}
                  onClick={handleAnalyzeResume}
                >
                  {isAnalyzingResume ? 'Analyzing…' : 'Analyze Resume'}
                </Button>
              </div>

              {resumeError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-semantic-errorMuted/30 border border-semantic-error/40">
                  <AlertCircle className="w-4 h-4 text-semantic-error mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-semantic-error">{resumeError}</p>
                </div>
              )}

              {resumeTopics.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Topics detected from your resume
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeTopics.map((topic) => {
                        const isSelected = selectedResumeTopics.includes(topic)
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleResumeTopic(topic)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                              isSelected
                                ? 'bg-accent-primary text-text-inverse border-accent-primary'
                                : 'bg-surface-elevated text-text-primary border-border hover:border-border-strong hover:bg-surface-muted'
                            )}
                          >
                            {topic}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Question Source
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('skills')}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          mode === 'skills'
                            ? 'bg-accent-primaryMuted/40 border-accent-primary text-text-primary'
                            : 'bg-surface-elevated border-border hover:border-border-strong hover:bg-surface-muted'
                        )}
                      >
                        Skills only
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('resume_only')}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          mode === 'resume_only'
                            ? 'bg-accent-primaryMuted/40 border-accent-primary text-text-primary'
                            : 'bg-surface-elevated border-border hover:border-border-strong hover:bg-surface-muted'
                        )}
                      >
                        Resume topics only
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('mixed')}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          mode === 'mixed'
                            ? 'bg-accent-primaryMuted/40 border-accent-primary text-text-primary'
                            : 'bg-surface-elevated border-border hover:border-border-strong hover:bg-surface-muted'
                        )}
                      >
                        Mixed (skills + resume)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.section>

        {/* Skills Selection */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...TRANSITIONS.smooth }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-accent-primaryMuted/50 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-accent-primary" />
              </div>
              <div>
                <h2 className="font-medium text-text-primary">Select Skills</h2>
                <p className="text-sm text-text-muted">Choose topics to be tested on</p>
              </div>
            </div>

            {/* Technical Skills */}
            <div className="mb-5">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                Technical
              </h3>
              <div className="flex flex-wrap gap-2">
                {SKILL_CATEGORIES.technical.map((skill, index) => {
                  const isSelected = selectedSkills.includes(skill.id)
                  return (
                    <motion.button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                        'border transition-all duration-200',
                        isSelected
                          ? 'bg-accent-primary text-text-inverse border-accent-primary'
                          : 'bg-surface-elevated text-text-primary border-border hover:border-border-strong hover:bg-surface-muted'
                      )}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: staggerDelay(index, 0.03) }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {skill.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Behavioral Skills */}
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                Behavioral
              </h3>
              <div className="flex flex-wrap gap-2">
                {SKILL_CATEGORIES.behavioral.map((skill, index) => {
                  const isSelected = selectedSkills.includes(skill.id)
                  return (
                    <motion.button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                        'border transition-all duration-200',
                        isSelected
                          ? 'bg-accent-primary text-text-inverse border-accent-primary'
                          : 'bg-surface-elevated text-text-primary border-border hover:border-border-strong hover:bg-surface-muted'
                      )}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: staggerDelay(SKILL_CATEGORIES.technical.length + index, 0.03),
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {skill.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Difficulty Selection */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...TRANSITIONS.smooth }}
        >
          <GlassCard>
            <h2 className="font-medium text-text-primary mb-4">Difficulty Level</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setDifficulty(level.id)}
                  className={cn(
                    'p-3 rounded-lg text-left transition-all duration-200',
                    'border',
                    difficulty === level.id
                      ? 'bg-accent-primaryMuted/30 border-accent-primary/30'
                      : 'bg-surface-elevated border-border hover:border-border-strong hover:bg-surface-muted'
                  )}
                >
                  <div className="font-medium text-text-primary text-sm mb-0.5">
                    {level.label}
                  </div>
                  <div className="text-xs text-text-muted">
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.section>

        {/* Duration Selection */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...TRANSITIONS.smooth }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center">
                <Clock className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <h2 className="font-medium text-text-primary">Duration</h2>
                <p className="text-sm text-text-muted">
                  How long do you want to practice?
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {[10, 20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={cn(
                    'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm text-center',
                    'border transition-all duration-200',
                    duration === mins
                      ? 'bg-accent-primaryMuted/30 text-accent-primary border-accent-primary/30'
                      : 'bg-surface-elevated text-text-primary border-border hover:border-border-strong hover:bg-surface-muted'
                  )}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.section>

        {/* Summary & Start */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...TRANSITIONS.smooth }}
        >
          <GlassCard variant={canStart ? 'bordered' : 'default'} glow={canStart}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-text-primary mb-2">
                  Ready to begin?
                </h3>
                <div className="flex flex-wrap gap-2">
                  {canStart ? (
                    <>
                      {mode !== 'resume_only' && selectedSkills.length > 0 && (
                        <>
                          {selectedSkills.slice(0, 3).map((skillId) => {
                            const skill = allSkills.find((s) => s.id === skillId)
                            return (
                              <Badge key={skillId} variant="secondary">
                                {skill?.label}
                              </Badge>
                            )
                          })}
                          {selectedSkills.length > 3 && (
                            <Badge variant="secondary">
                              +{selectedSkills.length - 3} more
                            </Badge>
                          )}
                        </>
                      )}
                      {mode !== 'skills' && selectedResumeTopics.length > 0 && (
                        <>
                          {selectedResumeTopics.slice(0, 3).map((topic) => (
                            <Badge key={topic} variant="secondary">
                              {topic}
                            </Badge>
                          ))}
                          {selectedResumeTopics.length > 3 && (
                            <Badge variant="secondary">
                              +{selectedResumeTopics.length - 3} more
                            </Badge>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-text-muted">
                      {mode === 'skills'
                        ? 'Select at least one skill to continue'
                        : 'Select at least one resume topic or skill to continue'}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="lg"
                disabled={!canStart}
                onClick={handleStart}
              >
                Start Interview
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </GlassCard>
        </motion.section>
      </div>
    </div>
  )
}

export default Setup

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Briefcase, Check } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { SKILL_CATEGORIES, DIFFICULTY_LEVELS, TRANSITIONS } from '@/lib/constants'
import { cn, staggerDelay } from '@/lib/utils'

export function Setup() {
  const navigate = useNavigate()
  const [selectedSkills, setSelectedSkills] = useState([])
  const [difficulty, setDifficulty] = useState('mid')
  const [duration, setDuration] = useState(20)

  const toggleSkill = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    )
  }

  const handleStart = () => {
    navigate('/interview', {
      state: { skills: selectedSkills, difficulty, duration },
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
          <GlassCard variant={selectedSkills.length > 0 ? 'bordered' : 'default'} glow={selectedSkills.length > 0}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-text-primary mb-2">
                  Ready to begin?
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.length > 0 ? (
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
                  ) : (
                    <span className="text-sm text-text-muted">
                      Select at least one skill to continue
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="lg"
                disabled={selectedSkills.length === 0}
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

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, BarChart3, Zap, CheckCircle2 } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { PIPELINE_STAGES, TRANSITIONS } from '@/lib/constants'
import { cn, staggerDelay } from '@/lib/utils'

const features = [
  {
    icon: Brain,
    title: 'Adaptive Questions',
    description: 'AI-powered questions that adjust to your skill level and responses in real-time.',
  },
  {
    icon: BarChart3,
    title: 'Instant Analysis',
    description: 'Get detailed feedback on clarity, depth, and communication after each answer.',
  },
  {
    icon: Zap,
    title: 'Structured Pipeline',
    description: 'A modular interview flow from role definition to comprehensive performance report.',
  },
]

const benefits = [
  'Practice technical and behavioral questions',
  'Receive actionable feedback instantly',
  'Track your progress over time',
  'Prepare for FAANG-level interviews',
]

export function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Hero Section */}
      <section className="pt-8 pb-20 sm:pt-12">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITIONS.slow}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, ...TRANSITIONS.smooth }}
          >
            <Badge variant="default" className="mb-6">
              AI-Powered Interview Practice
            </Badge>
          </motion.div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-text-primary leading-[1.1] mb-6 tracking-tight">
            Master your next
            <br />
            <span className="text-accent-primary">technical interview</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary mb-8 max-w-2xl leading-relaxed">
            Practice with an AI that understands context, adapts to your responses,
            and provides actionable feedback to help you land your dream role.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild>
              <Link to="/setup">
                Start Practicing
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/report">View Sample Report</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Benefits Strip */}
      <section className="py-12 border-y border-border">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit}
              className="flex items-start gap-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: staggerDelay(index, 0.1), ...TRANSITIONS.smooth }}
            >
              <CheckCircle2 className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary">{benefit}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-3xl font-semibold text-text-primary mb-4">
            How it works
          </h2>
          <p className="text-text-secondary max-w-xl">
            Our AI-driven platform guides you through realistic interview scenarios,
            providing instant feedback to help you improve.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: staggerDelay(index), ...TRANSITIONS.smooth }}
            >
              <GlassCard variant="default" hover className="h-full">
                <div className="flex flex-col h-full">
                  <div className="w-10 h-10 rounded-lg bg-accent-primaryMuted/50 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-accent-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="py-20 border-t border-border">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-3xl font-semibold text-text-primary mb-4">
            The interview pipeline
          </h2>
          <p className="text-text-secondary max-w-xl">
            Every interview follows a structured flow, from role definition to your final performance report.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line - desktop only */}
          <div className="hidden lg:block absolute top-6 left-8 right-8 h-px bg-border" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {PIPELINE_STAGES.map((stage, index) => (
              <motion.div
                key={stage.id}
                className="relative"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: staggerDelay(index, 0.05), ...TRANSITIONS.smooth }}
              >
                <div className="text-center">
                  {/* Step number */}
                  <div className="relative z-10 w-12 h-12 mx-auto mb-3 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                    <span className="text-sm font-semibold text-text-primary">{index + 1}</span>
                  </div>
                  <h3 className="font-medium text-text-primary text-sm mb-1">
                    {stage.name}
                  </h3>
                  <p className="text-xs text-text-muted hidden sm:block">
                    {stage.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard variant="bordered" glow className="text-center py-12 px-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary mb-4">
              Ready to level up?
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Start your first mock interview and get instant AI-powered feedback
              to improve your performance.
            </p>
            <Button size="lg" asChild>
              <Link to="/setup">
                Begin Your Interview
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  )
}

export default Home

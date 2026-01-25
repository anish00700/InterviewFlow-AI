/**
 * Application constants
 * Updated for "Editorial Precision" design system
 */

// API base URL - use environment variable or default to relative path
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Interview pipeline stages
export const PIPELINE_STAGES = [
  {
    id: 'role',
    name: 'Role',
    description: 'Define the interview role and context',
    icon: 'Briefcase',
  },
  {
    id: 'context',
    name: 'Context',
    description: 'Set up interview parameters',
    icon: 'Settings',
  },
  {
    id: 'question',
    name: 'Question',
    description: 'Generate and present questions',
    icon: 'MessageCircle',
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Track conversation history',
    icon: 'Brain',
  },
  {
    id: 'evaluation',
    name: 'Evaluation',
    description: 'Analyze responses in real-time',
    icon: 'BarChart',
  },
  {
    id: 'feedback',
    name: 'Feedback',
    description: 'Provide actionable insights',
    icon: 'Lightbulb',
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Generate comprehensive summary',
    icon: 'FileText',
  },
]

// Skill categories for interview setup
export const SKILL_CATEGORIES = {
  technical: [
    { id: 'react', label: 'React' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'nodejs', label: 'Node.js' },
    { id: 'python', label: 'Python' },
    { id: 'system-design', label: 'System Design' },
    { id: 'algorithms', label: 'Algorithms' },
    { id: 'databases', label: 'Databases' },
    { id: 'aws', label: 'AWS' },
  ],
  behavioral: [
    { id: 'leadership', label: 'Leadership' },
    { id: 'communication', label: 'Communication' },
    { id: 'problem-solving', label: 'Problem Solving' },
    { id: 'teamwork', label: 'Teamwork' },
  ],
}

// Interview difficulty levels
export const DIFFICULTY_LEVELS = [
  { id: 'junior', label: 'Junior', description: 'Entry-level questions' },
  { id: 'mid', label: 'Mid-Level', description: 'Intermediate complexity' },
  { id: 'senior', label: 'Senior', description: 'Advanced scenarios' },
  { id: 'staff', label: 'Staff+', description: 'Architecture & leadership' },
]

// Evaluation metrics
export const EVALUATION_METRICS = [
  { id: 'clarity', label: 'Clarity', description: 'How clear is the response?' },
  { id: 'coherence', label: 'Coherence', description: 'Logical flow of ideas' },
  { id: 'depth', label: 'Depth', description: 'Technical accuracy and detail' },
  { id: 'communication', label: 'Communication', description: 'Presentation style' },
]

// Animation variants for Framer Motion
export const MOTION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  },
}

// Transition presets - refined and subtle
export const TRANSITIONS = {
  spring: { type: 'spring', stiffness: 400, damping: 35 },
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  snappy: { duration: 0.2, ease: 'easeOut' },
}

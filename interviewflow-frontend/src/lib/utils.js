import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx
 * Handles conflicts intelligently (e.g., 'p-4 p-6' becomes 'p-6')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format duration in seconds to mm:ss
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Delay utility for async operations
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Interpolate between two values
 */
export function lerp(start, end, t) {
  return start + (end - start) * t
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, length = 100) {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

/**
 * Create stagger delay for animations
 */
export function staggerDelay(index, baseDelay = 0.1) {
  return index * baseDelay
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// API base URL - use environment variable or default to relative path
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

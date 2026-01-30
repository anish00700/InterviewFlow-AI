import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Web Speech API (SpeechRecognition) hook for speech-to-text.
 * Supported in Chrome, Edge, Safari. Not in Firefox.
 */
export function useSpeechRecognition(options = {}) {
  const { onResult, onError, lang = 'en-US', continuous = true, interimResults = true } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }
    setIsSupported(true)

    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      if (finalTranscript) onResult?.(finalTranscript, false)
      if (interimTranscript) onResult?.(interimTranscript, true)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // User didn't say anything; don't treat as fatal
        setError(null)
        return
      }
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied.')
      } else {
        setError(event.error || 'Speech recognition error.')
      }
      onError?.(event)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    return () => {
      try {
        recognition.abort()
      } catch (_) {}
    }
  }, [continuous, interimResults, lang, onResult, onError])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return
    setError(null)
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (e) {
      if (e.message?.includes('already started')) return
      setError(e.message || 'Could not start microphone.')
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch (_) {}
    setIsListening(false)
  }, [])

  return { isSupported, isListening, error, startListening, stopListening }
}

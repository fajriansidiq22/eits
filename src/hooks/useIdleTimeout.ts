import { useEffect, useRef } from 'react'

export function useIdleTimeout(onIdle: () => void, idleTimeMinutes = 30) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleActivity = () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      timeoutId.current = setTimeout(onIdle, idleTimeMinutes * 60 * 1000)
    }

    // Set initial timeout
    handleActivity()

    // Listeners for activity
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [onIdle, idleTimeMinutes])
}

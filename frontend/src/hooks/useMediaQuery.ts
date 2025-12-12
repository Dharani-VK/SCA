import { useEffect, useState } from 'react'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQueryList = window.matchMedia(query)
    const updateMatch = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches)
    }

    updateMatch(mediaQueryList)
    mediaQueryList.addEventListener('change', updateMatch)

    return () => {
      mediaQueryList.removeEventListener('change', updateMatch)
    }
  }, [query])

  return matches
}

export default useMediaQuery

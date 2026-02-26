import { useEffect, useState } from 'react'

export function useScrollHide() {
  const [isVisible, setIsVisible] = useState(true)
  const [prevScrollPos, setPrevScrollPos] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY

      // Show header if scrolling up or at top
      if (currentScrollPos < prevScrollPos || currentScrollPos < 100) {
        setIsVisible(true)
      } else if (currentScrollPos > prevScrollPos) {
        // Hide header if scrolling down and past 100px
        setIsVisible(false)
      }

      setPrevScrollPos(currentScrollPos)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prevScrollPos])

  return isVisible
}

import { useCallback, useEffect, useState } from 'react'

interface FullscreenDocument extends Document {
  webkitFullscreenEnabled?: boolean
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void
}

export interface FullscreenState {
  isFullscreen: boolean
  toggle(): void
  supported: boolean
}

export function useFullscreen(): FullscreenState {
  const doc = document as FullscreenDocument
  const [isFullscreen, setIsFullscreen] = useState(false)
  const supported = Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [doc])

  const toggle = useCallback(() => {
    const el = doc.fullscreenElement || doc.webkitFullscreenElement
    if (el) {
      const p = doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.()
      void (p as Promise<void> | undefined)?.catch?.(() => {})
    } else {
      const p =
        doc.documentElement.requestFullscreen?.() ??
        (doc.documentElement as FullscreenElement).webkitRequestFullscreen?.()
      void (p as Promise<void> | undefined)?.catch?.(() => {})
    }
  }, [doc])

  return { isFullscreen, toggle, supported }
}

import { useCallback, useEffect, useState } from 'react'
import { isTab, type Tab } from '../app/navigation'

function readTabFromHash(): Tab {
  const segment = window.location.hash.match(/^#\/([^?]+)/)?.[1]
  return segment && isTab(segment) ? segment : 'overview'
}

export function useTabRoute() {
  const [tab, setTab] = useState<Tab>(readTabFromHash)

  useEffect(() => {
    const syncWithHash = () => setTab(readTabFromHash())
    window.addEventListener('hashchange', syncWithHash)
    return () => window.removeEventListener('hashchange', syncWithHash)
  }, [])

  const navigate = useCallback((nextTab: Tab) => {
    window.location.hash = `/${nextTab}`
    setTab(nextTab)
  }, [])

  return { tab, navigate }
}

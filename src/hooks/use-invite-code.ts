import { useEffect, useState } from 'react'

function readInviteCode() {
  return new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('code')
}

export function useInviteCode() {
  const [inviteCode, setInviteCode] = useState(readInviteCode)

  useEffect(() => {
    const syncWithHash = () => setInviteCode(readInviteCode())
    window.addEventListener('hashchange', syncWithHash)
    return () => window.removeEventListener('hashchange', syncWithHash)
  }, [])

  return inviteCode
}

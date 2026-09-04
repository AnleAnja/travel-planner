export function isPlaceholderName(name: string) {
  const trimmed = name.trim()
  return (
    !trimmed ||
    trimmed === 'Dein Name' ||
    trimmed === 'Your name' ||
    trimmed === 'Guest' ||
    (/^\[.*\]$/.test(trimmed) && trimmed.toLowerCase().includes('name'))
  )
}

export function visibleMemberName(name: string) {
  const trimmed = name.trim()
  return isPlaceholderName(trimmed) ? 'Guest' : trimmed
}

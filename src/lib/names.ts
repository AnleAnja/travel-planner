export function isPlaceholderName(name: string) {
  const trimmed = name.trim()
  return (
    !trimmed ||
    trimmed === 'Dein Name' ||
    (/^\[.*\]$/.test(trimmed) && trimmed.toLowerCase().includes('name'))
  )
}

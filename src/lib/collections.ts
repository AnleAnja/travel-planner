export function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item)
    groups[key] = [...(groups[key] ?? []), item]
    return groups
  }, {})
}

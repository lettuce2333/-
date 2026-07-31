export function formatPrice(value: number | string | undefined | null): string {
  const n = Number(value || 0)
  return n.toFixed(2)
}

export function parseImages(images?: string): string[] {
  if (!images) return []
  try {
    const arr = JSON.parse(images)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function fullImage(url?: string): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return `http://localhost:4000${url}`
}

export function parseSpecs(specs?: string): string {
  if (!specs) return ''
  try {
    const obj = JSON.parse(specs)
    return Object.values(obj).join(' / ')
  } catch {
    return specs
  }
}

export function formatTime(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

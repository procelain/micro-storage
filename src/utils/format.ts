// 金额格式化
export function formatMoney(amount: number): string {
  if (amount === 0) return '¥0.00'
  const abs = Math.abs(amount)
  if (abs >= 10000) {
    return (amount < 0 ? '-' : '') + '¥' + (abs / 10000).toFixed(2) + '万'
  }
  return (amount < 0 ? '-' : '') + '¥' + abs.toFixed(2)
}

// 简化金额（不带万）
export function formatMoneySimple(amount: number): string {
  return '¥' + amount.toFixed(2)
}

// 日期格式化
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 日期时间格式化
export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const date = formatDate(d)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${h}:${min}`
}

// 相对时间
export function formatRelativeTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return formatDate(d)
}

// 百分比格式化
export function formatPercent(value: number): string {
  return value.toFixed(1) + '%'
}

// 数量格式化
export function formatQuantity(qty: number, unit: string = ''): string {
  return qty + (unit ? unit : '')
}

// 宴会状态颜色映射
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    '筹备中': '#D97706',
    '进行中': '#2563EB',
    '已完成': '#16A34A',
    '已结算': '#111827'
  }
  return map[status] || '#64748B'
}

// 分类颜色映射
export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    '花艺': '#FF6B9D',
    '灯光': '#FFD93D',
    '布艺': '#6BCB77',
    '餐具': '#4D96FF',
    '道具': '#9B59B6',
    '乳胶': '#EC4899',
    '铝膜': '#2563EB',
    '其他': '#A0A0A0'
  }
  return map[category] || '#94A3B8'
}

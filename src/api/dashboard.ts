import { callFunction } from './cloud'

export interface DashboardOverview {
  totalPurchase: number
  totalRevenue: number
  totalLossCost: number
  netProfit: number
  lowStockCount: number
  slowCount: number
}

export interface StockTrendItem {
  date: string
  totalStock: number
}

export interface AlertItem {
  _id: string
  name: string
  stock: number
  minStock?: number
  lastUsedDate?: string | null
}

export interface AlertSummary {
  lowStockCount: number
  slowCount: number
  lowStockItems: AlertItem[]
  slowItems: AlertItem[]
}

// 看板总览
export function getDashboardOverview() {
  return callFunction<DashboardOverview>('dashboardService', 'overview')
}

// 库存趋势
export function getStockTrend(days: number = 30) {
  return callFunction<StockTrendItem[]>('dashboardService', 'stockTrend', { days })
}

// 高损耗物资TOP
export function getTopLossMaterials(limit: number = 10) {
  return callFunction<Array<{
    materialId: string
    materialName: string
    totalCost: number
    totalDamaged: number
  }>>('dashboardService', 'topLossMaterials', { limit })
}

// 预警摘要
export function getAlertSummary() {
  return callFunction<AlertSummary>('dashboardService', 'alerts')
}

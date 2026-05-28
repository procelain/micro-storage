import { callFunction } from './cloud'

export interface FinanceOverview {
  totalPurchase: number
  totalRevenue: number
  totalLossCost: number
  netProfit: number
  profitRate: number
}

export interface BanquetProfit {
  _id: string
  clientName: string
  eventDate: string
  venue: string
  actualRevenue: number
  totalCost: number
  profit: number
  profitRate: number
  status: string
}

export interface MonthlyReport {
  year: number
  month: number
  purchaseCount: number
  totalPurchase: number
  banquetCount: number
  totalRevenue: number
  totalCost: number
  netProfit: number
}

export interface ProfitTrendItem {
  month: string
  revenue: number
  cost: number
  profit: number
}

// 财务总览
export function getFinanceOverview(params: { startDate?: string; endDate?: string } = {}) {
  return callFunction<FinanceOverview>('financeService', 'overview', params)
}

// 按宴会查看利润
export function getBanquetProfit(params: { page?: number; pageSize?: number; status?: string } = {}) {
  return callFunction<{ list: BanquetProfit[]; total: number }>('financeService', 'banquetProfit', params)
}

// 月度报表
export function getMonthlyReport(params: { year?: number; month?: number } = {}) {
  return callFunction<MonthlyReport>('financeService', 'monthlyReport', params)
}

// 利润趋势
export function getProfitTrend(months: number = 6) {
  return callFunction<ProfitTrendItem[]>('financeService', 'profitTrend', { months })
}

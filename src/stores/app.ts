import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDashboardOverview, getStockTrend, getTopLossMaterials, getAlertSummary } from '@/api/dashboard'
import type { DashboardOverview, StockTrendItem, AlertSummary } from '@/api/dashboard'

export const useAppStore = defineStore('app', () => {
  // 看板数据
  const dashboardOverview = ref<DashboardOverview | null>(null)
  const stockTrend = ref<StockTrendItem[]>([])
  const topLossMaterials = ref<Array<{ materialId: string; materialName: string; totalCost: number; totalDamaged: number }>>([])
  const alertSummary = ref<AlertSummary | null>(null)
  const loading = ref(false)

  // 加载看板数据
  async function fetchDashboard() {
    loading.value = true
    try {
      const [overview, trend, topLoss, alerts] = await Promise.all([
        getDashboardOverview(),
        getStockTrend(30),
        getTopLossMaterials(10),
        getAlertSummary()
      ])
      dashboardOverview.value = overview
      stockTrend.value = trend
      topLossMaterials.value = topLoss
      alertSummary.value = alerts
    } finally {
      loading.value = false
    }
  }

  // 仅刷新看板概览
  async function refreshOverview() {
    dashboardOverview.value = await getDashboardOverview()
  }

  // 仅刷新预警
  async function refreshAlerts() {
    alertSummary.value = await getAlertSummary()
  }

  return {
    dashboardOverview, stockTrend, topLossMaterials, alertSummary, loading,
    fetchDashboard, refreshOverview, refreshAlerts
  }
})

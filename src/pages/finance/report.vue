<template>
  <view class="report-page">
    <scroll-view scroll-y class="scroll-content">
      <!-- 利润趋势图 -->
      <view class="chart-section">
        <view class="section-header">
          <text class="section-title">利润趋势</text>
          <text class="section-subtitle">近6个月</text>
        </view>
        <view class="chart-container">
          <canvas canvas-id="profitChart" id="profitChart"
            class="chart-canvas"
            :style="{ width: '100%', height: '200px' }"
          ></canvas>
          <view v-if="trendData.length === 0" class="chart-empty">
            <text class="empty-text">暂无数据</text>
          </view>
        </view>
      </view>

      <!-- 月度数据汇总 -->
      <view class="summary-section">
        <view class="section-header">
          <text class="section-title">月度汇总</text>
        </view>
        <view class="summary-grid">
          <view class="summary-card">
            <text class="summary-label">总进货额</text>
            <text class="summary-value">{{ formatMoney(monthlyReport.totalPurchase) }}</text>
          </view>
          <view class="summary-card">
            <text class="summary-label">总收入</text>
            <text class="summary-value positive">{{ formatMoney(monthlyReport.totalRevenue) }}</text>
          </view>
          <view class="summary-card">
            <text class="summary-label">总成本</text>
            <text class="summary-value negative">{{ formatMoney(monthlyReport.totalCost) }}</text>
          </view>
          <view class="summary-card">
            <text class="summary-label">净利润</text>
            <text class="summary-value" :class="monthlyReport.netProfit >= 0 ? 'positive' : 'negative'">
              {{ formatMoney(monthlyReport.netProfit) }}
            </text>
          </view>
        </view>
      </view>

      <!-- 按宴会明细 -->
      <view class="detail-section">
        <view class="section-header">
          <text class="section-title">宴会明细</text>
        </view>
        <view v-for="item in profitList" :key="item._id" class="detail-item">
          <view class="detail-left">
            <text class="detail-name">{{ item.clientName }}</text>
            <text class="detail-date">{{ formatDate(item.eventDate) }}</text>
          </view>
          <view class="detail-right">
            <text class="detail-revenue">收入 {{ formatMoney(item.actualRevenue) }}</text>
            <text class="detail-cost">成本 {{ formatMoney(item.totalCost) }}</text>
            <text class="detail-profit" :style="{ color: item.profit >= 0 ? '#2ECC71' : '#E74C3C' }">
              利润 {{ item.profit >= 0 ? '+' : '' }}{{ formatMoney(item.profit) }}
            </text>
          </view>
        </view>
        <view v-if="profitList.length === 0" class="detail-empty">
          <text class="empty-hint">暂无数据</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { getProfitTrend, getMonthlyReport, getBanquetProfit } from '@/api/finance'
import { formatMoney, formatDate } from '@/utils/format'
import type { ProfitTrendItem, MonthlyReport, BanquetProfit } from '@/api/finance'

const trendData = ref<ProfitTrendItem[]>([])
const monthlyReport = ref<MonthlyReport>({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  purchaseCount: 0,
  totalPurchase: 0,
  banquetCount: 0,
  totalRevenue: 0,
  totalCost: 0,
  netProfit: 0
})
const profitList = ref<BanquetProfit[]>([])

onMounted(async () => {
  try {
    const [trend, report, profits] = await Promise.all([
      getProfitTrend(6),
      getMonthlyReport(),
      getBanquetProfit({ pageSize: 50 })
    ])

    trendData.value = trend
    monthlyReport.value = report
    profitList.value = profits.list

    await nextTick()
    drawProfitChart()
  } catch (e) {
    console.error('加载报表数据失败', e)
  }
})

function drawProfitChart() {
  if (trendData.value.length === 0) return

  const ctx = uni.createCanvasContext('profitChart')
  const query = uni.createSelectorQuery()
  query.select('#profitChart').boundingClientRect((rect: any) => {
    if (!rect) return
    const w = rect.width
    const h = rect.height
    const padding = { top: 20, right: 16, bottom: 30, left: 50 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    ctx.setFillStyle('transparent')
    ctx.fillRect(0, 0, w, h)

    const data = trendData.value
    const allValues = data.flatMap(d => [d.revenue, d.cost, d.profit])
    const maxVal = Math.max(...allValues.map(Math.abs), 1)

    // 零线位置
    const zeroY = padding.top + chartH / 2

    // 网格线
    ctx.setStrokeStyle('rgba(201, 169, 110, 0.1)')
    ctx.setLineWidth(0.5)
    ctx.beginPath()
    ctx.moveTo(padding.left, zeroY)
    ctx.lineTo(w - padding.right, zeroY)
    ctx.stroke()

    // 绘制收入折线
    ctx.beginPath()
    ctx.setStrokeStyle('#2ECC71')
    ctx.setLineWidth(2)
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i
      const y = zeroY - (d.revenue / maxVal) * (chartH / 2)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 绘制成本折线
    ctx.beginPath()
    ctx.setStrokeStyle('#E74C3C')
    ctx.setLineWidth(2)
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i
      const y = zeroY - (d.cost / maxVal) * (chartH / 2)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 绘制利润折线
    ctx.beginPath()
    ctx.setStrokeStyle('#C9A96E')
    ctx.setLineWidth(2.5)
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i
      const y = zeroY - (d.profit / maxVal) * (chartH / 2)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 利润数据点
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i
      const y = zeroY - (d.profit / maxVal) * (chartH / 2)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.setFillStyle('#C9A96E')
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.setFillStyle('#1A1A2E')
      ctx.fill()
    })

    // X轴月份标签
    ctx.setFontSize(9)
    ctx.setFillStyle('#A0A0A0')
    ctx.setTextAlign('center')
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i
      ctx.fillText(d.month, x, h - padding.bottom + 16)
    })

    ctx.draw()
  }).exec()
}
</script>

<style lang="scss" scoped>
.report-page {
  min-height: 100vh;
  background: $bg-primary;
}

.scroll-content {
  padding: 24rpx;
}

.chart-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.section-subtitle {
  font-size: $font-sm;
  color: $text-tertiary;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 200px;
}

.chart-canvas {
  width: 100%;
  height: 200px;
}

.chart-empty {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  color: $text-disabled;
}

.summary-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.summary-card {
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-md;
}

.summary-label {
  font-size: $font-xs;
  color: $text-tertiary;
  display: block;
  margin-bottom: 8rpx;
}

.summary-value {
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  display: block;
}

.summary-value.positive {
  color: $success;
}

.summary-value.negative {
  color: $danger;
}

.detail-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.03);

  &:last-child {
    border-bottom: none;
  }
}

.detail-left {
  display: flex;
  flex-direction: column;
}

.detail-name {
  font-size: $font-base;
  color: $text-primary;
  font-weight: 500;
}

.detail-date {
  font-size: $font-xs;
  color: $text-disabled;
  margin-top: 4rpx;
}

.detail-right {
  text-align: right;
  display: flex;
  flex-direction: column;
}

.detail-revenue {
  font-size: $font-sm;
  color: $success;
}

.detail-cost {
  font-size: $font-sm;
  color: $danger;
  margin-top: 4rpx;
}

.detail-profit {
  font-size: $font-base;
  font-weight: 600;
  margin-top: 4rpx;
}

.detail-empty {
  padding: 40rpx 0;
  text-align: center;
}

.empty-hint {
  color: $text-disabled;
  font-size: $font-sm;
}
</style>

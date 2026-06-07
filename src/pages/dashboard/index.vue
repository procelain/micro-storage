<template>
  <view class="dashboard-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="greeting">
          <text class="greeting-text">{{ greetingText }}</text>
          <text class="greeting-date">{{ todayText }}</text>
        </view>
        <view class="nav-actions">
          <view class="alert-badge" @tap="goToAlerts">
            <text class="badge-icon">🔔</text>
            <view v-if="alertCount > 0" class="badge-dot">
              <text class="badge-num">{{ alertCount }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ paddingTop: (statusBarHeight + 60) + 'px' }">
      <view class="stat-cards">
        <view class="stat-card neutral-card">
          <text class="stat-label">低库存提醒</text>
          <text class="stat-value">{{ overview.lowStockCount }}</text>
          <text class="stat-desc">需要尽快补货的气球</text>
        </view>
        <view class="stat-card neutral-card">
          <text class="stat-label">滞销提醒</text>
          <text class="stat-value">{{ overview.slowCount }}</text>
          <text class="stat-desc">近期使用偏少的气球</text>
        </view>
        <view class="stat-card neutral-card">
          <text class="stat-label">本月补货</text>
          <text class="stat-value">{{ formatMoney(overview.totalPurchase) }}</text>
          <text class="stat-desc">按补货记录统计</text>
        </view>
      </view>

      <view class="alert-section" v-if="alertCount > 0">
        <view class="alert-card low-stock" @tap="goToAlertList('lowStock')">
          <view class="alert-icon-wrap">
            <text class="alert-icon">⚠️</text>
          </view>
          <view class="alert-info">
            <text class="alert-title">低库存预警</text>
            <text class="alert-desc">{{ overview.lowStockCount }} 项气球需要补货</text>
          </view>
          <text class="alert-arrow">›</text>
        </view>
        <view class="alert-card slow-card" @tap="goToAlertList('slow')">
          <view class="alert-icon-wrap">
            <text class="alert-icon">📦</text>
          </view>
          <view class="alert-info">
            <text class="alert-title">滞销提醒</text>
            <text class="alert-desc">{{ overview.slowCount }} 项气球近期使用较少</text>
          </view>
          <text class="alert-arrow">›</text>
        </view>
      </view>

      <view class="chart-section">
        <view class="section-header">
          <text class="section-title">库存变化</text>
          <text class="section-subtitle">近30天</text>
        </view>
        <view class="chart-container">
          <canvas canvas-id="stockTrendChart" id="stockTrendChart"
            class="chart-canvas"
            :style="{ width: '100%', height: '200px' }"
            @touchstart="onChartTouch"
          ></canvas>
          <view v-if="stockTrend.length === 0" class="chart-empty">
            <text class="chart-empty-text">暂无数据</text>
          </view>
        </view>
      </view>

      <view class="chart-section">
        <view class="section-header">
          <text class="section-title">气球使用较多</text>
          <text class="section-subtitle">TOP10</text>
        </view>
        <view class="top-loss-list">
          <view v-for="(item, index) in topLossMaterials" :key="item.materialId" class="loss-item">
            <view class="loss-rank" :class="index < 3 ? 'rank-top' : ''">
              <text class="rank-num">{{ index + 1 }}</text>
            </view>
            <view class="loss-info">
              <text class="loss-name">{{ item.materialName }}</text>
              <view class="loss-bar-wrap">
                <view class="loss-bar" :style="{ width: getLossBarWidth(item.totalCost) + '%' }"></view>
              </view>
            </view>
            <text class="loss-amount">{{ formatMoney(item.totalCost) }}</text>
          </view>
          <view v-if="topLossMaterials.length === 0" class="list-empty">
            <text class="empty-text">暂无使用记录</text>
          </view>
        </view>
      </view>

      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app'
import { formatMoney } from '@/utils/format'

const appStore = useAppStore()

// 状态栏高度
const statusBarHeight = ref(0)
// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync()
statusBarHeight.value = systemInfo.statusBarHeight || 0
// #endif

const overview = computed(() => appStore.dashboardOverview || {
  totalPurchase: 0, totalLossCost: 0,
  lowStockCount: 0, slowCount: 0
})
const stockTrend = computed(() => appStore.stockTrend)
const topLossMaterials = computed(() => appStore.topLossMaterials)
const alertCount = computed(() => (overview.value.lowStockCount || 0) + (overview.value.slowCount || 0))

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayText = computed(() => {
  const d = new Date()
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return `${months[d.getMonth()]} ${d.getDate()}日`
})

function goToAlertList(type: 'lowStock' | 'slow') {
  uni.switchTab({ url: '/pages/inventory/index' })
  setTimeout(() => {
    uni.$emit('inventory:filter', { alertType: type })
  }, 300)
}

function goToAlerts() {
  if (overview.value.lowStockCount > 0) {
    goToAlertList('lowStock')
  } else if (overview.value.slowCount > 0) {
    goToAlertList('slow')
  }
}

function getLossBarWidth(cost: number): number {
  const maxCost = Math.max(...topLossMaterials.value.map(m => m.totalCost), 1)
  return Math.max(10, (cost / maxCost) * 100)
}

function drawStockTrendChart() {
  if (stockTrend.value.length === 0) return

  const ctx = uni.createCanvasContext('stockTrendChart')
  const query = uni.createSelectorQuery()
  query.select('#stockTrendChart').boundingClientRect((rect: any) => {
    if (!rect) return
    const w = rect.width
    const h = rect.height
    const padding = { top: 20, right: 16, bottom: 30, left: 50 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    ctx.setFillStyle('transparent')
    ctx.fillRect(0, 0, w, h)

    const data = stockTrend.value
    const values = data.map(d => d.totalStock)
    const maxVal = Math.max(...values, 1)
    const minVal = Math.min(...values, 0)
    const range = maxVal - minVal || 1

    ctx.setStrokeStyle('rgba(148, 163, 184, 0.2)')
    ctx.setLineWidth(0.5)
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()
      const val = maxVal - (range / 4) * i
      ctx.setFontSize(10)
      ctx.setFillStyle('#64748B')
      ctx.setTextAlign('right')
      ctx.fillText(Math.round(val).toString(), padding.left - 8, y + 4)
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom)
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.18)')
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)')

    ctx.beginPath()
    ctx.moveTo(padding.left, h - padding.bottom)
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i
      const y = padding.top + chartH - ((d.totalStock - minVal) / range) * chartH
      if (i === 0) ctx.lineTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(padding.left + chartW, h - padding.bottom)
    ctx.closePath()
    ctx.setFillStyle(gradient)
    ctx.fill()

    ctx.beginPath()
    ctx.setStrokeStyle('#2563EB')
    ctx.setLineWidth(2)
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i
      const y = padding.top + chartH - ((d.totalStock - minVal) / range) * chartH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    data.forEach((d, i) => {
      if (i % 5 !== 0 && i !== data.length - 1) return
      const x = padding.left + (chartW / (data.length - 1)) * i
      const y = padding.top + chartH - ((d.totalStock - minVal) / range) * chartH
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.setFillStyle('#2563EB')
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.setFillStyle('#FFFFFF')
      ctx.fill()
    })

    ctx.setFontSize(9)
    ctx.setFillStyle('#64748B')
    ctx.setTextAlign('center')
    const labelInterval = Math.max(1, Math.floor(data.length / 5))
    data.forEach((d, i) => {
      if (i % labelInterval !== 0 && i !== data.length - 1) return
      const x = padding.left + (chartW / (data.length - 1)) * i
      const label = d.date.slice(5) // MM-DD
      ctx.fillText(label, x, h - padding.bottom + 16)
    })

    ctx.draw()
  }).exec()
}

function onChartTouch(_e: any) {
}

onMounted(async () => {
  try {
    await appStore.fetchDashboard()
    await nextTick()
    drawStockTrendChart()
  } catch (e) {
    console.error('加载看板数据失败', e)
  }
})

onShow(async () => {
  try {
    await appStore.refreshOverview()
  } catch (e) {
    console.error('刷新看板数据失败', e)
  }
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100vh;
  background: $bg-primary;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(248, 250, 252, 0.96);
  border-bottom: 1rpx solid #E2E8F0;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 32rpx;
}

.greeting-text {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  display: block;
}

.greeting-date {
  font-size: 24rpx;
  color: $text-tertiary;
  margin-top: 4rpx;
  display: block;
}

.alert-badge {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.badge-icon {
  font-size: 44rpx;
}

.badge-dot {
  position: absolute;
  top: 8rpx;
  right: 4rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  background: $danger;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.badge-num {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
}

.scroll-content {
  min-height: 100vh;
}

.stat-cards {
  display: flex;
  padding: 16rpx 24rpx;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx 20rpx;
  position: relative;
  overflow: hidden;
  box-shadow: $shadow-card;
}

.stat-label {
  font-size: $font-sm;
  color: $text-tertiary;
  display: block;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: $font-xl;
  font-weight: 700;
  color: $text-primary;
  display: block;
  letter-spacing: -0.5px;
}

.stat-desc {
  display: block;
  margin-top: 12rpx;
  font-size: $font-xs;
  color: $text-tertiary;
}

.alert-section {
  padding: 8rpx 24rpx 16rpx;
  display: flex;
  gap: 16rpx;
}

.alert-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: $radius-lg;
  gap: 12rpx;
  box-shadow: $shadow-card;
}

.low-stock {
  background: $danger-light;
  border: 1rpx solid rgba(231, 76, 60, 0.3);
}

.slow-card {
  background: $warning-light;
  border: 1rpx solid rgba(243, 156, 18, 0.3);
}

.alert-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-icon {
  font-size: 32rpx;
}

.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 500;
  display: block;
}

.alert-desc {
  font-size: $font-xs;
  color: $text-tertiary;
  display: block;
  margin-top: 4rpx;
}

.alert-arrow {
  font-size: 36rpx;
  color: $text-tertiary;
  flex-shrink: 0;
}

.chart-section {
  margin: 16rpx 24rpx;
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  box-shadow: $shadow-card;
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

.chart-empty-text {
  color: $text-disabled;
  font-size: $font-base;
}

.top-loss-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.loss-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.loss-rank {
  width: 44rpx;
  height: 44rpx;
  border-radius: $radius-sm;
  background: $bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-top {
  background: rgba(37, 99, 235, 0.12);
}

.rank-num {
  font-size: $font-sm;
  color: $text-tertiary;
  font-weight: 600;
}

.rank-top .rank-num {
  color: $info;
}

.loss-info {
  flex: 1;
  min-width: 0;
}

.loss-name {
  font-size: $font-base;
  color: $text-primary;
  display: block;
  margin-bottom: 6rpx;
}

.loss-bar-wrap {
  height: 6rpx;
  background: $bg-tertiary;
  border-radius: 3rpx;
  overflow: hidden;
}

.loss-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563EB 0%, #60A5FA 100%);
  border-radius: 3rpx;
  transition: width 0.3s ease;
}

.loss-amount {
  font-size: $font-sm;
  color: $text-secondary;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 100rpx;
  text-align: right;
}

.list-empty {
  padding: 40rpx 0;
  text-align: center;
}

.empty-text {
  color: $text-disabled;
  font-size: $font-base;
}

.safe-bottom {
  height: 120rpx;
}
</style>

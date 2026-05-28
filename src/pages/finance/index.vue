<template>
  <view class="finance-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="nav-title">财务中心</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ paddingTop: (statusBarHeight + 56) + 'px' }">
      <!-- 利润总览 -->
      <view class="profit-hero">
        <text class="profit-label">本月净利润</text>
        <text class="profit-value" :class="overview.netProfit >= 0 ? 'positive' : 'negative'">
          {{ formatMoney(overview.netProfit) }}
        </text>
        <view class="profit-rate" v-if="overview.totalRevenue > 0">
          <text class="rate-text">利润率 {{ formatPercent(overview.profitRate) }}</text>
        </view>
      </view>

      <!-- 收支对比 -->
      <view class="comparison-card">
        <view class="compare-item">
          <view class="compare-bar-wrap">
            <view class="compare-bar revenue-bar" :style="{ width: revenueBarWidth + '%' }"></view>
          </view>
          <view class="compare-info">
            <text class="compare-label">收入</text>
            <text class="compare-value revenue-value">{{ formatMoney(overview.totalRevenue) }}</text>
          </view>
        </view>
        <view class="compare-item">
          <view class="compare-bar-wrap">
            <view class="compare-bar cost-bar" :style="{ width: costBarWidth + '%' }"></view>
          </view>
          <view class="compare-info">
            <text class="compare-label">成本</text>
            <text class="compare-value cost-value">{{ formatMoney(overview.totalPurchase + overview.totalLossCost) }}</text>
          </view>
        </view>
      </view>

      <!-- 时间维度切换 -->
      <view class="time-tabs">
        <view
          v-for="tab in timeTabs"
          :key="tab.value"
          class="time-tab"
          :class="{ active: currentPeriod === tab.value }"
          @tap="switchPeriod(tab.value)"
        >
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="quick-actions">
        <view class="quick-card" @tap="goToReport">
          <view class="quick-icon-wrap">
            <text class="quick-icon">📊</text>
          </view>
          <text class="quick-label">利润报表</text>
        </view>
        <view class="quick-card" @tap="goToSupplier">
          <view class="quick-icon-wrap">
            <text class="quick-icon">🏢</text>
          </view>
          <text class="quick-label">供应商</text>
        </view>
      </view>

      <!-- 宴会利润排行 -->
      <view class="rank-section">
        <view class="section-header">
          <text class="section-title">宴会利润排行</text>
          <text class="section-more" @tap="goToReport">查看全部 ›</text>
        </view>
        <view v-for="(item, index) in profitList" :key="item._id" class="rank-item">
          <view class="rank-left">
            <view class="rank-num" :class="{ 'top-rank': index < 3 }">
              <text class="rank-num-text">{{ index + 1 }}</text>
            </view>
            <view class="rank-info">
              <text class="rank-name">{{ item.clientName }}</text>
              <text class="rank-date">{{ formatDate(item.eventDate) }}</text>
            </view>
          </view>
          <text class="rank-profit" :style="{ color: item.profit >= 0 ? '#2ECC71' : '#E74C3C' }">
            {{ item.profit >= 0 ? '+' : '' }}{{ formatMoney(item.profit) }}
          </text>
        </view>
        <view v-if="profitList.length === 0" class="rank-empty">
          <text class="empty-hint">暂无数据</text>
        </view>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFinanceOverview, getBanquetProfit } from '@/api/finance'
import { formatMoney, formatPercent, formatDate } from '@/utils/format'
import type { FinanceOverview, BanquetProfit } from '@/api/finance'

const statusBarHeight = ref(0)
// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync()
statusBarHeight.value = systemInfo.statusBarHeight || 0
// #endif

const currentPeriod = ref('month')
const overview = ref<FinanceOverview>({
  totalPurchase: 0, totalRevenue: 0, totalLossCost: 0,
  netProfit: 0, profitRate: 0
})
const profitList = ref<BanquetProfit[]>([])

const timeTabs = [
  { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' },
  { label: '全年', value: 'year' }
]

const revenueBarWidth = computed(() => {
  const max = Math.max(overview.value.totalRevenue, overview.value.totalPurchase + overview.value.totalLossCost, 1)
  return (overview.value.totalRevenue / max) * 100
})

const costBarWidth = computed(() => {
  const max = Math.max(overview.value.totalRevenue, overview.value.totalPurchase + overview.value.totalLossCost, 1)
  return ((overview.value.totalPurchase + overview.value.totalLossCost) / max) * 100
})

function switchPeriod(period: string) {
  currentPeriod.value = period
  loadData()
}

async function loadData() {
  try {
    const now = new Date()
    let startDate: string

    if (currentPeriod.value === 'month') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    } else if (currentPeriod.value === 'quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 + 1
      startDate = `${now.getFullYear()}-${String(quarterStartMonth).padStart(2, '0')}-01`
    } else {
      startDate = `${now.getFullYear()}-01-01`
    }

    const [overviewData, profitData] = await Promise.all([
      getFinanceOverview({ startDate }),
      getBanquetProfit({ pageSize: 10 })
    ])

    overview.value = overviewData
    profitList.value = profitData.list
  } catch (e) {
    console.error('加载财务数据失败', e)
  }
}

function goToReport() {
  uni.navigateTo({ url: '/pages/finance/report' })
}

function goToSupplier() {
  uni.navigateTo({ url: '/pages/supplier/index' })
}

onMounted(() => {
  loadData()
})

onShow(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.finance-page {
  min-height: 100vh;
  background: $bg-primary;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 32rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
}

.scroll-content {
  padding: 0 24rpx;
}

// 利润英雄区
.profit-hero {
  text-align: center;
  padding: 40rpx 24rpx 24rpx;
}

.profit-label {
  font-size: $font-sm;
  color: $text-tertiary;
  display: block;
  margin-bottom: 12rpx;
}

.profit-value {
  font-size: 80rpx;
  font-weight: 800;
  letter-spacing: -2px;
  display: block;

  &.positive {
    color: $success;
  }
  &.negative {
    color: $danger;
  }
}

.profit-rate {
  margin-top: 12rpx;
}

.rate-text {
  font-size: $font-sm;
  color: $primary;
  padding: 4rpx 16rpx;
  background: rgba(201, 169, 110, 0.1);
  border-radius: $radius-round;
}

// 收支对比
.comparison-card {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.compare-item {
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.compare-bar-wrap {
  height: 8rpx;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4rpx;
  margin-bottom: 12rpx;
  overflow: hidden;
}

.compare-bar {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.6s ease;
}

.revenue-bar {
  background: linear-gradient(90deg, #2ECC71, #27AE60);
}

.cost-bar {
  background: linear-gradient(90deg, #E74C3C, #C0392B);
}

.compare-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-label {
  font-size: $font-sm;
  color: $text-tertiary;
}

.compare-value {
  font-size: $font-md;
  font-weight: 600;
}

.revenue-value {
  color: $success;
}

.cost-value {
  color: $danger;
}

// 时间标签
.time-tabs {
  display: flex;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.time-tab {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
}

.time-tab.active {
  background: rgba(201, 169, 110, 0.12);
  border-color: rgba(201, 169, 110, 0.3);
}

.tab-text {
  font-size: $font-sm;
  color: $text-tertiary;
}

.time-tab.active .tab-text {
  color: $primary;
  font-weight: 500;
}

// 快捷入口
.quick-actions {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.quick-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;

  &:active {
    opacity: 0.8;
  }
}

.quick-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: $radius-md;
  background: rgba(201, 169, 110, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-icon {
  font-size: 36rpx;
}

.quick-label {
  font-size: $font-sm;
  color: $text-tertiary;
}

// 利润排行
.rank-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.section-more {
  font-size: $font-sm;
  color: $primary;
}

.rank-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.03);

  &:last-child {
    border-bottom: none;
  }
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.rank-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-num.top-rank {
  background: rgba(201, 169, 110, 0.15);
}

.rank-num-text {
  font-size: $font-sm;
  color: $text-tertiary;
  font-weight: 600;
}

.top-rank .rank-num-text {
  color: $primary;
}

.rank-info {
  display: flex;
  flex-direction: column;
}

.rank-name {
  font-size: $font-base;
  color: $text-primary;
  font-weight: 500;
}

.rank-date {
  font-size: $font-xs;
  color: $text-disabled;
  margin-top: 4rpx;
}

.rank-profit {
  font-size: $font-md;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-empty {
  padding: 40rpx 0;
  text-align: center;
}

.empty-hint {
  color: $text-disabled;
  font-size: $font-sm;
}

.safe-bottom {
  height: 120rpx;
}
</style>

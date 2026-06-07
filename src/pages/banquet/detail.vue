<template>
  <view class="detail-page">
    <scroll-view scroll-y class="scroll-content">
      <view class="detail-header">
        <view class="header-top">
          <view class="status-badge" :style="{ background: statusBg }">
            <text class="status-text" :style="{ color: statusColor }">{{ banquet?.status }}</text>
          </view>
          <text class="event-date">{{ formatDate(banquet?.eventDate) }}</text>
        </view>
        <text v-if="banquet?.venue" class="venue-text">📍 {{ banquet?.venue }}</text>
        <text v-if="banquet?.remark" class="remark-text">{{ banquet?.remark }}</text>
      </view>

      <view class="overview-panel">
        <view class="overview-card">
          <text class="overview-label">使用记录</text>
          <text class="overview-value">{{ banquet?.lossRecords?.length || 0 }} 条</text>
        </view>
        <view class="overview-card">
          <text class="overview-label">使用数量</text>
          <text class="overview-value">{{ totalUsageQty }}</text>
        </view>
      </view>

      <view class="action-row">
        <view class="action-btn primary-btn" @tap="goToLossRecord">
          <text class="btn-icon">📝</text>
          <text class="btn-label">使用记录</text>
        </view>
        <view class="action-btn" @tap="changeStatus">
          <text class="btn-icon">🔄</text>
          <text class="btn-label">状态</text>
        </view>
      </view>

      <view class="more-entry">
        <text class="more-text" @tap="showMoreHint" @longpress="showDetailPanel = true">更多</text>
      </view>

      <view class="loss-section">
        <view class="section-header">
          <text class="section-title">使用记录</text>
          <text class="section-count">{{ banquet?.lossRecords?.length || 0 }} 项</text>
        </view>
        <view v-for="loss in banquet?.lossRecords" :key="loss._id" class="loss-item">
          <view class="loss-main">
            <text class="loss-material">{{ loss.materialName }}</text>
            <view class="loss-quantities">
              <text v-if="loss.consumedQty > 0" class="consumed-tag">使用 ×{{ loss.consumedQty }}</text>
              <text v-if="loss.damagedQty > 0" class="damaged-tag">损坏 ×{{ loss.damagedQty }}</text>
            </view>
          </view>
          <view class="loss-footer">
            <text class="loss-summary">共 {{ loss.consumedQty + loss.damagedQty }} 个</text>
            <text class="loss-date">{{ formatDate(loss.recordDate) }}</text>
          </view>
          <view v-if="loss.damagedImages && loss.damagedImages.length > 0" class="loss-images">
            <image
              v-for="(img, idx) in loss.damagedImages"
              :key="idx"
              :src="img"
              class="loss-img"
              mode="aspectFill"
              @tap="previewImage(img, loss.damagedImages)"
            />
          </view>
          <view v-if="loss.remark" class="loss-remark">
            <text class="remark-text">{{ loss.remark }}</text>
          </view>
        </view>
        <view v-if="!banquet?.lossRecords?.length" class="no-loss">
          <text class="no-loss-text">还没有使用记录</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="showDetailPanel" class="modal-mask" @tap="showDetailPanel = false">
      <view class="modal-panel detail-panel" @tap.stop>
        <view class="detail-header-row">
          <text class="modal-title">项目明细</text>
          <text class="picker-close" @tap="showDetailPanel = false">✕</text>
        </view>
        <view class="summary-section">
          <text class="summary-title">气球使用汇总</text>
          <view v-for="item in usageSummary" :key="item.materialName" class="summary-item">
            <text class="summary-name">{{ item.materialName }}</text>
            <text class="summary-qty">
              使用 {{ item.consumedQty }} / 损坏 {{ item.damagedQty }}
            </text>
          </view>
          <text v-if="usageSummary.length === 0" class="summary-empty">暂无可展示的使用记录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBanquetStore } from '@/stores/banquet'
import { formatMoney, formatDate } from '@/utils/format'
import { getStatusColor } from '@/utils/format'
import type { Banquet } from '@/api/banquet'

const banquetStore = useBanquetStore()
const banquet = ref<Banquet | null>(null)
const banquetId = ref('')
const showDetailPanel = ref(false)

const statusColor = computed(() => getStatusColor(banquet.value?.status || ''))
const statusBg = computed(() => {
  const c = statusColor.value
  return c + '22'
})
const totalUsageQty = computed(() => (banquet.value?.lossRecords || []).reduce((sum, item) => {
  return sum + (item.consumedQty || 0) + (item.damagedQty || 0)
}, 0))
const usageSummary = computed(() => {
  const grouped = new Map<string, { materialName: string; consumedQty: number; damagedQty: number }>()

  for (const record of banquet.value?.lossRecords || []) {
    const current = grouped.get(record.materialName) || {
      materialName: record.materialName,
      consumedQty: 0,
      damagedQty: 0
    }

    current.consumedQty += record.consumedQty || 0
    current.damagedQty += record.damagedQty || 0
    grouped.set(record.materialName, current)
  }

  return Array.from(grouped.values())
})

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  banquetId.value = page?.options?.id || page?.$page?.options?.id || ''

  if (banquetId.value) {
    try {
      const detail = await banquetStore.fetchDetail(banquetId.value)
      banquet.value = detail
    } catch (e) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  }
})

function goToLossRecord() {
  uni.navigateTo({ url: `/pages/banquet/loss-record?banquetId=${banquetId.value}` })
}

function changeStatus() {
  const statusList = ['筹备中', '进行中', '已完成']
  const currentIndex = statusList.indexOf(banquet.value?.status || '')
  if (currentIndex < statusList.length - 1) {
    uni.showActionSheet({
      itemList: statusList.filter((_, i) => i > currentIndex),
      success: async (res) => {
        const newStatus = statusList[currentIndex + res.tapIndex + 1]
        await banquetStore.setStatus(banquetId.value, newStatus)
        banquet.value = await banquetStore.fetchDetail(banquetId.value)
      }
    })
  }
}

function showMoreHint() {
  uni.showToast({ title: '长按可查看项目明细', icon: 'none' })
}

function previewImage(current: string, urls: string[]) {
  uni.previewImage({ current, urls })
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: $bg-primary;
  overflow-x: hidden;
}

.scroll-content {
  padding: 24rpx;
  box-sizing: border-box;
  width: 100%;
}

.detail-header {
  margin-bottom: 24rpx;
  padding: 24rpx;
  background: $bg-card;
  border: $glass-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  box-sizing: border-box;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.status-badge {
  padding: 6rpx 20rpx;
  border-radius: $radius-round;
}

.status-text {
  font-size: $font-sm;
  font-weight: 600;
}

.event-date {
  font-size: $font-sm;
  color: $primary;
}

.venue-text {
  font-size: $font-base;
  color: $text-tertiary;
  margin-top: 8rpx;
  display: block;
}

.remark-text {
  font-size: $font-sm;
  color: $text-secondary;
  margin-top: 12rpx;
  display: block;
}

.overview-panel {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.overview-card {
  flex: 1;
  min-width: 0;
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 20rpx;
  box-shadow: $shadow-card;
}

.overview-label {
  font-size: $font-xs;
  color: $text-tertiary;
  display: block;
  margin-bottom: 8rpx;
}

.overview-value {
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.action-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 16rpx;
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;

  &:active {
    opacity: 0.8;
  }
}

.primary-btn {
  background: $bg-tertiary;
  border-color: #CBD5E1;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-label {
  font-size: $font-sm;
  color: $text-tertiary;
}

.primary-btn .btn-label {
  color: $primary;
}

.more-entry {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16rpx;
}

.more-text {
  font-size: $font-sm;
  color: $text-tertiary;
  padding: 8rpx 4rpx;
}

.loss-section {
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  box-shadow: $shadow-card;
  box-sizing: border-box;
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

.section-count {
  font-size: $font-sm;
  color: $text-tertiary;
}

.loss-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #E2E8F0;

  &:last-child {
    border-bottom: none;
  }
}

.loss-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.loss-material {
  font-size: $font-base;
  color: $text-primary;
  font-weight: 500;
}

.loss-quantities {
  display: flex;
  gap: 12rpx;
}

.consumed-tag, .damaged-tag {
  padding: 4rpx 12rpx;
  border-radius: $radius-sm;
  font-size: $font-xs;
}

.consumed-tag {
  background: rgba(37, 99, 235, 0.12);
  color: #2563EB;
}

.damaged-tag {
  background: $danger-light;
  color: $danger;
}

.loss-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loss-summary {
  font-size: $font-base;
  color: $text-secondary;
  font-weight: 500;
}

.loss-date {
  font-size: $font-xs;
  color: $text-disabled;
}

.loss-images {
  display: flex;
  gap: 8rpx;
  margin-top: 12rpx;
}

.loss-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: $radius-sm;
}

.loss-remark {
  margin-top: 8rpx;
  padding: 8rpx 12rpx;
  background: $bg-tertiary;
  border-radius: $radius-sm;
}

.no-loss {
  padding: 40rpx 0;
  text-align: center;
}

.no-loss-text {
  color: $text-disabled;
  font-size: $font-sm;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-panel {
  width: 600rpx;
  max-width: 90vw;
  background: $bg-secondary;
  border-radius: $radius-xl;
  padding: 32rpx;
  border: $glass-border;
  box-shadow: $shadow-float;
  box-sizing: border-box;
}

.modal-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: 600;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.detail-panel {
  width: 640rpx;
  max-width: 92vw;
}

.detail-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-close {
  font-size: 32rpx;
  color: $text-tertiary;
}

.summary-section {
  border-top: 1rpx solid #E2E8F0;
  padding-top: 24rpx;
}

.summary-title {
  display: block;
  margin-bottom: 16rpx;
  font-size: $font-md;
  color: $text-primary;
  font-weight: 600;
}

.summary-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #E2E8F0;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-name {
  display: block;
  margin-bottom: 6rpx;
  font-size: $font-base;
  color: $text-primary;
}

.summary-qty,
.summary-empty {
  font-size: $font-sm;
  color: $text-tertiary;
  word-break: break-all;
}
</style>
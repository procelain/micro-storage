<template>
  <view class="detail-page">
    <scroll-view scroll-y class="scroll-content">
      <!-- 宴会信息头部 -->
      <view class="detail-header">
        <view class="header-top">
          <view class="status-badge" :style="{ background: statusBg }">
            <text class="status-text" :style="{ color: statusColor }">{{ banquet?.status }}</text>
          </view>
          <text class="event-date">{{ formatDate(banquet?.eventDate) }}</text>
        </view>
        <text class="client-name">{{ banquet?.clientName }}</text>
        <text v-if="banquet?.venue" class="venue-text">📍 {{ banquet?.venue }}</text>
      </view>

      <!-- 财务概览 -->
      <view class="finance-overview">
        <view class="finance-card cost-card">
          <text class="finance-label">总成本</text>
          <text class="finance-value">{{ formatMoney(banquet?.totalCost || 0) }}</text>
        </view>
        <view class="finance-card revenue-card" v-if="banquet?.actualRevenue > 0">
          <text class="finance-label">收入</text>
          <text class="finance-value revenue-value">{{ formatMoney(banquet?.actualRevenue) }}</text>
        </view>
        <view class="finance-card profit-card" v-if="banquet?.actualRevenue > 0">
          <text class="finance-label">利润</text>
          <text class="finance-value" :style="{ color: profitColor }">{{ formatMoney(profit) }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-row">
        <view class="action-btn primary-btn" @tap="goToLossRecord">
          <text class="btn-icon">📝</text>
          <text class="btn-label">录入损耗</text>
        </view>
        <view v-if="banquet?.status !== '已结算'" class="action-btn" @tap="showSettleModal = true">
          <text class="btn-icon">💰</text>
          <text class="btn-label">结算</text>
        </view>
        <view class="action-btn" @tap="changeStatus">
          <text class="btn-icon">🔄</text>
          <text class="btn-label">状态</text>
        </view>
      </view>

      <!-- 损耗记录列表 -->
      <view class="loss-section">
        <view class="section-header">
          <text class="section-title">损耗记录</text>
          <text class="section-count">{{ banquet?.lossRecords?.length || 0 }} 项</text>
        </view>
        <view v-for="loss in banquet?.lossRecords" :key="loss._id" class="loss-item">
          <view class="loss-main">
            <text class="loss-material">{{ loss.materialName }}</text>
            <view class="loss-quantities">
              <text v-if="loss.consumedQty > 0" class="consumed-tag">消耗 ×{{ loss.consumedQty }}</text>
              <text v-if="loss.damagedQty > 0" class="damaged-tag">损坏 ×{{ loss.damagedQty }}</text>
            </view>
          </view>
          <view class="loss-footer">
            <text class="loss-cost">{{ formatMoney(loss.costAmount) }}</text>
            <text class="loss-date">{{ formatDate(loss.recordDate) }}</text>
          </view>
          <!-- 损坏图片 -->
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
          <text class="no-loss-text">暂无损耗记录</text>
        </view>
      </view>
    </scroll-view>

    <!-- 结算弹窗 -->
    <view v-if="showSettleModal" class="modal-mask" @tap="showSettleModal = false">
      <view class="modal-panel" @tap.stop>
        <text class="modal-title">录入收入</text>
        <view class="modal-body">
          <text class="modal-label">实际收入金额</text>
          <input class="modal-input" type="digit" v-model="revenueAmount" placeholder="请输入收入金额" />
        </view>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="showSettleModal = false">
            <text class="modal-btn-text">取消</text>
          </view>
          <view class="modal-btn confirm-btn" @tap="submitSettle">
            <text class="modal-btn-text confirm-text">确认结算</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBanquetStore } from '@/stores/banquet'
import { formatMoney, formatDate, getStatusColor, getProfitColor } from '@/utils/format'
import type { Banquet } from '@/api/banquet'

const banquetStore = useBanquetStore()
const banquet = ref<Banquet | null>(null)
const banquetId = ref('')
const showSettleModal = ref(false)
const revenueAmount = ref('')

const statusColor = computed(() => getStatusColor(banquet.value?.status || ''))
const statusBg = computed(() => {
  const c = statusColor.value
  return c + '22'
})
const profit = computed(() => (banquet.value?.actualRevenue || 0) - (banquet.value?.totalCost || 0))
const profitColor = computed(() => getProfitColor(profit.value))

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

async function submitSettle() {
  const amount = parseFloat(revenueAmount.value)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }

  try {
    await banquetStore.setRevenue(banquetId.value, amount)
    banquet.value = await banquetStore.fetchDetail(banquetId.value)
    showSettleModal.value = false
    uni.showToast({ title: '结算成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '结算失败', icon: 'none' })
  }
}

function previewImage(current: string, urls: string[]) {
  uni.previewImage({ current, urls })
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: $bg-primary;
}

.scroll-content {
  padding: 24rpx;
}

.detail-header {
  margin-bottom: 24rpx;
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

.client-name {
  font-size: $font-2xl;
  font-weight: 700;
  color: $text-primary;
  display: block;
}

.venue-text {
  font-size: $font-base;
  color: $text-tertiary;
  margin-top: 8rpx;
  display: block;
}

.finance-overview {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.finance-card {
  flex: 1;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 20rpx;
}

.finance-label {
  font-size: $font-xs;
  color: $text-tertiary;
  display: block;
  margin-bottom: 8rpx;
}

.finance-value {
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  display: block;
}

.revenue-value {
  color: $success;
}

.action-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 32rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 16rpx;
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;

  &:active {
    opacity: 0.8;
  }
}

.primary-btn {
  background: rgba(201, 169, 110, 0.12);
  border-color: rgba(201, 169, 110, 0.3);
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

.loss-section {
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

.section-count {
  font-size: $font-sm;
  color: $text-tertiary;
}

.loss-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.03);

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
  background: rgba(52, 152, 219, 0.15);
  color: #3498DB;
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

.loss-cost {
  font-size: $font-base;
  color: $primary;
  font-weight: 600;
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
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-sm;
}

.remark-text {
  font-size: $font-xs;
  color: $text-tertiary;
}

.no-loss {
  padding: 40rpx 0;
  text-align: center;
}

.no-loss-text {
  color: $text-disabled;
  font-size: $font-sm;
}

// 结算弹窗
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
  background: $bg-secondary;
  border-radius: $radius-xl;
  padding: 32rpx;
  border: $glass-border;
}

.modal-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: 600;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.modal-body {
  margin-bottom: 32rpx;
}

.modal-label {
  font-size: $font-sm;
  color: $text-tertiary;
  display: block;
  margin-bottom: 12rpx;
}

.modal-input {
  width: 100%;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(201, 169, 110, 0.2);
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-lg;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
}

.modal-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: $radius-lg;
  text-align: center;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.confirm-btn {
  background: $primary-gradient;
}

.modal-btn-text {
  font-size: $font-base;
  color: $text-tertiary;
}

.confirm-text {
  color: $bg-primary;
  font-weight: 600;
}
</style>

<template>
  <view class="detail-page">
    <scroll-view scroll-y class="scroll-content">
      <!-- 物资信息头部 -->
      <view class="detail-header">
        <view class="header-top">
          <view class="category-badge" :style="{ background: categoryColor }">
            <text class="badge-text">{{ material?.category }}</text>
          </view>
          <view v-if="material?.isSlow" class="slow-badge">
            <text class="slow-text">滞销</text>
          </view>
        </view>
        <text class="material-name">{{ material?.name }}</text>
        <text v-if="material?.spec" class="material-spec">{{ material?.spec }}</text>
      </view>

      <!-- 库存信息卡片 -->
      <view class="stock-card">
        <view class="stock-main">
          <text class="stock-label">当前库存</text>
          <view class="stock-value-wrap">
            <text class="stock-value" :class="{ 'low-stock': isLowStock }">{{ material?.stock || 0 }}</text>
            <text class="stock-unit">{{ material?.unit }}</text>
          </view>
          <view v-if="isLowStock" class="stock-warning">
            <text class="warning-text">低于最低库存 {{ material?.minStock }}{{ material?.unit }}</text>
          </view>
        </view>
        <view class="stock-meta">
          <view class="meta-item">
            <text class="meta-label">加权均价</text>
            <text class="meta-value">{{ formatMoney(material?.avgPrice || 0) }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">库存价值</text>
            <text class="meta-value">{{ formatMoney(stockValue) }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-row">
        <view class="action-btn purchase-btn" @tap="goToPurchase">
          <text class="action-icon">📥</text>
          <text class="action-label">进货</text>
        </view>
        <view class="action-btn edit-btn" @tap="editMaterial">
          <text class="action-icon">✏️</text>
          <text class="action-label">编辑</text>
        </view>
        <view class="action-btn delete-btn" @tap="confirmDelete">
          <text class="action-icon">🗑️</text>
          <text class="action-label">删除</text>
        </view>
      </view>

      <!-- 进货历史 -->
      <view class="history-section">
        <view class="section-header">
          <text class="section-title">进货记录</text>
        </view>
        <view v-for="purchase in purchaseList" :key="purchase._id" class="history-item">
          <view class="history-left">
            <text class="history-date">{{ formatDate(purchase.purchaseDate) }}</text>
          </view>
          <view class="history-right">
            <text class="history-qty">+{{ purchase.quantity }}{{ material?.unit }}</text>
            <text class="history-price">{{ formatMoney(purchase.unitPrice) }}/件</text>
          </view>
        </view>
        <view v-if="purchaseList.length === 0" class="history-empty">
          <text class="empty-hint">暂无进货记录</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMaterialStore } from '@/stores/material'
import { getPurchaseList } from '@/api/purchase'
import { formatMoney, formatDate, getCategoryColor } from '@/utils/format'
import type { Material } from '@/api/material'
import type { Purchase } from '@/api/purchase'

const materialStore = useMaterialStore()
const material = ref<Material | null>(null)
const purchaseList = ref<Purchase[]>([])
const materialId = ref('')

const isLowStock = computed(() => {
  if (!material.value) return false
  return material.value.stock <= material.value.minStock && material.value.minStock > 0
})

const categoryColor = computed(() => getCategoryColor(material.value?.category || ''))
const stockValue = computed(() => (material.value?.stock || 0) * (material.value?.avgPrice || 0))

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  materialId.value = page?.options?.id || page?.$page?.options?.id || ''

  if (materialId.value) {
    try {
      const detail = await materialStore.fetchDetail(materialId.value)
      material.value = detail
      // 加载进货历史
      const res = await getPurchaseList({ materialId: materialId.value, pageSize: 20 })
      purchaseList.value = res.list
    } catch (e) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  }
})

function goToPurchase() {
  uni.navigateTo({ url: `/pages/inventory/purchase?materialId=${materialId.value}` })
}

function editMaterial() {
  uni.navigateTo({ url: `/pages/inventory/purchase?mode=edit&id=${materialId.value}` })
}

function confirmDelete() {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除物资"${material.value?.name}"吗？`,
    confirmColor: '#E74C3C',
    success: async (res) => {
      if (res.confirm && materialId.value) {
        await materialStore.remove(materialId.value)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 500)
      }
    }
  })
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
}

.header-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.category-badge {
  padding: 4rpx 16rpx;
  border-radius: $radius-round;
}

.badge-text {
  font-size: $font-xs;
  color: #fff;
  font-weight: 500;
}

.slow-badge {
  padding: 4rpx 12rpx;
  border-radius: $radius-round;
  background: $warning-light;
}

.slow-text {
  font-size: $font-xs;
  color: $warning;
}

.material-name {
  font-size: $font-2xl;
  font-weight: 700;
  color: $text-primary;
  display: block;
  word-break: break-all;
}

.material-spec {
  font-size: $font-base;
  color: $text-tertiary;
  margin-top: 4rpx;
  display: block;
}

.stock-card {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.stock-main {
  margin-bottom: 24rpx;
}

.stock-label {
  font-size: $font-sm;
  color: $text-tertiary;
  display: block;
  margin-bottom: 8rpx;
}

.stock-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  overflow: hidden;
}

.stock-value {
  font-size: 72rpx;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: -2px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-value.low-stock {
  color: $danger;
}

.stock-unit {
  font-size: $font-lg;
  color: $text-tertiary;
}

.stock-warning {
  margin-top: 8rpx;
  padding: 8rpx 16rpx;
  background: $danger-light;
  border-radius: $radius-sm;
  display: inline-flex;
}

.warning-text {
  font-size: $font-xs;
  color: $danger;
}

.stock-meta {
  display: flex;
  gap: 40rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: $font-xs;
  color: $text-tertiary;
  margin-bottom: 4rpx;
}

.meta-value {
  font-size: $font-md;
  color: $primary;
  font-weight: 600;
}

.action-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.action-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx;
  border-radius: $radius-lg;
  background: $glass-bg;
  border: $glass-border;
  transition: transform $transition-fast;

  &:active {
    transform: scale(0.95);
  }
}

.action-icon {
  font-size: 36rpx;
}

.action-label {
  font-size: $font-sm;
  color: $text-tertiary;
}

.delete-btn {
  border-color: rgba(231, 76, 60, 0.2);
}

.history-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  box-sizing: border-box;
}

.section-header {
  margin-bottom: 16rpx;
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.03);
  overflow: hidden;

  &:last-child {
    border-bottom: none;
  }
}

.history-left {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.history-date {
  font-size: $font-sm;
  color: $text-secondary;
}

.history-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.history-qty {
  font-size: $font-base;
  color: $success;
  font-weight: 500;
}

.history-price {
  font-size: $font-xs;
  color: $text-tertiary;
  margin-top: 4rpx;
}

.history-empty {
  padding: 32rpx 0;
  text-align: center;
}

.empty-hint {
  color: $text-disabled;
  font-size: $font-sm;
}
</style>

<template>
  <view class="material-card" :class="{ 'is-low-stock': isLowStock, 'is-slow': material.isSlow }" @tap="$emit('tap')">
    <view class="card-header">
      <view class="category-dot" :style="{ background: categoryColor }"></view>
      <text class="material-name">{{ material.name }}</text>
      <view v-if="material.isSlow" class="tag tag-slow">
        <text class="tag-text">滞销</text>
      </view>
      <view v-if="isLowStock" class="tag tag-low">
        <text class="tag-text">低库存</text>
      </view>
    </view>
    <view class="card-body">
      <view class="info-row">
        <text class="info-label">库存</text>
        <text class="info-value" :class="{ 'low-value': isLowStock }">
          {{ material.stock }}{{ material.unit }}
        </text>
      </view>
      <view class="info-row">
        <text class="info-label">均价</text>
        <text class="info-value">{{ formatMoney(material.avgPrice) }}</text>
      </view>
    </view>
    <view class="card-footer" v-if="material.spec">
      <text class="spec-text">{{ material.spec }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney, getCategoryColor } from '@/utils/format'

const props = defineProps<{
  material: {
    _id: string
    name: string
    category: string
    spec: string
    unit: string
    stock: number
    avgPrice: number
    minStock: number
    isSlow: boolean
  }
}>()

defineEmits(['tap'])

const isLowStock = computed(() => props.material.stock <= props.material.minStock && props.material.minStock > 0)
const categoryColor = computed(() => getCategoryColor(props.material.category))
</script>

<style lang="scss" scoped>
.material-card {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 16rpx;
  transition: transform $transition-fast, border-color $transition-fast;

  &:active {
    transform: scale(0.98);
  }
}

.is-low-stock {
  border-color: rgba(231, 76, 60, 0.4);
}

.is-slow {
  border-color: rgba(243, 156, 18, 0.4);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.category-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 6rpx;
  flex-shrink: 0;
}

.material-name {
  flex: 1;
  font-size: $font-md;
  font-weight: 500;
  color: $text-primary;
}

.tag {
  padding: 2rpx 12rpx;
  border-radius: $radius-round;
  flex-shrink: 0;
}

.tag-slow {
  background: $warning-light;
}

.tag-low {
  background: $danger-light;
}

.tag-text {
  font-size: $font-xs;
  color: $text-secondary;
}

.card-body {
  display: flex;
  gap: 32rpx;
}

.info-row {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: $font-xs;
  color: $text-tertiary;
  margin-bottom: 4rpx;
}

.info-value {
  font-size: $font-base;
  color: $text-secondary;
  font-weight: 500;
}

.low-value {
  color: $danger;
}

.card-footer {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
}

.spec-text {
  font-size: $font-xs;
  color: $text-tertiary;
}
</style>

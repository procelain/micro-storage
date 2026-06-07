<template>
  <view class="material-card" :class="{ 'is-low-stock': isLowStock, 'is-slow': material.isSlow }" @tap="$emit('tap')">
    <view class="card-top">
      <view class="card-main">
        <text class="material-name">{{ material.name }}</text>
        <text class="material-meta">{{ metaText }}</text>
      </view>
      <view class="stock-block">
        <text class="stock-value" :class="{ 'low-value': isLowStock }">{{ material.stock }}</text>
        <text class="stock-unit">{{ material.unit || '个' }}</text>
      </view>
    </view>

    <view class="swatch-row">
      <view
        v-for="(color, index) in swatchColors"
        :key="`${material._id}-${index}`"
        class="swatch-dot"
        :class="{ outlined: color === '#FFFFFF' }"
        :style="{ background: color }"
      ></view>

      <view v-if="material.isSlow" class="tag tag-slow">
        <text class="tag-text">滞销</text>
      </view>
      <view v-if="isLowStock" class="tag tag-low">
        <text class="tag-text">低库存</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

const metaText = computed(() => {
  const pieces = [props.material.spec, props.material.category]
    .filter(Boolean)
    .map(text => String(text).trim())

  if (props.material.minStock > 0) {
    pieces.push(`低于 ${props.material.minStock}${props.material.unit || '个'}提醒`)
  }

  return pieces.join(' · ') || '未填写规格'
})

const swatchColors = computed(() => {
  const source = `${props.material.name} ${props.material.spec} ${props.material.category}`
  const detected = detectNamedColors(source)

  if (detected.length >= 3) {
    return detected.slice(0, 3)
  }

  const fallbacks = createFallbackPalette(source)
  return [...detected, ...fallbacks].slice(0, 3)
})

function detectNamedColors(text: string) {
  const colorMap = [
    { keywords: ['粉', '马卡龙粉', '樱花粉', '玫粉'], color: '#FB7185' },
    { keywords: ['蓝', '雾霾蓝', '天蓝', '湖蓝'], color: '#60A5FA' },
    { keywords: ['白', '奶白'], color: '#FFFFFF' },
    { keywords: ['银'], color: '#E5E7EB' },
    { keywords: ['灰'], color: '#CBD5E1' },
    { keywords: ['金'], color: '#FBBF24' },
    { keywords: ['黄'], color: '#FACC15' },
    { keywords: ['橙'], color: '#FB923C' },
    { keywords: ['红'], color: '#F87171' },
    { keywords: ['紫'], color: '#A78BFA' },
    { keywords: ['绿'], color: '#4ADE80' },
    { keywords: ['黑'], color: '#111827' },
    { keywords: ['透明'], color: '#F8FAFC' }
  ]

  return colorMap
    .filter(item => item.keywords.some(keyword => text.includes(keyword)))
    .map(item => item.color)
}

function createFallbackPalette(text: string) {
  const palette = ['#FB7185', '#60A5FA', '#FBBF24', '#A78BFA', '#4ADE80', '#E5E7EB']
  const seed = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return Array.from({ length: 3 }, (_, index) => palette[(seed + index) % palette.length])
}
</script>

<style lang="scss" scoped>
.material-card {
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  transition: transform $transition-fast, border-color $transition-fast;
  box-shadow: $shadow-card;

  &:active {
    transform: scale(0.98);
  }
}

.is-low-stock {
  border-color: rgba(220, 38, 38, 0.24);
}

.is-slow {
  border-color: rgba(217, 119, 6, 0.24);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24rpx;
}

.card-main {
  flex: 1;
  min-width: 0;
}

.material-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.3;
}

.material-meta {
  display: block;
  margin-top: 10rpx;
  font-size: $font-sm;
  color: #64748B;
  line-height: 1.5;
}

.stock-block {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  flex-shrink: 0;
}

.stock-value {
  font-size: 60rpx;
  line-height: 1;
  font-weight: 800;
  color: #0F172A;
}

.stock-unit {
  font-size: $font-sm;
  color: $text-tertiary;
}

.swatch-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 18rpx;
}

.low-value {
  color: $danger;
}

.swatch-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  border: 1rpx solid transparent;
}

.swatch-dot.outlined {
  border-color: #D1D5DB;
}

.tag {
  padding: 6rpx 14rpx;
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
</style>

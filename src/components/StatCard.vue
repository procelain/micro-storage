<template>
  <view class="stat-card" :style="{ background: bgStyle }">
    <text class="stat-label">{{ label }}</text>
    <text class="stat-value" :style="{ color: valueColor }">{{ displayValue }}</text>
    <text v-if="subtitle" class="stat-subtitle">{{ subtitle }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: number | string
  subtitle?: string
  type?: 'default' | 'primary' | 'success' | 'danger' | 'warning'
  format?: 'money' | 'percent' | 'number'
}>(), {
  type: 'default',
  format: 'number'
})

const valueColor = computed(() => {
  if (props.type === 'success') return '#2ECC71'
  if (props.type === 'danger') return '#E74C3C'
  if (props.type === 'warning') return '#F39C12'
  if (props.type === 'primary') return '#C9A96E'
  return '#FFFFFF'
})

const bgStyle = computed(() => {
  const map: Record<string, string> = {
    'default': 'rgba(22, 33, 62, 0.65)',
    'primary': 'rgba(201, 169, 110, 0.12)',
    'success': 'rgba(46, 204, 113, 0.12)',
    'danger': 'rgba(231, 76, 60, 0.12)',
    'warning': 'rgba(243, 156, 18, 0.12)'
  }
  return map[props.type] || map['default']
})

const displayValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  if (props.format === 'money') {
    if (Math.abs(props.value) >= 10000) {
      return '¥' + (props.value / 10000).toFixed(2) + '万'
    }
    return '¥' + props.value.toFixed(2)
  }
  if (props.format === 'percent') return props.value.toFixed(1) + '%'
  return props.value.toString()
})
</script>

<style lang="scss" scoped>
.stat-card {
  border-radius: $radius-lg;
  padding: 24rpx 20rpx;
  border: 1rpx solid rgba(201, 169, 110, 0.1);
  backdrop-filter: blur(20px);
}

.stat-label {
  font-size: $font-sm;
  color: #A0A0A0;
  display: block;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  display: block;
  letter-spacing: -0.5px;
}

.stat-subtitle {
  font-size: $font-xs;
  color: #A0A0A0;
  display: block;
  margin-top: 8rpx;
}
</style>

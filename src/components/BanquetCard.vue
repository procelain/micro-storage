<template>
  <view class="banquet-card" @tap="$emit('tap')">
    <view class="card-top">
      <view class="client-info">
        <text class="client-name">{{ banquet.clientName }}</text>
        <view class="status-tag" :style="{ background: statusBg }">
          <text class="status-text" :style="{ color: statusColor }">{{ banquet.status }}</text>
        </view>
      </view>
      <text class="event-date">{{ formatDate(banquet.eventDate) }}</text>
    </view>
    <view class="card-mid" v-if="banquet.venue">
      <text class="venue-text">📍 {{ banquet.venue }}</text>
    </view>
    <view class="card-bottom">
      <view class="cost-info">
        <text class="cost-label">成本</text>
        <text class="cost-value">{{ formatMoney(banquet.totalCost) }}</text>
      </view>
      <view class="revenue-info" v-if="banquet.actualRevenue > 0">
        <text class="revenue-label">收入</text>
        <text class="revenue-value">{{ formatMoney(banquet.actualRevenue) }}</text>
      </view>
      <view class="profit-info" v-if="banquet.actualRevenue > 0">
        <text class="profit-label">利润</text>
        <text class="profit-value" :style="{ color: getProfitColor(profit) }">
          {{ getProfitPrefix(profit) }}{{ formatMoney(Math.abs(profit)) }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney, formatDate, getStatusColor, getProfitColor, getProfitPrefix } from '@/utils/format'

const props = defineProps<{
  banquet: {
    _id: string
    clientName: string
    eventDate: string
    venue: string
    totalCost: number
    actualRevenue: number
    status: string
  }
}>()

defineEmits(['tap'])

const statusColor = computed(() => getStatusColor(props.banquet.status))
const statusBg = computed(() => {
  const c = statusColor.value
  return c.replace('#', 'rgba(') ? `${c}22` : 'rgba(160,160,160,0.1)'
})
const profit = computed(() => props.banquet.actualRevenue - props.banquet.totalCost)
</script>

<style lang="scss" scoped>
.banquet-card {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 16rpx;
  transition: transform $transition-fast;

  &:active {
    transform: scale(0.98);
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.client-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.client-name {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  padding: 4rpx 16rpx;
  border-radius: $radius-round;
  flex-shrink: 0;
}

.status-text {
  font-size: $font-xs;
  font-weight: 500;
}

.event-date {
  font-size: $font-sm;
  color: $primary;
  flex-shrink: 0;
}

.card-mid {
  margin-bottom: 12rpx;
}

.venue-text {
  font-size: $font-sm;
  color: $text-tertiary;
}

.card-bottom {
  display: flex;
  gap: 24rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
}

.cost-info, .revenue-info, .profit-info {
  display: flex;
  flex-direction: column;
}

.cost-label, .revenue-label, .profit-label {
  font-size: $font-xs;
  color: $text-tertiary;
  margin-bottom: 4rpx;
}

.cost-value {
  font-size: $font-base;
  color: $text-secondary;
  font-weight: 500;
}

.revenue-value {
  font-size: $font-base;
  color: $success;
  font-weight: 500;
}

.profit-value {
  font-size: $font-base;
  font-weight: 600;
}
</style>

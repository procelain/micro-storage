<template>
  <view class="banquet-card" @tap="$emit('tap')">
    <view class="card-top">
      <view class="client-info">
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
      <view class="summary-info">
        <text class="info-label">记录状态</text>
        <text class="summary-value">{{ banquet.status }}</text>
      </view>
      <view class="summary-info">
        <text class="info-label">场地</text>
        <text class="summary-value ellipsis">{{ banquet.venue || '待补充' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, getStatusColor } from '@/utils/format'

const props = defineProps<{
  banquet: {
    _id: string
    eventDate: string
    venue: string
    status: string
  }
}>()

defineEmits(['tap'])

const statusColor = computed(() => getStatusColor(props.banquet.status))
const statusBg = computed(() => {
  const c = statusColor.value
  return `${c}18`
})
</script>

<style lang="scss" scoped>
.banquet-card {
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 16rpx;
  transition: transform $transition-fast;
  box-shadow: $shadow-card;

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
  border-top: 1rpx solid #E2E8F0;
}

.price-info, .summary-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.info-label {
  font-size: $font-xs;
  color: $text-tertiary;
  margin-bottom: 4rpx;
}

.price-value {
  font-size: $font-base;
  color: $text-primary;
  font-weight: 600;
}

.summary-value {
  font-size: $font-base;
  color: $text-secondary;
  font-weight: 500;
}

.ellipsis {
  max-width: 220rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

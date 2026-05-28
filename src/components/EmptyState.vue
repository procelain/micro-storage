<template>
  <view class="empty-state">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <view v-if="actionText" class="empty-action" @tap="$emit('action')">
      <text class="action-text">{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
  actionText?: string
}>(), {
  icon: '📋'
})

defineEmits(['action'])
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 48rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: $font-lg;
  color: $text-tertiary;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: $font-sm;
  color: $text-disabled;
  text-align: center;
  margin-bottom: 32rpx;
}

.empty-action {
  padding: 16rpx 48rpx;
  background: $primary-gradient;
  border-radius: $radius-round;
}

.action-text {
  font-size: $font-base;
  color: $bg-primary;
  font-weight: 600;
}
</style>

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
  color: $text-tertiary;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 20rpx;
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
  padding: 16rpx 40rpx;
  background: $primary;
  border-radius: $radius-md;
  box-shadow: $shadow-primary;
}

.action-text {
  font-size: $font-base;
  color: #FFFFFF;
  font-weight: 600;
}
</style>

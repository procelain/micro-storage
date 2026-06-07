<template>
  <view class="search-bar">
    <view class="search-input-wrap">
      <text class="search-icon">⌕</text>
      <input
        class="search-input"
        :placeholder="placeholder"
        placeholder-class="search-placeholder"
        :value="modelValue"
        @input="onInput"
        @confirm="onConfirm"
        confirm-type="search"
      />
      <view v-if="modelValue" class="clear-btn" @tap="onClear">
        <text class="clear-icon">✕</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: '搜索...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [value: string]
}>()

function onInput(e: any) {
  const val = e.detail?.value ?? e.target?.value ?? ''
  emit('update:modelValue', val)
}

function onConfirm() {
  emit('search', props.modelValue)
}

function onClear() {
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<style lang="scss" scoped>
.search-bar {
  padding: 16rpx 24rpx 12rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: $bg-card;
  border: $glass-border;
  border-radius: $radius-md;
  padding: 16rpx 20rpx;
  gap: 12rpx;
  box-shadow: $shadow-card;
  transition: border-color $transition-fast;

  &:focus-within {
    border-color: #CBD5E1;
  }
}

.search-icon {
  font-size: 30rpx;
  color: $text-tertiary;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: $font-base;
  color: $text-primary;
  background: transparent;
}

.search-placeholder {
  color: $text-disabled;
}

.clear-btn {
  width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  background: $bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clear-icon {
  font-size: 20rpx;
  color: $text-tertiary;
}
</style>

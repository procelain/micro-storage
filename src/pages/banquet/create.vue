<template>
  <view class="create-page">
    <scroll-view scroll-y class="scroll-content">
      <view class="form-section">
        <text class="section-title">创建宴会项目</text>

        <view class="form-item">
          <text class="form-label">客户名称 <text class="required">*</text></text>
          <input class="form-input" v-model="form.clientName" placeholder="请输入客户名称" />
        </view>

        <view class="form-item">
          <text class="form-label">宴会日期 <text class="required">*</text></text>
          <picker mode="date" :value="form.eventDate" @change="onDateChange">
            <view class="date-picker">
              <text class="date-text" :class="{ placeholder: !form.eventDate }">
                {{ form.eventDate || '请选择日期' }}
              </text>
              <text class="date-arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">场地</text>
          <input class="form-input" v-model="form.venue" placeholder="宴会场地（选填）" />
        </view>

        <view class="form-item">
          <text class="form-label">预算金额</text>
          <input class="form-input" type="digit" v-model="form.budgetAmount" placeholder="预算金额（选填）" />
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea class="form-textarea" v-model="form.remark" placeholder="备注信息（选填）" maxlength="500" />
        </view>
      </view>

      <view class="submit-section">
        <view class="submit-btn" :class="{ disabled: !canSubmit }" @tap="submitCreate">
          <text class="submit-text">创建宴会</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBanquetStore } from '@/stores/banquet'

const banquetStore = useBanquetStore()
const submitting = ref(false)

const form = ref({
  clientName: '',
  eventDate: '',
  venue: '',
  budgetAmount: '',
  remark: ''
})

const canSubmit = computed(() => form.value.clientName && form.value.eventDate)

function onDateChange(e: any) {
  form.value.eventDate = e.detail.value
}

async function submitCreate() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true

  try {
    await banquetStore.add({
      clientName: form.value.clientName,
      eventDate: form.value.eventDate,
      venue: form.value.venue,
      budgetAmount: parseFloat(form.value.budgetAmount) || 0,
      remark: form.value.remark
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    uni.showToast({ title: '创建失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  background: $bg-primary;
}

.scroll-content {
  padding: 24rpx;
}

.form-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 32rpx 24rpx;
}

.section-title {
  font-size: $font-lg;
  font-weight: 700;
  color: $primary;
  display: block;
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: $font-sm;
  color: $text-tertiary;
  display: block;
  margin-bottom: 8rpx;
}

.required {
  color: $danger;
}

.form-input {
  width: 100%;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-base;

  &:focus {
    border-color: rgba(201, 169, 110, 0.4);
  }
}

.form-textarea {
  width: 100%;
  min-height: 140rpx;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-base;
}

.date-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-md;
}

.date-text {
  font-size: $font-base;
  color: $text-secondary;
}

.date-text.placeholder {
  color: $text-disabled;
}

.date-arrow {
  color: $text-tertiary;
  font-size: 36rpx;
}

.submit-section {
  padding: 32rpx 0;
}

.submit-btn {
  width: 100%;
  padding: 28rpx;
  background: $primary-gradient;
  border-radius: $radius-lg;
  text-align: center;

  &.disabled {
    opacity: 0.5;
  }

  &:active:not(.disabled) {
    opacity: 0.9;
  }
}

.submit-text {
  font-size: $font-lg;
  color: $bg-primary;
  font-weight: 700;
}
</style>

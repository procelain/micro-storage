<template>
  <view class="create-page">
    <view class="scroll-content">
      <view class="form-section">
        <text class="section-title">新建宴会记录</text>

        <view class="form-item">
          <text class="form-label"
            >宴会日期 <text class="required">*</text></text
          >
          <picker mode="date" :value="form.eventDate" @change="onDateChange">
            <view class="date-picker">
              <text class="date-text" :class="{ placeholder: !form.eventDate }">
                {{ form.eventDate || "请选择日期" }}
              </text>
              <text class="date-arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">场地</text>
          <view class="form-control">
            <input
              class="form-input"
              v-model="form.venue"
              placeholder="宴会场地（选填）"
            />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea
            class="form-textarea"
            v-model="form.remark"
            placeholder="备注信息（选填）"
            maxlength="500"
          />
        </view>
      </view>

      <view class="submit-section">
        <view
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          @tap="submitCreate"
        >
          <text class="submit-text">保存宴会</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useBanquetStore } from "@/stores/banquet";

const banquetStore = useBanquetStore();
const submitting = ref(false);

const form = ref({
  eventDate: "",
  venue: "",
  remark: "",
});

const canSubmit = computed(() => form.value.eventDate);

function onDateChange(e: any) {
  form.value.eventDate = e.detail.value;
}

async function submitCreate() {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;

  try {
    await banquetStore.add({
      eventDate: form.value.eventDate,
      venue: form.value.venue,
      remark: form.value.remark,
    });
    uni.showToast({ title: "创建成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e) {
    uni.showToast({ title: "创建失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  background: $bg-primary;
  overflow-x: hidden;
}

.scroll-content {
  padding: 24rpx;
  overflow-x: hidden;
  box-sizing: border-box;
}

.form-section {
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 32rpx 24rpx;
  box-shadow: $shadow-card;
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

.form-control {
  min-height: 88rpx;
  padding: 0 20rpx;
  background: $bg-secondary;
  border: 1rpx solid #e2e8f0;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.required {
  color: $danger;
}

.form-input {
  flex: 1;
  width: 100%;
  height: 88rpx;
  min-height: 88rpx;
  background: transparent;
  border: none;
  color: $text-primary;
  font-size: $font-base;
  box-sizing: border-box;

  &:focus {
    border-color: #94a3b8;
  }
}

.form-textarea {
  width: 100%;
  min-height: 140rpx;
  padding: 16rpx 20rpx;
  background: $bg-secondary;
  border: 1rpx solid #e2e8f0;
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-base;
  box-sizing: border-box;
}

.date-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: $bg-secondary;
  border: 1rpx solid #e2e8f0;
  border-radius: $radius-md;
  box-sizing: border-box;
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
  background: $primary;
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

<template>
  <view class="loss-record-page">
    <scroll-view scroll-y class="scroll-content">
      <view class="form-section">
        <text class="section-label">气球信息</text>
        <view v-if="!selectedMaterial" class="select-btn" @tap="openMaterialPicker">
          <text class="select-text">点击选择气球</text>
        </view>
        <view v-else class="selected-material" @tap="openMaterialPicker">
          <text class="selected-name">{{ selectedMaterial.name }}</text>
          <text class="selected-info">
            {{ selectedMaterial.category || '其他' }} · {{ selectedMaterial.spec || '未填写规格' }} · 库存 {{ selectedMaterial.stock }}{{ selectedMaterial.unit }}
          </text>
        </view>
      </view>

      <view class="form-section">
        <text class="section-label">使用记录</text>

        <view class="form-item">
          <text class="form-label">使用数量</text>
          <view class="qty-input">
            <view class="qty-btn" @tap="adjustConsumed(-1)">
              <text>-</text>
            </view>
            <view class="qty-field">
              <input class="qty-value" type="digit" v-model="form.consumedQty" />
            </view>
            <view class="qty-btn" @tap="adjustConsumed(1)">
              <text>+</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">损坏数量</text>
          <view class="qty-input">
            <view class="qty-btn" @tap="adjustDamaged(-1)">
              <text>-</text>
            </view>
            <view class="qty-field">
              <input class="qty-value" type="digit" v-model="form.damagedQty" />
            </view>
            <view class="qty-btn" @tap="adjustDamaged(1)">
              <text>+</text>
            </view>
          </view>
        </view>

        <view class="form-item" v-if="parseInt(form.damagedQty) > 0">
          <text class="form-label">损坏照片</text>
          <ImageUploader v-model="form.damagedImages" :maxCount="9" />
        </view>

        <view class="form-item">
          <text class="form-label">记录说明</text>
          <textarea class="form-textarea" v-model="form.remark" placeholder="补充说明使用场景、损坏原因等" maxlength="500" />
        </view>
      </view>

      <view class="submit-section">
        <view class="submit-btn" :class="{ disabled: !canSubmit }" @tap="submitLoss">
          <text class="submit-text">保存记录</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="showMaterialPicker" class="picker-mask" @tap="showMaterialPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择气球</text>
          <text class="picker-close" @tap="showMaterialPicker = false">✕</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            v-if="materialList.length === 0"
            class="picker-empty"
          >
            <text class="picker-empty-title">暂无可用气球</text>
            <text class="picker-empty-desc">请先在库存中新增并补货，当前有库存的气球才会出现在这里</text>
          </view>
          <view
            v-else
            v-for="item in materialList"
            :key="item._id"
            class="picker-item"
            :class="{ selected: selectedMaterial?._id === item._id }"
            @tap="selectMaterial(item)"
          >
            <view class="picker-item-left">
              <text class="picker-item-name">{{ item.name }}</text>
              <text class="picker-item-cat">{{ item.category }}</text>
            </view>
            <text class="picker-item-stock">{{ item.stock }}{{ item.unit }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBanquetStore } from '@/stores/banquet'
import { getMaterialList } from '@/api/material'
import ImageUploader from '@/components/ImageUploader.vue'
import type { Material } from '@/api/material'

const banquetStore = useBanquetStore()
const banquetId = ref('')
const showMaterialPicker = ref(false)
const materialList = ref<Material[]>([])
const selectedMaterial = ref<Material | null>(null)
const submitting = ref(false)

const form = ref({
  consumedQty: '0',
  damagedQty: '0',
  damagedImages: [] as string[],
  remark: ''
})

const canSubmit = computed(() => {
  return selectedMaterial.value &&
    (parseInt(form.value.consumedQty) > 0 || parseInt(form.value.damagedQty) > 0)
})

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  banquetId.value = page?.options?.banquetId || page?.$page?.options?.banquetId || ''

  try {
    const res = await getMaterialList({ pageSize: 200 })
    materialList.value = res.list.filter(m => m.stock > 0)
  } catch (e) {
    console.error('加载物资列表失败', e)
  }
})

function adjustConsumed(delta: number) {
  const val = Math.max(0, (parseInt(form.value.consumedQty) || 0) + delta)
  form.value.consumedQty = String(val)
}

function adjustDamaged(delta: number) {
  const val = Math.max(0, (parseInt(form.value.damagedQty) || 0) + delta)
  form.value.damagedQty = String(val)
}

function selectMaterial(item: Material) {
  selectedMaterial.value = item
  showMaterialPicker.value = false
}

function openMaterialPicker() {
  if (materialList.value.length === 0) {
    uni.showToast({ title: '暂无可用气球，请先新增并补货', icon: 'none' })
  }
  showMaterialPicker.value = true
}

async function submitLoss() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true

  try {
    await banquetStore.addLossRecord({
      banquetId: banquetId.value,
      materialId: selectedMaterial.value!._id,
      consumedQty: parseInt(form.value.consumedQty) || 0,
      damagedQty: parseInt(form.value.damagedQty) || 0,
      damagedImages: form.value.damagedImages,
      remark: form.value.remark
    })
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.loss-record-page {
  height: 100vh;
  background: $bg-primary;
  overflow-x: hidden;
}

.scroll-content {
  height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
}

.form-section {
  background: $glass-bg;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: $shadow-card;
}

.section-label {
  font-size: $font-md;
  font-weight: 600;
  color: $primary;
  display: block;
  margin-bottom: 20rpx;
}

.select-btn {
  padding: 24rpx;
  background: $bg-secondary;
  border: 2rpx dashed #CBD5E1;
  border-radius: $radius-md;
  text-align: center;
}

.select-text {
  font-size: $font-base;
  color: $primary;
}

.selected-material {
  padding: 20rpx;
  background: $bg-tertiary;
  border: 1rpx solid #CBD5E1;
  border-radius: $radius-md;
}

.selected-name {
  font-size: $font-md;
  color: $text-primary;
  font-weight: 600;
  display: block;
}

.selected-info {
  font-size: $font-sm;
  color: $text-tertiary;
  margin-top: 4rpx;
  display: block;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: $font-sm;
  color: $text-tertiary;
  display: block;
  margin-bottom: 12rpx;
}

.qty-input {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.qty-field {
  flex: 1;
  min-height: 88rpx;
  padding: 0 20rpx;
  background: $bg-secondary;
  border: 1rpx solid #E2E8F0;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.qty-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-md;
  background: $bg-secondary;
  border: 1rpx solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-xl;
  color: $primary;

  &:active {
    background: $bg-tertiary;
  }
}

.qty-value {
  flex: 1;
  height: 88rpx;
  min-height: 88rpx;
  text-align: center;
  font-size: $font-2xl;
  color: $text-primary;
  font-weight: 700;
  background: transparent;
  border: none;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx 20rpx;
  background: $bg-secondary;
  border: 1rpx solid #E2E8F0;
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-base;
  box-sizing: border-box;
}

.submit-section {
  padding: 16rpx 0 32rpx;
}

.submit-btn {
  width: 100%;
  padding: 28rpx;
  background: $primary;
  border-radius: $radius-lg;
  text-align: center;
  box-sizing: border-box;

  &.disabled {
    opacity: 0.5;
  }
}

.submit-text {
  font-size: $font-lg;
  color: $bg-primary;
  font-weight: 700;
}

// 物资选择弹窗
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.picker-panel {
  width: 100%;
  max-height: 70vh;
  background: $bg-secondary;
  border-radius: $radius-xl $radius-xl 0 0;
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #E2E8F0;
}

.picker-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: 600;
}

.picker-close {
  font-size: 32rpx;
  color: $text-tertiary;
  padding: 8rpx;
}

.picker-list {
  max-height: 60vh;
  padding: 16rpx 32rpx;
  box-sizing: border-box;
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 16rpx;
  border-radius: $radius-md;
  margin-bottom: 8rpx;

  &.selected {
    background: $bg-tertiary;
  }
}

.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320rpx;
  padding: 24rpx;
  text-align: center;
}

.picker-empty-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: 600;
}

.picker-empty-desc {
  margin-top: 8rpx;
  font-size: $font-sm;
  color: $text-tertiary;
}

.picker-item-left {
  display: flex;
  flex-direction: column;
}

.picker-item-name {
  font-size: $font-base;
  color: $text-primary;
}

.picker-item-cat {
  font-size: $font-xs;
  color: $text-tertiary;
  margin-top: 4rpx;
}

.picker-item-stock {
  font-size: $font-sm;
  color: $primary;
  font-weight: 500;
}
</style>

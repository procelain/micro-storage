<template>
  <view class="loss-record-page">
    <scroll-view scroll-y class="scroll-content">
      <!-- 选择物资 -->
      <view class="form-section">
        <text class="section-label">选择物资</text>
        <view v-if="!selectedMaterial" class="select-btn" @tap="showMaterialPicker = true">
          <text class="select-text">点击选择物资</text>
        </view>
        <view v-else class="selected-material" @tap="showMaterialPicker = true">
          <text class="selected-name">{{ selectedMaterial.name }}</text>
          <text class="selected-info">库存 {{ selectedMaterial.stock }}{{ selectedMaterial.unit }} · 均价 {{ formatMoney(selectedMaterial.avgPrice) }}</text>
        </view>
      </view>

      <!-- 损耗信息 -->
      <view class="form-section">
        <text class="section-label">损耗明细</text>

        <view class="form-item">
          <text class="form-label">消耗数量</text>
          <view class="qty-input">
            <view class="qty-btn" @tap="adjustConsumed(-1)">
              <text>-</text>
            </view>
            <input class="qty-value" type="digit" v-model="form.consumedQty" />
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
            <input class="qty-value" type="digit" v-model="form.damagedQty" />
            <view class="qty-btn" @tap="adjustDamaged(1)">
              <text>+</text>
            </view>
          </view>
        </view>

        <!-- 损坏照片上传 -->
        <view class="form-item" v-if="parseInt(form.damagedQty) > 0">
          <text class="form-label">损坏照片</text>
          <ImageUploader v-model="form.damagedImages" :maxCount="9" />
        </view>

        <view class="form-item">
          <text class="form-label">说明备注</text>
          <textarea class="form-textarea" v-model="form.remark" placeholder="损坏原因、处理方式等" maxlength="500" />
        </view>

        <!-- 成本预估 -->
        <view class="cost-preview" v-if="totalCost > 0">
          <text class="cost-label">预估成本</text>
          <text class="cost-value">{{ formatMoney(totalCost) }}</text>
        </view>
      </view>

      <!-- 提交 -->
      <view class="submit-section">
        <view class="submit-btn" :class="{ disabled: !canSubmit }" @tap="submitLoss">
          <text class="submit-text">确认录入</text>
        </view>
      </view>
    </scroll-view>

    <!-- 物资选择弹窗 -->
    <view v-if="showMaterialPicker" class="picker-mask" @tap="showMaterialPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择物资</text>
          <text class="picker-close" @tap="showMaterialPicker = false">✕</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
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
import { formatMoney } from '@/utils/format'
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

const totalCost = computed(() => {
  const consumed = parseInt(form.value.consumedQty) || 0
  const damaged = parseInt(form.value.damagedQty) || 0
  const price = selectedMaterial.value?.avgPrice || 0
  return (consumed + damaged) * price
})

const canSubmit = computed(() => {
  return selectedMaterial.value &&
    (parseInt(form.value.consumedQty) > 0 || parseInt(form.value.damagedQty) > 0)
})

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  banquetId.value = page?.options?.banquetId || page?.$page?.options?.banquetId || ''

  // 加载物资列表
  try {
    const res = await getMaterialList({ pageSize: 200 })
    materialList.value = res.list.filter(m => m.stock > 0) // 只显示有库存的
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
    uni.showToast({ title: '录入成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    uni.showToast({ title: '录入失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.loss-record-page {
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
  padding: 24rpx;
  margin-bottom: 24rpx;
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
  background: rgba(255, 255, 255, 0.04);
  border: 2rpx dashed rgba(201, 169, 110, 0.3);
  border-radius: $radius-md;
  text-align: center;
}

.select-text {
  font-size: $font-base;
  color: $primary;
}

.selected-material {
  padding: 20rpx;
  background: rgba(201, 169, 110, 0.08);
  border: 1rpx solid rgba(201, 169, 110, 0.3);
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

.qty-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-xl;
  color: $primary;

  &:active {
    background: rgba(201, 169, 110, 0.2);
  }
}

.qty-value {
  flex: 1;
  text-align: center;
  font-size: $font-2xl;
  color: $text-primary;
  font-weight: 700;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-base;
}

.cost-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: rgba(201, 169, 110, 0.08);
  border-radius: $radius-md;
  margin-top: 16rpx;
}

.cost-label {
  font-size: $font-sm;
  color: $text-tertiary;
}

.cost-value {
  font-size: $font-lg;
  color: $primary;
  font-weight: 700;
}

.submit-section {
  padding: 16rpx 0 32rpx;
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
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
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
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 16rpx;
  border-radius: $radius-md;
  margin-bottom: 8rpx;

  &.selected {
    background: rgba(201, 169, 110, 0.12);
  }
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

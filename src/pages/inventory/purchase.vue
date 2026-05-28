<template>
  <view class="purchase-page">
    <scroll-view scroll-y class="scroll-content">
      <!-- 物资选择 -->
      <view class="form-section">
        <text class="section-label">物资信息</text>
        <view v-if="!selectedMaterial" class="select-material" @tap="showMaterialPicker = true">
          <text class="select-placeholder">选择物资</text>
          <text class="select-arrow">›</text>
        </view>
        <view v-else class="selected-material" @tap="showMaterialPicker = true">
          <text class="selected-name">{{ selectedMaterial.name }}</text>
          <text class="selected-stock">库存: {{ selectedMaterial.stock }}{{ selectedMaterial.unit }}</text>
        </view>
      </view>

      <!-- 进货信息表单 -->
      <view class="form-section">
        <text class="section-label">进货明细</text>

        <view class="form-item">
          <text class="form-label">进货数量</text>
          <input class="form-input" type="digit" v-model="form.quantity" placeholder="请输入数量" />
        </view>

        <view class="form-item">
          <text class="form-label">单价（元）</text>
          <input class="form-input" type="digit" v-model="form.unitPrice" placeholder="请输入单价" />
        </view>

        <view class="form-item total-item">
          <text class="form-label">总金额</text>
          <text class="total-value">{{ totalAmount }}</text>
        </view>

        <view class="form-item">
          <text class="form-label">供应商</text>
          <input class="form-input" v-model="form.supplierId" placeholder="供应商名称（选填）" />
        </view>

        <view class="form-item">
          <text class="form-label">进货日期</text>
          <picker mode="date" :value="form.purchaseDate" @change="onDateChange">
            <view class="date-picker">
              <text class="date-text">{{ form.purchaseDate || '请选择日期' }}</text>
              <text class="date-arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea class="form-textarea" v-model="form.remark" placeholder="备注信息（选填）" maxlength="200" />
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <view class="submit-btn" :class="{ disabled: !canSubmit }" @tap="submitPurchase">
          <text class="submit-text">确认进货</text>
        </view>
      </view>

      <!-- 新增物资模式 -->
      <view v-if="mode === 'add'" class="form-section">
        <text class="section-label">新建物资</text>
        <view class="form-item">
          <text class="form-label">物资名称</text>
          <input class="form-input" v-model="newMaterial.name" placeholder="请输入物资名称" />
        </view>
        <view class="form-item">
          <text class="form-label">分类</text>
          <picker :range="categoryOptions" :value="categoryIndex" @change="onCategoryChange">
            <view class="date-picker">
              <text class="date-text">{{ newMaterial.category || '选择分类' }}</text>
              <text class="date-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">规格</text>
          <input class="form-input" v-model="newMaterial.spec" placeholder="规格（选填）" />
        </view>
        <view class="form-item">
          <text class="form-label">单位</text>
          <input class="form-input" v-model="newMaterial.unit" placeholder="如：个/件/米" />
        </view>
        <view class="form-item">
          <text class="form-label">最低库存</text>
          <input class="form-input" type="digit" v-model="newMaterial.minStock" placeholder="低库存预警阈值" />
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
            <text class="picker-item-name">{{ item.name }}</text>
            <text class="picker-item-stock">{{ item.stock }}{{ item.unit }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { createPurchase } from '@/api/purchase'
import { createMaterial, getMaterialList } from '@/api/material'
import { formatMoney } from '@/utils/format'
import type { Material } from '@/api/material'

const mode = ref<'purchase' | 'add' | 'edit'>('purchase')
const materialId = ref('')
const showMaterialPicker = ref(false)
const materialList = ref<Material[]>([])
const selectedMaterial = ref<Material | null>(null)
const submitting = ref(false)

const form = ref({
  quantity: '',
  unitPrice: '',
  supplierId: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  remark: ''
})

const newMaterial = ref({
  name: '',
  category: '其他',
  spec: '',
  unit: '个',
  minStock: ''
})

const categoryOptions = ['花艺', '灯光', '布艺', '餐具', '道具', '其他']
const categoryIndex = ref(5)

const totalAmount = computed(() => {
  const qty = parseFloat(form.value.quantity) || 0
  const price = parseFloat(form.value.unitPrice) || 0
  return formatMoney(qty * price)
})

const canSubmit = computed(() => {
  if (mode.value === 'add' && !newMaterial.value.name) return false
  if (!selectedMaterial.value && mode.value !== 'add') return false
  return parseFloat(form.value.quantity) > 0 && parseFloat(form.value.unitPrice) > 0
})

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  const options = page?.options || page?.$page?.options || {}

  mode.value = options.mode === 'add' ? 'add' : 'purchase'
  materialId.value = options.materialId || ''

  // 加载物资列表
  try {
    const res = await getMaterialList({ pageSize: 200 })
    materialList.value = res.list

    // 如果有预选物资
    if (materialId.value) {
      const found = materialList.value.find(m => m._id === materialId.value)
      if (found) selectedMaterial.value = found
    }
  } catch (e) {
    console.error('加载物资列表失败', e)
  }
})

function onDateChange(e: any) {
  form.value.purchaseDate = e.detail.value
}

function onCategoryChange(e: any) {
  categoryIndex.value = e.detail.value
  newMaterial.value.category = categoryOptions[e.detail.value]
}

function selectMaterial(item: Material) {
  selectedMaterial.value = item
  showMaterialPicker.value = false
}

async function submitPurchase() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true

  try {
    let targetMaterialId = selectedMaterial.value?._id

    // 新增物资模式，先创建物资
    if (mode.value === 'add' && !targetMaterialId) {
      const newMat = await createMaterial({
        name: newMaterial.value.name,
        category: newMaterial.value.category,
        spec: newMaterial.value.spec,
        unit: newMaterial.value.unit,
        minStock: parseInt(newMaterial.value.minStock) || 0,
        image: ''
      })
      targetMaterialId = newMat._id
    }

    if (!targetMaterialId) {
      uni.showToast({ title: '请选择物资', icon: 'none' })
      return
    }

    await createPurchase({
      materialId: targetMaterialId,
      quantity: parseFloat(form.value.quantity),
      unitPrice: parseFloat(form.value.unitPrice),
      supplierId: form.value.supplierId,
      purchaseDate: form.value.purchaseDate,
      remark: form.value.remark
    })

    uni.showToast({ title: '进货录入成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    uni.showToast({ title: '录入失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.purchase-page {
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

.select-material {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(201, 169, 110, 0.2);
  border-radius: $radius-md;
}

.select-placeholder {
  color: $text-disabled;
  font-size: $font-base;
}

.select-arrow {
  color: $text-tertiary;
  font-size: 36rpx;
}

.selected-material {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: rgba(201, 169, 110, 0.08);
  border: 1rpx solid rgba(201, 169, 110, 0.3);
  border-radius: $radius-md;
}

.selected-name {
  font-size: $font-md;
  color: $text-primary;
  font-weight: 500;
}

.selected-stock {
  font-size: $font-sm;
  color: $text-tertiary;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-label {
  font-size: $font-sm;
  color: $text-tertiary;
  display: block;
  margin-bottom: 8rpx;
}

.form-input {
  width: 100%;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-base;
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

.total-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: rgba(201, 169, 110, 0.08);
  border-radius: $radius-md;
}

.total-value {
  font-size: $font-lg;
  color: $primary;
  font-weight: 700;
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
  transition: opacity $transition-fast;

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

.picker-item-name {
  font-size: $font-base;
  color: $text-primary;
}

.picker-item-stock {
  font-size: $font-sm;
  color: $text-tertiary;
}
</style>

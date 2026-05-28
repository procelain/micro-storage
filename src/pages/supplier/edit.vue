<template>
  <view class="supplier-edit-page">
    <scroll-view scroll-y class="scroll-content">
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">供应商名称 <text class="required">*</text></text>
          <input class="form-input" v-model="form.name" placeholder="请输入名称" />
        </view>
        <view class="form-item">
          <text class="form-label">联系人</text>
          <input class="form-input" v-model="form.contact" placeholder="联系人姓名" />
        </view>
        <view class="form-item">
          <text class="form-label">联系电话</text>
          <input class="form-input" type="number" v-model="form.phone" placeholder="手机号码" />
        </view>
        <view class="form-item">
          <text class="form-label">主营品类</text>
          <input class="form-input" v-model="form.mainCategory" placeholder="如：花艺、灯光" />
        </view>
        <view class="form-item">
          <text class="form-label">地址</text>
          <textarea class="form-textarea" v-model="form.address" placeholder="地址（选填）" maxlength="200" />
        </view>
      </view>

      <view class="submit-section">
        <view class="submit-btn" @tap="submitForm">
          <text class="submit-text">{{ isEdit ? '保存修改' : '添加供应商' }}</text>
        </view>
        <view v-if="isEdit" class="delete-btn" @tap="confirmDelete">
          <text class="delete-text">删除供应商</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createSupplier, updateSupplier, deleteSupplier, getSupplierList } from '@/api/supplier'

const isEdit = ref(false)
const supplierId = ref('')

const form = ref({
  name: '',
  contact: '',
  phone: '',
  address: '',
  mainCategory: ''
})

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  supplierId.value = page?.options?.id || page?.$page?.options?.id || ''

  if (supplierId.value) {
    isEdit.value = true
    try {
      const list = await getSupplierList()
      const found = list.find((s: any) => s._id === supplierId.value)
      if (found) {
        form.value = {
          name: found.name,
          contact: found.contact || '',
          phone: found.phone || '',
          address: found.address || '',
          mainCategory: found.mainCategory || ''
        }
      }
    } catch (e) {
      console.error('加载供应商信息失败', e)
    }
  }
})

async function submitForm() {
  if (!form.value.name) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }

  try {
    if (isEdit.value) {
      await updateSupplier({ id: supplierId.value, ...form.value })
    } else {
      await createSupplier(form.value as any)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function confirmDelete() {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除此供应商吗？',
    confirmColor: '#E74C3C',
    success: async (res) => {
      if (res.confirm) {
        await deleteSupplier(supplierId.value)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 800)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.supplier-edit-page {
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

.submit-section {
  padding: 32rpx 0;
}

.submit-btn {
  width: 100%;
  padding: 28rpx;
  background: $primary-gradient;
  border-radius: $radius-lg;
  text-align: center;
  margin-bottom: 16rpx;
}

.submit-text {
  font-size: $font-lg;
  color: $bg-primary;
  font-weight: 700;
}

.delete-btn {
  width: 100%;
  padding: 28rpx;
  background: rgba(231, 76, 60, 0.1);
  border: 1rpx solid rgba(231, 76, 60, 0.3);
  border-radius: $radius-lg;
  text-align: center;
}

.delete-text {
  font-size: $font-base;
  color: $danger;
}
</style>

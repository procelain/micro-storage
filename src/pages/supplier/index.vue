<template>
  <view class="supplier-page">
    <scroll-view scroll-y class="scroll-content">
      <view class="page-header">
        <text class="page-title">供应商管理</text>
        <view class="add-btn" @tap="goToEdit()">
          <text class="add-text">+ 新增</text>
        </view>
      </view>

      <view v-for="item in supplierList" :key="item._id" class="supplier-card" @tap="goToEdit(item._id)">
        <view class="card-main">
          <text class="supplier-name">{{ item.name }}</text>
          <text v-if="item.mainCategory" class="supplier-cat">{{ item.mainCategory }}</text>
        </view>
        <view class="card-info">
          <text v-if="item.contact" class="info-text">👤 {{ item.contact }}</text>
          <text v-if="item.phone" class="info-text">📞 {{ item.phone }}</text>
        </view>
        <text v-if="item.address" class="card-address">📍 {{ item.address }}</text>
      </view>

      <EmptyState
        v-if="supplierList.length === 0"
        icon="🏢"
        title="暂无供应商"
        description="添加您的供应商信息"
        actionText="添加供应商"
        @action="goToEdit()"
      />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSupplierList } from '@/api/supplier'
import type { Supplier } from '@/api/supplier'
import EmptyState from '@/components/EmptyState.vue'

const supplierList = ref<Supplier[]>([])

async function loadList() {
  try {
    supplierList.value = await getSupplierList()
  } catch (e) {
    console.error('加载供应商列表失败', e)
  }
}

function goToEdit(id?: string) {
  const url = id ? `/pages/supplier/edit?id=${id}` : '/pages/supplier/edit'
  uni.navigateTo({ url })
}

onMounted(loadList)
onShow(loadList)
</script>

<style lang="scss" scoped>
.supplier-page {
  min-height: 100vh;
  background: $bg-primary;
}

.scroll-content {
  padding: 24rpx;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.page-title {
  font-size: $font-xl;
  font-weight: 700;
  color: $text-primary;
}

.add-btn {
  padding: 12rpx 24rpx;
  background: $primary-gradient;
  border-radius: $radius-round;
}

.add-text {
  font-size: $font-sm;
  color: $bg-primary;
  font-weight: 600;
}

.supplier-card {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: $glass-border;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 16rpx;

  &:active {
    opacity: 0.8;
  }
}

.card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.supplier-name {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.supplier-cat {
  font-size: $font-xs;
  color: $primary;
  padding: 4rpx 12rpx;
  background: rgba(201, 169, 110, 0.1);
  border-radius: $radius-round;
}

.card-info {
  display: flex;
  gap: 24rpx;
  margin-bottom: 8rpx;
}

.info-text {
  font-size: $font-sm;
  color: $text-tertiary;
}

.card-address {
  font-size: $font-xs;
  color: $text-disabled;
}
</style>

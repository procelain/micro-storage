<template>
  <view class="inventory-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="nav-title">库存管理</text>
        <view class="nav-action" @tap="goToAddMaterial">
          <text class="action-text">+ 新增</text>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" placeholder="搜索物资名称..." @search="onSearch" />

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-scroll">
      <view class="category-tabs">
        <view
          v-for="cat in categories"
          :key="cat.value"
          class="category-tab"
          :class="{ active: currentCategory === cat.value }"
          @tap="selectCategory(cat.value)"
        >
          <view v-if="cat.value" class="cat-dot" :style="{ background: cat.color }"></view>
          <text class="tab-text">{{ cat.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 物资列表 -->
    <scroll-view
      scroll-y
      class="material-list"
      :style="{ height: scrollHeight + 'px' }"
      @scrolltolower="loadMore"
    >
      <MaterialCard
        v-for="item in materialStore.list"
        :key="item._id"
        :material="item"
        @tap="goToDetail(item._id)"
      />
      <view v-if="materialStore.loading" class="loading">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-if="!materialStore.loading && materialStore.list.length === 0" class="no-data">
        <EmptyState
          icon="📦"
          title="暂无物资"
          description="点击右下角按钮添加第一项物资"
          actionText="添加物资"
          @action="goToAddMaterial"
        />
      </view>
    </scroll-view>

    <!-- 浮动按钮 - 进货录入 -->
    <view class="fab-button" @tap="goToPurchase">
      <text class="fab-icon">📦</text>
      <text class="fab-text">进货</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMaterialStore } from '@/stores/material'
import SearchBar from '@/components/SearchBar.vue'
import MaterialCard from '@/components/MaterialCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const materialStore = useMaterialStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(0)
// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync()
statusBarHeight.value = systemInfo.statusBarHeight || 0
// #endif

const keyword = ref('')
const currentCategory = ref('')

const categories = [
  { label: '全部', value: '', color: '' },
  { label: '花艺', value: '花艺', color: '#FF6B9D' },
  { label: '灯光', value: '灯光', color: '#FFD93D' },
  { label: '布艺', value: '布艺', color: '#6BCB77' },
  { label: '餐具', value: '餐具', color: '#4D96FF' },
  { label: '道具', value: '道具', color: '#9B59B6' },
  { label: '其他', value: '其他', color: '#A0A0A0' }
]

function selectCategory(cat: string) {
  currentCategory.value = cat
  loadList()
}

function onSearch() {
  loadList()
}

function loadList() {
  materialStore.fetchList({
    keyword: keyword.value,
    category: currentCategory.value,
    page: 1
  })
}

function loadMore() {
  if (materialStore.list.length < materialStore.total) {
    materialStore.fetchList({
      keyword: keyword.value,
      category: currentCategory.value,
      page: Math.floor(materialStore.list.length / 50) + 1
    })
  }
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/inventory/detail?id=${id}` })
}

function goToAddMaterial() {
  uni.navigateTo({ url: '/pages/inventory/purchase?mode=add' })
}

function goToPurchase() {
  uni.navigateTo({ url: '/pages/inventory/purchase' })
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  scrollHeight.value = sysInfo.windowHeight - 260
  loadList()
})

onShow(() => {
  loadList()
})

// 监听来自看板的筛选事件
uni.$on('inventory:filter', (data: any) => {
  if (data.alertType) {
    currentCategory.value = ''
    materialStore.fetchList({ alertType: data.alertType })
  }
})
</script>

<style lang="scss" scoped>
.inventory-page {
  min-height: 100vh;
  background: $bg-primary;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 32rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
}

.nav-action {
  padding: 12rpx 24rpx;
  background: $primary-gradient;
  border-radius: $radius-round;
}

.action-text {
  font-size: $font-sm;
  color: $bg-primary;
  font-weight: 600;
}

.category-scroll {
  white-space: nowrap;
  padding: 0 24rpx 16rpx;
}

.category-tabs {
  display: inline-flex;
  gap: 12rpx;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 24rpx;
  border-radius: $radius-round;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  transition: all $transition-fast;
}

.category-tab.active {
  background: rgba(201, 169, 110, 0.15);
  border-color: rgba(201, 169, 110, 0.4);
}

.cat-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 6rpx;
}

.tab-text {
  font-size: $font-sm;
  color: $text-tertiary;
}

.category-tab.active .tab-text {
  color: $primary;
}

.material-list {
  padding: 0 24rpx;
}

.loading {
  padding: 32rpx;
  text-align: center;
}

.loading-text {
  color: $text-tertiary;
  font-size: $font-sm;
}

.no-data {
  padding-top: 80rpx;
}

.fab-button {
  position: fixed;
  right: 32rpx;
  bottom: 120rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 32rpx;
  background: $primary-gradient;
  border-radius: $radius-round;
  box-shadow: $shadow-primary;
  z-index: 50;
  transition: transform $transition-fast;

  &:active {
    transform: scale(0.95);
  }
}

.fab-icon {
  font-size: 32rpx;
}

.fab-text {
  font-size: $font-base;
  color: $bg-primary;
  font-weight: 600;
}
</style>

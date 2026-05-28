<template>
  <view class="banquet-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="nav-title">宴会管理</text>
        <view class="nav-action" @tap="goToCreate">
          <text class="action-text">+ 创建</text>
        </view>
      </view>
    </view>

    <!-- 状态标签 -->
    <scroll-view scroll-x class="status-scroll">
      <view class="status-tabs">
        <view
          v-for="status in statuses"
          :key="status.value"
          class="status-tab"
          :class="{ active: currentStatus === status.value }"
          @tap="selectStatus(status.value)"
        >
          <text class="tab-text" :style="{ color: currentStatus === status.value ? status.color : '' }">
            {{ status.label }}
          </text>
          <view v-if="currentStatus === status.value" class="tab-indicator" :style="{ background: status.color }"></view>
        </view>
      </view>
    </scroll-view>

    <!-- 宴会列表 -->
    <scroll-view
      scroll-y
      class="banquet-list"
      :style="{ height: scrollHeight + 'px' }"
      @scrolltolower="loadMore"
    >
      <BanquetCard
        v-for="item in banquetStore.list"
        :key="item._id"
        :banquet="item"
        @tap="goToDetail(item._id)"
      />
      <view v-if="banquetStore.loading" class="loading">
        <text class="loading-text">加载中...</text>
      </view>
      <EmptyState
        v-if="!banquetStore.loading && banquetStore.list.length === 0"
        icon="🎊"
        title="暂无宴会"
        description="点击右下角按钮创建第一场宴会"
        actionText="创建宴会"
        @action="goToCreate"
      />
    </scroll-view>

    <!-- 浮动按钮 -->
    <view class="fab-button" @tap="goToCreate">
      <text class="fab-icon">✚</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBanquetStore } from '@/stores/banquet'
import BanquetCard from '@/components/BanquetCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const banquetStore = useBanquetStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(0)
const currentStatus = ref('')

const statuses = [
  { label: '全部', value: '', color: '#C9A96E' },
  { label: '筹备中', value: '筹备中', color: '#F39C12' },
  { label: '进行中', value: '进行中', color: '#3498DB' },
  { label: '已完成', value: '已完成', color: '#2ECC71' },
  { label: '已结算', value: '已结算', color: '#C9A96E' }
]

// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync()
statusBarHeight.value = systemInfo.statusBarHeight || 0
// #endif

function selectStatus(status: string) {
  currentStatus.value = status
  banquetStore.fetchList({ status })
}

function loadMore() {
  if (banquetStore.list.length < banquetStore.total) {
    banquetStore.fetchList({ status: currentStatus.value })
  }
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/banquet/detail?id=${id}` })
}

function goToCreate() {
  uni.navigateTo({ url: '/pages/banquet/create' })
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  scrollHeight.value = sysInfo.windowHeight - 200
  banquetStore.fetchList()
})

onShow(() => {
  banquetStore.fetchList({ status: currentStatus.value })
})
</script>

<style lang="scss" scoped>
.banquet-page {
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

.status-scroll {
  white-space: nowrap;
  padding: 16rpx 24rpx;
}

.status-tabs {
  display: inline-flex;
  gap: 8rpx;
}

.status-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 28rpx;
  border-radius: $radius-round;
  background: rgba(255, 255, 255, 0.04);
  position: relative;
}

.status-tab.active {
  background: rgba(201, 169, 110, 0.1);
}

.tab-text {
  font-size: $font-sm;
  color: $text-tertiary;
  font-weight: 500;
}

.tab-indicator {
  width: 24rpx;
  height: 4rpx;
  border-radius: 2rpx;
  margin-top: 8rpx;
}

.banquet-list {
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

.fab-button {
  position: fixed;
  right: 32rpx;
  bottom: 120rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  background: $primary-gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-primary;
  z-index: 50;

  &:active {
    transform: scale(0.9);
  }
}

.fab-icon {
  font-size: 40rpx;
  color: $bg-primary;
  font-weight: 700;
}
</style>

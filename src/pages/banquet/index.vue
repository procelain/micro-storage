<template>
  <view class="banquet-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="nav-title">宴会记录</text>
      </view>
    </view>

    <!-- 状态标签 -->
    <scroll-view scroll-x class="status-scroll" :style="{ paddingTop: navBarHeight + 'px' }">
      <view class="status-tabs">
        <view
          v-for="status in statuses"
          :key="status.value"
          class="status-tab"
          :class="{ active: currentStatus === status.value }"
          @tap="selectStatus(status.value)"
        >
          <text
            class="tab-text"
            :style="{
              color: currentStatus === status.value ? status.color : '',
            }"
          >
            {{ status.label }}
          </text>
          <view
            v-if="currentStatus === status.value"
            class="tab-indicator"
            :style="{ background: status.color }"
          ></view>
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
        icon="O"
        title="还没有宴会记录"
        description="先创建一场生日宴，后续价格和使用记录都会汇总在这里"
        actionText="新建宴会"
        @action="goToCreate"
      />
    </scroll-view>

    <!-- 浮动按钮 -->
    <view class="fab-button" @tap="goToCreate">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useBanquetStore } from "@/stores/banquet";
import BanquetCard from "@/components/BanquetCard.vue";
import EmptyState from "@/components/EmptyState.vue";

const banquetStore = useBanquetStore();

const statusBarHeight = ref(0);
const navBarHeight = ref(0);
const scrollHeight = ref(0);
const currentStatus = ref("");

const statuses = [
  { label: "全部", value: "", color: "#111827" },
  { label: "筹备中", value: "筹备中", color: "#D97706" },
  { label: "进行中", value: "进行中", color: "#2563EB" },
  { label: "已完成", value: "已完成", color: "#16A34A" },
  { label: "已结算", value: "已结算", color: "#111827" },
];

// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync();
statusBarHeight.value = systemInfo.statusBarHeight || 0;
// #endif

function selectStatus(status: string) {
  currentStatus.value = status;
  banquetStore.fetchList({ status });
}

function loadMore() {
  if (banquetStore.list.length < banquetStore.total) {
    banquetStore.fetchList({ status: currentStatus.value });
  }
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/banquet/detail?id=${id}` });
}

function goToCreate() {
  uni.navigateTo({ url: "/pages/banquet/create" });
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync();
  const navContentHeight = 52; // nav-content 的近似高度 (padding 16rpx*2 + font 36rpx)
  navBarHeight.value = statusBarHeight.value + navContentHeight;
  scrollHeight.value = sysInfo.windowHeight - navBarHeight.value - 70; // 70px for status tabs
  banquetStore.fetchList();
});

onShow(() => {
  banquetStore.fetchList({ status: currentStatus.value });
});
</script>

<style lang="scss" scoped>
.banquet-page {
  min-height: 100vh;
  background: $bg-primary;
  overflow-x: hidden;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(248, 250, 252, 0.96);
  border-bottom: 1rpx solid #e2e8f0;
}

.nav-content {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
}

.status-scroll {
  white-space: nowrap;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
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
  background: $bg-secondary;
  border: 1rpx solid #e2e8f0;
  position: relative;
}

.status-tab.active {
  background: $bg-tertiary;
  border-color: #cbd5e1;
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
  box-sizing: border-box;
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
  background: $primary;
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

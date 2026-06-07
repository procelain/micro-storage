<template>
  <view class="inventory-page">
    <scroll-view
      scroll-y
      class="content-scroll"
      :style="{ height: scrollHeight + 'px' }"
    >
      <view
        class="page-header"
        :style="{ paddingTop: statusBarHeight + 16 + 'px' }"
      >
        <text class="page-title">气球库存</text>
      </view>

      <view class="search-wrap">
        <SearchBar
          v-model="keyword"
          placeholder="搜索颜色 / 尺寸 / 场景，例如：粉色 10寸"
          @search="onSearch"
        />
      </view>

      <scroll-view scroll-x class="category-scroll">
        <view class="category-tabs">
          <view
            v-for="filter in filters"
            :key="filter.label"
            class="category-tab"
            :class="{ active: currentFilter === filter.label }"
            @tap="selectFilter(filter.label)"
          >
            <text class="tab-text">{{ filter.label }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="material-list">
        <MaterialCard
          v-for="item in displayList"
          :key="item._id"
          :material="item"
          @tap="goToDetail(item._id)"
        />
      </view>

      <view v-if="materialStore.loading" class="loading">
        <text class="loading-text">加载中...</text>
      </view>

      <view
        v-if="!materialStore.loading && displayList.length === 0"
        class="no-data"
      >
        <EmptyState
          icon="O"
          :title="keyword ? '没有找到匹配气球' : '还没有气球记录'"
          :description="
            keyword
              ? '试试更换颜色、尺寸或场景关键词'
              : '先新增气球，后续补货和库存提醒都会在这里显示'
          "
          actionText="补货 / 新增"
          @action="goToPurchase"
        />
      </view>
    </scroll-view>

    <view class="fab-button" @tap="goToAddMaterial">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMaterialStore } from "@/stores/material";
import SearchBar from "@/components/SearchBar.vue";
import MaterialCard from "@/components/MaterialCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import type { Material } from "@/api/material";

const materialStore = useMaterialStore();

const statusBarHeight = ref(0);
const scrollHeight = ref(0);
// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync();
statusBarHeight.value = systemInfo.statusBarHeight || 0;
// #endif

const keyword = ref("");
const currentFilter = ref("全部");
const activeAlertType = ref<"" | "lowStock" | "slow">("");

const filters = [
  { label: "全部", type: "all", value: "" },
  { label: "5寸", type: "spec", value: "5寸" },
  { label: "10寸", type: "spec", value: "10寸" },
  { label: "18寸", type: "spec", value: "18寸" },
  { label: "乳胶", type: "category", value: "乳胶" },
  { label: "铝膜", type: "category", value: "铝膜" },
  { label: "其他", type: "category", value: "其他" },
];

const displayList = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  const activeFilter = filters.find(
    (item) => item.label === currentFilter.value,
  );

  return materialStore.list.filter((item: Material) => {
    const matchesKeyword =
      !normalizedKeyword ||
      [item.name, item.spec, item.category]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(normalizedKeyword));

    if (!matchesKeyword) {
      return false;
    }

    if (!activeFilter || activeFilter.type === "all") {
      return true;
    }

    if (activeFilter.type === "category") {
      return item.category === activeFilter.value;
    }

    return (
      item.spec?.includes(activeFilter.value) ||
      item.name?.includes(activeFilter.value)
    );
  });
});

function selectFilter(label: string) {
  currentFilter.value = label;
  activeAlertType.value = "";
  loadList();
}

function onSearch() {
  loadList();
}

function loadList() {
  materialStore.fetchList({
    page: 1,
    pageSize: 200,
    alertType: activeAlertType.value || undefined,
  });
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/inventory/detail?id=${id}` });
}

function goToAddMaterial() {
  uni.navigateTo({ url: "/pages/inventory/purchase?mode=add" });
}

function goToPurchase() {
  uni.navigateTo({ url: "/pages/inventory/purchase" });
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync();
  scrollHeight.value = sysInfo.windowHeight;
  loadList();
});

onShow(() => {
  loadList();
});

function handleInventoryFilter(data: { alertType?: "lowStock" | "slow" }) {
  if (data.alertType) {
    currentFilter.value = "全部";
    activeAlertType.value = data.alertType;
    materialStore.fetchList({
      page: 1,
      pageSize: 200,
      alertType: data.alertType,
    });
  }
}

uni.$on("inventory:filter", handleInventoryFilter);

onUnmounted(() => {
  uni.$off("inventory:filter", handleInventoryFilter);
});
</script>

<style lang="scss" scoped>
.inventory-page {
  min-height: 100vh;
  background: #f3f4f6;
}

.content-scroll {
  box-sizing: border-box;
  padding-bottom: 32rpx;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 0 32rpx 24rpx;
}

.page-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #111827;
}

.search-wrap {
  padding: 0 24rpx 8rpx;
}

.category-scroll {
  white-space: nowrap;
  padding: 0 24rpx 20rpx;
}

.category-tabs {
  display: inline-flex;
  gap: 12rpx;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76rpx;
  height: 54rpx;
  padding: 0 22rpx;
  border-radius: $radius-round;
  background: #f8fafc;
  border: 1rpx solid #cbd5e1;
  transition: all $transition-fast;
  box-sizing: border-box;
}

.category-tab.active {
  background: #ffffff;
  border-color: #111827;
}

.tab-text {
  font-size: $font-sm;
  color: #64748b;
}

.category-tab.active .tab-text {
  color: #111827;
  font-weight: 600;
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
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  background: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx rgba(15, 23, 42, 0.2);
  z-index: 50;

  &:active {
    transform: scale(0.9);
  }
}

.fab-icon {
  font-size: 40rpx;
  color: #ffffff;
  font-weight: 700;
}
</style>

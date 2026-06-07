<template>
  <view class="purchase-page">
    <view class="scroll-content" :style="{ paddingTop: topSpacing + 'px' }">
      <view v-if="mode !== 'add'" class="form-section">
        <text class="section-label">气球信息</text>
        <view
          v-if="!selectedMaterial"
          class="select-material"
          @tap="openMaterialPicker"
        >
          <text class="select-placeholder">选择要补货的气球</text>
          <text class="select-arrow">›</text>
        </view>
        <view v-else class="selected-material" @tap="openMaterialPicker">
          <text class="selected-name">{{ selectedMaterial.name }}</text>
          <text class="selected-stock">
            {{ selectedMaterial.category || "其他" }} ·
            {{ selectedMaterial.spec || "未填写规格" }} · 库存
            {{ selectedMaterial.stock }}{{ selectedMaterial.unit }}
          </text>
        </view>
      </view>

      <view v-if="mode === 'add'" class="form-section">
        <text class="section-label">新建气球</text>
        <view class="form-item">
          <text class="form-label">颜色/名称</text>
          <view class="form-control">
            <input
              class="form-input"
              v-model="newMaterial.name"
              placeholder="例如：马卡龙粉 / 雾霾蓝"
            />
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">类型</text>
          <picker
            :range="categoryOptions"
            :value="categoryIndex"
            @change="onCategoryChange"
          >
            <view class="date-picker">
              <text class="date-text">{{
                newMaterial.category || "请选择类型"
              }}</text>
              <text class="date-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">尺寸/规格</text>
          <view class="form-control">
            <input
              class="form-input"
              v-model="newMaterial.spec"
              placeholder="例如：5寸 / 10寸珠光 / 18寸"
            />
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">单位</text>
          <view class="form-control">
            <input
              class="form-input"
              v-model="newMaterial.unit"
              placeholder="默认填写个"
            />
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">最低提醒数量</text>
          <view class="form-control">
            <input
              class="form-input"
              type="digit"
              v-model="newMaterial.minStock"
              placeholder="低库存提醒阈值"
            />
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-label">补货明细</text>

        <view class="form-item">
          <text class="form-label">补货数量</text>
          <view class="form-control">
            <input
              class="form-input"
              type="digit"
              v-model="form.quantity"
              placeholder="请输入补货数量"
            />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">成本单价</text>
          <view class="form-control">
            <input
              class="form-input"
              type="digit"
              v-model="form.unitPrice"
              placeholder="请输入本次补货成本单价"
            />
          </view>
        </view>

        <view class="form-item total-item">
          <text class="form-label">补货总额</text>
          <text class="total-value">{{ totalAmount }}</text>
        </view>

        <view class="form-item">
          <text class="form-label">补货日期</text>
          <picker mode="date" :value="form.purchaseDate" @change="onDateChange">
            <view class="date-picker">
              <text class="date-text">{{
                form.purchaseDate || "请选择日期"
              }}</text>
              <text class="date-arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea
            class="form-textarea"
            v-model="form.remark"
            placeholder="备注信息（选填）"
            maxlength="200"
          />
        </view>
      </view>

      <view class="submit-section">
        <view
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          @tap="submitPurchase"
        >
          <text class="submit-text">{{
            mode === "add" ? "保存并补货" : "确认补货"
          }}</text>
        </view>
      </view>
    </view>

    <view
      v-if="showMaterialPicker"
      class="picker-mask"
      @tap="showMaterialPicker = false"
    >
      <view class="picker-panel" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择气球</text>
          <text class="picker-close" @tap="showMaterialPicker = false">✕</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view v-if="materialList.length === 0" class="picker-empty">
            <text class="picker-empty-title">还没有可补货的气球</text>
            <text class="picker-empty-desc"
              >先新增一个气球，再回来录入补货信息</text
            >
            <view class="picker-empty-btn" @tap="goToAddMaterial">
              <text class="picker-empty-btn-text">去新增气球</text>
            </view>
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
              <text class="picker-item-meta">
                {{ item.category || "其他" }} · {{ item.spec || "未填写规格" }}
              </text>
            </view>
            <text class="picker-item-stock"
              >{{ item.stock }}{{ item.unit }}</text
            >
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { createPurchase } from "@/api/purchase";
import { createMaterial, getMaterialList } from "@/api/material";
import { formatMoney } from "@/utils/format";
import type { Material } from "@/api/material";

const mode = ref<"purchase" | "add" | "edit">("purchase");
const materialId = ref("");
const showMaterialPicker = ref(false);
const materialList = ref<Material[]>([]);
const selectedMaterial = ref<Material | null>(null);
const submitting = ref(false);
const topSpacing = ref(24);

const form = ref({
  quantity: "",
  unitPrice: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  remark: "",
});

const newMaterial = ref({
  name: "",
  category: "乳胶",
  spec: "",
  unit: "个",
  minStock: "",
});

const categoryOptions = ["乳胶", "铝膜", "其他"];
const categoryIndex = ref(0);

const totalAmount = computed(() => {
  const qty = parseFloat(form.value.quantity) || 0;
  const price = parseFloat(form.value.unitPrice) || 0;
  return formatMoney(qty * price);
});

const canSubmit = computed(() => {
  if (mode.value === "add" && !newMaterial.value.name) return false;
  if (!selectedMaterial.value && mode.value !== "add") return false;
  return (
    parseFloat(form.value.quantity) > 0 && parseFloat(form.value.unitPrice) > 0
  );
});

onMounted(async () => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as any;
  const options = page?.options || page?.$page?.options || {};

  mode.value = options.mode === "add" ? "add" : "purchase";
  materialId.value = options.materialId || "";

  try {
    const res = await getMaterialList({ pageSize: 200 });
    materialList.value = res.list;

    if (materialId.value) {
      const found = materialList.value.find((m) => m._id === materialId.value);
      if (found) selectedMaterial.value = found;
    }
  } catch (e) {
    console.error("加载物资列表失败", e);
  }
});

function onDateChange(e: any) {
  form.value.purchaseDate = e.detail.value;
}

function onCategoryChange(e: any) {
  categoryIndex.value = e.detail.value;
  newMaterial.value.category = categoryOptions[e.detail.value];
}

function selectMaterial(item: Material) {
  selectedMaterial.value = item;
  showMaterialPicker.value = false;
}

function openMaterialPicker() {
  showMaterialPicker.value = true;
}

function goToAddMaterial() {
  showMaterialPicker.value = false;
  uni.navigateTo({ url: "/pages/inventory/purchase?mode=add" });
}

async function submitPurchase() {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;

  try {
    let targetMaterialId = selectedMaterial.value?._id;

    if (mode.value === "add" && !targetMaterialId) {
      const newMat = await createMaterial({
        name: newMaterial.value.name,
        category: newMaterial.value.category,
        spec: newMaterial.value.spec,
        unit: newMaterial.value.unit,
        minStock: parseInt(newMaterial.value.minStock) || 0,
        image: "",
      });
      targetMaterialId = newMat._id;
    }

    if (!targetMaterialId) {
      uni.showToast({ title: "请选择气球", icon: "none" });
      return;
    }

    await createPurchase({
      materialId: targetMaterialId,
      quantity: parseFloat(form.value.quantity),
      unitPrice: parseFloat(form.value.unitPrice),
      purchaseDate: form.value.purchaseDate,
      remark: form.value.remark,
    });

    uni.showToast({
      title: mode.value === "add" ? "新增气球成功" : "补货成功",
      icon: "success",
    });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e) {
    const message = e instanceof Error ? e.message : "保存失败";
    uni.showToast({ title: message.slice(0, 20), icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.purchase-page {
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

.select-material {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 88rpx;
  padding: 0 20rpx;
  background: $bg-secondary;
  border: 1rpx solid #e2e8f0;
  border-radius: $radius-md;
  box-sizing: border-box;
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
  flex-direction: column;
  align-items: flex-start;
  min-height: 88rpx;
  padding: 18rpx 20rpx;
  gap: 8rpx;
  background: $bg-tertiary;
  border: 1rpx solid #cbd5e1;
  border-radius: $radius-md;
  box-sizing: border-box;
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
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 16rpx 20rpx;
  line-height: 1.6;
  background: $bg-secondary;
  border: 1rpx solid #e2e8f0;
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-base;
  box-sizing: border-box;
}

.total-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 88rpx;
  padding: 0 20rpx;
  background: $bg-tertiary;
  border-radius: $radius-md;
  box-sizing: border-box;
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
  min-height: 88rpx;
  padding: 0 20rpx;
  background: $bg-secondary;
  border: 1rpx solid #e2e8f0;
  border-radius: $radius-md;
  box-sizing: border-box;
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
  background: $primary;
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
  border-bottom: 1rpx solid #e2e8f0;
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

.picker-empty-btn {
  margin-top: 24rpx;
  padding: 16rpx 28rpx;
  border-radius: $radius-md;
  background: $primary;
}

.picker-empty-btn-text {
  font-size: $font-sm;
  color: #ffffff;
  font-weight: 600;
}

.picker-item-left {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.picker-item-name {
  font-size: $font-base;
  color: $text-primary;
}

.picker-item-meta {
  margin-top: 6rpx;
  font-size: $font-xs;
  color: $text-tertiary;
}

.picker-item-stock {
  font-size: $font-sm;
  color: $text-tertiary;
}
</style>

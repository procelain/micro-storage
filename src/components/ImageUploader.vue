<template>
  <view class="image-uploader">
    <view class="image-list">
      <view v-for="(img, index) in imageList" :key="index" class="image-item">
        <image :src="img" class="preview-img" mode="aspectFill" @tap="previewImage(img)" />
        <view class="remove-btn" @tap.stop="removeImage(index)">
          <text class="remove-icon">✕</text>
        </view>
      </view>
      <view v-if="imageList.length < maxCount" class="add-btn" @tap="chooseImage">
        <text class="add-icon">+</text>
        <text class="add-text">拍照</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { uploadFile } from '@/api/cloud'

const props = withDefaults(defineProps<{
  modelValue: string[]
  maxCount?: number
}>(), {
  maxCount: 9
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'upload': [fileIDs: string[]]
}>()

const imageList = ref<string[]>([...props.modelValue])

watch(() => props.modelValue, (val) => {
  imageList.value = [...val]
})

async function chooseImage() {
  try {
    const res = await uni.chooseMedia({
      count: props.maxCount - imageList.value.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed']
    })

    for (const file of res.tempFiles) {
      const cloudPath = `loss-images/${Date.now()}-${Math.random().toString(36).slice(2)}`
      try {
        const fileID = await uploadFile(cloudPath, file.tempFilePath)
        imageList.value.push(fileID)
      } catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    }

    emit('update:modelValue', imageList.value)
    emit('upload', imageList.value)
  } catch (e) {
    // 用户取消选择
  }
}

function removeImage(index: number) {
  imageList.value.splice(index, 1)
  emit('update:modelValue', imageList.value)
  emit('upload', imageList.value)
}

function previewImage(url: string) {
  uni.previewImage({
    current: url,
    urls: imageList.value
  })
}
</script>

<style lang="scss" scoped>
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  width: 160rpx;
  height: 160rpx;
  border-radius: $radius-md;
  overflow: hidden;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0 0 0 $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-icon {
  font-size: 20rpx;
  color: #fff;
}

.add-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: $radius-md;
  border: 2rpx dashed rgba(201, 169, 110, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.add-icon {
  font-size: 40rpx;
  color: $primary;
}

.add-text {
  font-size: $font-xs;
  color: $text-tertiary;
}
</style>

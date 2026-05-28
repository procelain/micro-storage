<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})
</script>

<style lang="scss">
@import './uni.scss';

page {
  background-color: $bg-primary;
  color: $text-primary;
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 26rpx;
  line-height: 1.6;
}

view, text, navigator {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  display: none;
}
</style>

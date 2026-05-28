// 云开发初始化与通用调用方法
const cloudInit = () => {
  // @ts-ignore
  if (typeof wx !== 'undefined' && wx.cloud) {
    // @ts-ignore
    wx.cloud.init({
      env: 'your-env-id', // 替换为实际环境ID
      traceUser: true
    })
  }
}

// 通用云函数调用方法
function callFunction<T = any>(name: string, action: string, data: Record<string, any> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    wx.cloud.callFunction({
      name,
      data: { action, data },
      success: (res: any) => {
        if (res.result && res.result.code === 0) {
          resolve(res.result.data)
        } else {
          reject(new Error(res.result?.message || '调用失败'))
        }
      },
      fail: (err: any) => {
        reject(new Error(err.errMsg || '云函数调用失败'))
      }
    })
  })
}

// 上传文件到云存储
function uploadFile(cloudPath: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res: any) => resolve(res.fileID),
      fail: (err: any) => reject(new Error(err.errMsg || '上传失败'))
    })
  })
}

// 删除云存储文件
function deleteFile(fileIDs: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    wx.cloud.deleteFile({
      fileList: fileIDs,
      success: () => resolve(),
      fail: (err: any) => reject(new Error(err.errMsg || '删除失败'))
    })
  })
}

// 获取云存储文件临时链接
function getTempFileURL(fileIDs: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    wx.cloud.getTempFileURL({
      fileList: fileIDs,
      success: (res: any) => {
        const urls = res.fileList.map((f: any) => f.tempFileURL)
        resolve(urls)
      },
      fail: (err: any) => reject(new Error(err.errMsg || '获取链接失败'))
    })
  })
}

export { cloudInit, callFunction, uploadFile, deleteFile, getTempFileURL }

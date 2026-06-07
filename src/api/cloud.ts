const CLOUD_ENV_ID = 'cloudbase-d8ga54epx854dd481'

let wxCloudInited = false
let unsupportedWarned = false

type CloudRuntime =
  | { type: 'uniCloud'; api: any }
  | { type: 'wxCloud'; api: any }

function getCloudRuntime(): CloudRuntime | null {
  const runtime = globalThis as any
  const uniCloudApi = runtime.uniCloud

  if (uniCloudApi?.callFunction) {
    return { type: 'uniCloud', api: uniCloudApi }
  }

  const wxCloudApi = runtime.wx?.cloud

  if (wxCloudApi?.init && !wxCloudInited) {
    wxCloudApi.init({
      env: CLOUD_ENV_ID,
      traceUser: true
    })
    wxCloudInited = true
  }

  if (wxCloudApi?.callFunction) {
    return { type: 'wxCloud', api: wxCloudApi }
  }

  return null
}

function cloudInit() {
  getCloudRuntime()
}

function callFunction<T = any>(name: string, action: string, data: Record<string, any> = {}): Promise<T> {
  const runtime = getCloudRuntime()

  if (!runtime) {
    const fallback = getReadFallback(name, action, data)
    if (fallback.available) {
      warnUnsupportedOnce()
      return Promise.resolve(fallback.data as T)
    }

    return Promise.reject(new Error('当前环境未初始化云能力，请在微信小程序或可用的 uniCloud 环境中运行'))
  }

  const payload = { name, data: { action, data } }

  if (runtime.type === 'uniCloud') {
    return Promise.resolve(runtime.api.callFunction(payload)).then((res: any) => {
      if (res.result && res.result.code === 0) {
        return res.result.data as T
      }
      throw new Error(res.result?.message || '调用失败')
    })
  }

  return new Promise((resolve, reject) => {
    runtime.api.callFunction({
      ...payload,
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

function uploadFile(cloudPath: string, filePath: string): Promise<string> {
  const runtime = getCloudRuntime()

  if (!runtime?.api?.uploadFile) {
    return Promise.reject(new Error('当前环境不支持上传文件'))
  }

  if (runtime.type === 'uniCloud') {
    return Promise.resolve(runtime.api.uploadFile({ cloudPath, filePath })).then((res: any) => {
      return res.fileID || res.tempFilePaths?.[0] || ''
    })
  }

  return new Promise((resolve, reject) => {
    runtime.api.uploadFile({
      cloudPath,
      filePath,
      success: (res: any) => resolve(res.fileID),
      fail: (err: any) => reject(new Error(err.errMsg || '上传失败'))
    })
  })
}

function deleteFile(fileIDs: string[]): Promise<void> {
  const runtime = getCloudRuntime()

  if (!runtime?.api?.deleteFile) {
    return Promise.reject(new Error('当前环境不支持删除文件'))
  }

  if (runtime.type === 'uniCloud') {
    return Promise.resolve(runtime.api.deleteFile({ fileList: fileIDs })).then(() => undefined)
  }

  return new Promise((resolve, reject) => {
    runtime.api.deleteFile({
      fileList: fileIDs,
      success: () => resolve(),
      fail: (err: any) => reject(new Error(err.errMsg || '删除失败'))
    })
  })
}

function getTempFileURL(fileIDs: string[]): Promise<string[]> {
  const runtime = getCloudRuntime()

  if (!runtime?.api?.getTempFileURL) {
    return Promise.reject(new Error('当前环境不支持获取文件链接'))
  }

  if (runtime.type === 'uniCloud') {
    return Promise.resolve(runtime.api.getTempFileURL({ fileList: fileIDs })).then((res: any) => {
      return (res.fileList || []).map((file: any) => file.tempFileURL)
    })
  }

  return new Promise((resolve, reject) => {
    runtime.api.getTempFileURL({
      fileList: fileIDs,
      success: (res: any) => {
        const urls = res.fileList.map((f: any) => f.tempFileURL)
        resolve(urls)
      },
      fail: (err: any) => reject(new Error(err.errMsg || '获取链接失败'))
    })
  })
}

function warnUnsupportedOnce() {
  if (unsupportedWarned) {
    return
  }

  unsupportedWarned = true
  console.warn('[cloud] 当前环境未检测到云能力，读接口已使用空数据兜底。写操作仍需要在可用云环境中执行。')
}

function getReadFallback(name: string, action: string, data: Record<string, any>) {
  const page = data.page || 1
  const pageSize = data.pageSize || 20

  const fallbackMap: Record<string, any> = {
    'dashboardService:overview': {
      totalPurchase: 0,
      totalLossCost: 0,
      lowStockCount: 0,
      slowCount: 0
    },
    'dashboardService:stockTrend': [],
    'dashboardService:topLossMaterials': [],
    'dashboardService:alerts': {
      lowStockCount: 0,
      slowCount: 0,
      lowStockItems: [],
      slowItems: []
    },
    'materialService:list': { list: [], total: 0, page, pageSize },
    'materialService:detail': {
      _id: data.id || '',
      name: '',
      category: '其他',
      spec: '',
      unit: '个',
      stock: 0,
      avgPrice: 0,
      minStock: 0,
      image: '',
      isSlow: false,
      lastUsedDate: null,
      createdAt: '',
      updatedAt: ''
    },
    'purchaseService:list': { list: [], total: 0 },
    'purchaseService:stats': { count: 0, totalAmount: 0 },
    'banquetService:list': { list: [], total: 0 },
    'banquetService:detail': {
      _id: data.id || '',
      eventDate: '',
      venue: '',
      status: '筹备中',
      remark: '',
      lossRecords: [],
      createdAt: '',
      updatedAt: ''
    },
    'lossService:list': { list: [], total: 0 },
    'lossService:banquetSummary': {
      totalConsumed: 0,
      totalDamaged: 0,
      totalCost: 0,
      items: []
    },
    'lossService:topDamaged': []
  }

  const key = `${name}:${action}`
  return {
    available: Object.prototype.hasOwnProperty.call(fallbackMap, key),
    data: fallbackMap[key]
  }
}

export { cloudInit, callFunction, uploadFile, deleteFile, getTempFileURL }

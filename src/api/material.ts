import { callFunction } from './cloud'

// 物资相关接口类型
export interface Material {
  _id: string
  name: string
  category: string
  spec: string
  unit: string
  stock: number
  avgPrice: number
  minStock: number
  image: string
  isSlow: boolean
  lastUsedDate: string | null
  createdAt: string
  updatedAt: string
}

export interface MaterialListParams {
  keyword?: string
  category?: string
  alertType?: 'lowStock' | 'slow'
  page?: number
  pageSize?: number
}

// 物资列表
export function getMaterialList(params: MaterialListParams = {}) {
  return callFunction<{ list: Material[]; total: number; page: number; pageSize: number }>(
    'materialService', 'list', params
  )
}

// 物资详情
export function getMaterialDetail(id: string) {
  return callFunction<Material>('materialService', 'detail', { id })
}

// 创建物资
export function createMaterial(data: Omit<Material, '_id' | 'stock' | 'avgPrice' | 'isSlow' | 'lastUsedDate' | 'createdAt' | 'updatedAt'>) {
  return callFunction<Material>('materialService', 'create', data)
}

// 更新物资
export function updateMaterial(data: Partial<Material> & { id: string }) {
  return callFunction<null>('materialService', 'update', data)
}

// 删除物资
export function deleteMaterial(id: string) {
  return callFunction<null>('materialService', 'delete', { id })
}

// 更新库存
export function updateMaterialStock(id: string, delta: number) {
  return callFunction<null>('materialService', 'updateStock', { id, delta })
}

// 重新计算加权均价
export function recalcAvgPrice(materialId: string) {
  return callFunction<{ avgPrice: number }>('materialService', 'recalcAvgPrice', { materialId })
}

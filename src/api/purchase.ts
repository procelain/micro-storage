import { callFunction } from './cloud'

export interface Purchase {
  _id: string
  materialId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  supplierId: string
  purchaseDate: string
  remark: string
  createdAt: string
}

export interface PurchaseListParams {
  materialId?: string
  supplierId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// 进货列表
export function getPurchaseList(params: PurchaseListParams = {}) {
  return callFunction<{ list: Purchase[]; total: number }>('purchaseService', 'list', params)
}

// 创建进货记录
export function createPurchase(data: {
  materialId: string
  quantity: number
  unitPrice: number
  supplierId?: string
  purchaseDate?: string
  remark?: string
}) {
  return callFunction<Purchase>('purchaseService', 'create', data)
}

// 删除进货记录
export function deletePurchase(id: string) {
  return callFunction<null>('purchaseService', 'delete', { id })
}

// 进货统计
export function getPurchaseStats(params: { startDate?: string; endDate?: string } = {}) {
  return callFunction<{ count: number; totalAmount: number }>('purchaseService', 'stats', params)
}

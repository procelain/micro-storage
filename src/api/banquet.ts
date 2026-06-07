import { callFunction } from './cloud'

export interface Banquet {
  _id: string
  eventDate: string
  venue: string
  status: '筹备中' | '进行中' | '已完成' | '已结算'
  remark: string
  lossRecords?: LossRecord[]
  createdAt: string
  updatedAt: string
}

export interface LossRecord {
  _id: string
  banquetId: string
  materialId: string
  materialName: string
  consumedQty: number
  damagedQty: number
  costAmount: number
  damagedImages: string[]
  remark: string
  recordDate: string
  createdAt: string
}

export interface BanquetListParams {
  status?: string
  keyword?: string
  page?: number
  pageSize?: number
}

// 宴会列表
export function getBanquetList(params: BanquetListParams = {}) {
  return callFunction<{ list: Banquet[]; total: number }>('banquetService', 'list', params)
}

// 宴会详情
export function getBanquetDetail(id: string) {
  return callFunction<Banquet>('banquetService', 'detail', { id })
}

// 创建宴会
export function createBanquet(data: {
  eventDate: string
  venue?: string
  remark?: string
}) {
  return callFunction<Banquet>('banquetService', 'create', data)
}

// 更新宴会
export function updateBanquet(data: Partial<Banquet> & { id: string }) {
  return callFunction<null>('banquetService', 'update', data)
}

// 删除宴会
export function deleteBanquet(id: string) {
  return callFunction<null>('banquetService', 'delete', { id })
}

// 更新宴会状态
export function updateBanquetStatus(id: string, status: string) {
  return callFunction<null>('banquetService', 'updateStatus', { id, status })
}

// 损耗列表
export function getLossList(params: { banquetId?: string; materialId?: string; page?: number; pageSize?: number } = {}) {
  return callFunction<{ list: LossRecord[]; total: number }>('lossService', 'list', params)
}

// 创建损耗记录
export function createLossRecord(data: {
  banquetId: string
  materialId: string
  consumedQty?: number
  damagedQty?: number
  damagedImages?: string[]
  remark?: string
}) {
  return callFunction<LossRecord>('lossService', 'create', data)
}

// 删除损耗记录
export function deleteLossRecord(id: string) {
  return callFunction<null>('lossService', 'delete', { id })
}

// 宴会损耗汇总
export function getBanquetLossSummary(banquetId: string) {
  return callFunction<{
    totalConsumed: number
    totalDamaged: number
    totalCost: number
    items: Array<{
      materialId: string
      materialName: string
      consumedQty: number
      damagedQty: number
      costAmount: number
    }>
  }>('lossService', 'banquetSummary', { banquetId })
}

// 高损耗物资TOP
export function getTopLossMaterials(limit: number = 10) {
  return callFunction<Array<{
    materialId: string
    materialName: string
    totalCost: number
    totalDamaged: number
  }>>('lossService', 'topDamaged', { limit })
}

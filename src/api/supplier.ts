import { callFunction } from './cloud'

export interface Supplier {
  _id: string
  name: string
  contact: string
  phone: string
  address: string
  mainCategory: string
  createdAt: string
}

// 供应商列表
export function getSupplierList() {
  return callFunction<Supplier[]>('supplierService', 'list')
}

// 创建供应商
export function createSupplier(data: Omit<Supplier, '_id' | 'createdAt'>) {
  return callFunction<Supplier>('supplierService', 'create', data)
}

// 更新供应商
export function updateSupplier(data: Partial<Supplier> & { id: string }) {
  return callFunction<null>('supplierService', 'update', data)
}

// 删除供应商
export function deleteSupplier(id: string) {
  return callFunction<null>('supplierService', 'delete', { id })
}

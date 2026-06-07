import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Banquet, LossRecord } from '@/api/banquet'
import { getBanquetList, getBanquetDetail, createBanquet, updateBanquet, deleteBanquet, updateBanquetStatus, createLossRecord, deleteLossRecord, getBanquetLossSummary } from '@/api/banquet'

export const useBanquetStore = defineStore('banquet', () => {
  // 状态
  const list = ref<Banquet[]>([])
  const current = ref<Banquet | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const filters = ref({
    status: '',
    keyword: '',
    page: 1,
    pageSize: 20
  })

  // 加载宴会列表
  async function fetchList(params?: { status?: string; keyword?: string; page?: number; pageSize?: number }) {
    loading.value = true
    try {
      const queryParams = { ...filters.value, ...params }
      const result = await getBanquetList(queryParams)
      list.value = result.list
      total.value = result.total
      return result
    } finally {
      loading.value = false
    }
  }

  // 加载宴会详情
  async function fetchDetail(id: string) {
    loading.value = true
    try {
      const result = await getBanquetDetail(id)
      current.value = result
      return result
    } finally {
      loading.value = false
    }
  }

  // 创建宴会
  async function add(data: { eventDate: string; venue?: string; remark?: string }) {
    const result = await createBanquet(data)
    await fetchList()
    return result
  }

  // 更新宴会
  async function edit(data: Partial<Banquet> & { id: string }) {
    const result = await updateBanquet(data)
    await fetchList()
    return result
  }

  // 删除宴会
  async function remove(id: string) {
    const result = await deleteBanquet(id)
    await fetchList()
    return result
  }

  // 更新状态
  async function setStatus(id: string, status: string) {
    const result = await updateBanquetStatus(id, status)
    if (current.value && current.value._id === id) {
      current.value.status = status as Banquet['status']
    }
    return result
  }

  // 添加损耗记录
  async function addLossRecord(data: {
    banquetId: string
    materialId: string
    consumedQty?: number
    damagedQty?: number
    damagedImages?: string[]
    remark?: string
  }) {
    const result = await createLossRecord(data)
    await fetchDetail(data.banquetId)
    return result
  }

  // 删除损耗记录
  async function removeLossRecord(id: string, banquetId: string) {
    const result = await deleteLossRecord(id)
    await fetchDetail(banquetId)
    return result
  }

  // 获取损耗汇总
  async function fetchLossSummary(banquetId: string) {
    return await getBanquetLossSummary(banquetId)
  }

  // 设置筛选条件
  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    list, current, total, loading, filters,
    fetchList, fetchDetail, add, edit, remove,
    setStatus, addLossRecord, removeLossRecord, fetchLossSummary, setFilters
  }
})

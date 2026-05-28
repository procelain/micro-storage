import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Material } from '@/api/material'
import { getMaterialList, getMaterialDetail, createMaterial, updateMaterial, deleteMaterial } from '@/api/material'

export const useMaterialStore = defineStore('material', () => {
  // 状态
  const list = ref<Material[]>([])
  const current = ref<Material | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const filters = ref({
    keyword: '',
    category: '',
    alertType: '' as '' | 'lowStock' | 'slow',
    page: 1,
    pageSize: 50
  })

  // 加载物资列表
  async function fetchList(params?: { keyword?: string; category?: string; alertType?: 'lowStock' | 'slow'; page?: number; pageSize?: number }) {
    loading.value = true
    try {
      const queryParams = { ...filters.value, ...params }
      const result = await getMaterialList(queryParams)
      list.value = result.list
      total.value = result.total
      return result
    } finally {
      loading.value = false
    }
  }

  // 加载物资详情
  async function fetchDetail(id: string) {
    loading.value = true
    try {
      const result = await getMaterialDetail(id)
      current.value = result
      return result
    } finally {
      loading.value = false
    }
  }

  // 创建物资
  async function add(data: Omit<Material, '_id' | 'stock' | 'avgPrice' | 'isSlow' | 'lastUsedDate' | 'createdAt' | 'updatedAt'>) {
    const result = await createMaterial(data)
    await fetchList()
    return result
  }

  // 更新物资
  async function edit(data: Partial<Material> & { id: string }) {
    const result = await updateMaterial(data)
    await fetchList()
    return result
  }

  // 删除物资
  async function remove(id: string) {
    const result = await deleteMaterial(id)
    await fetchList()
    return result
  }

  // 设置筛选条件
  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    list, current, total, loading, filters,
    fetchList, fetchDetail, add, edit, remove, setFilters
  }
})

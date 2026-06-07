// 物资服务 - 物资CRUD、库存更新、加权均价计算
const { cloud, db, _, success, fail, queryWithPage } = require('./shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list':
      return await listMaterials(data)
    case 'detail':
      return await getDetail(data)
    case 'create':
      return await createMaterial(data)
    case 'update':
      return await updateMaterial(data)
    case 'delete':
      return await deleteMaterial(data)
    case 'updateStock':
      return await updateStock(data)
    case 'recalcAvgPrice':
      return await recalcAvgPrice(data)
    default:
      return fail('未知操作')
  }
}

function isMissingCollectionError(error) {
  const message = error?.message || error?.errMsg || ''
  return error?.errCode === -502005
    || message.includes('database collection not exists')
    || message.includes('Db or Table not exist')
}

async function ensureMaterialsCollection() {
  try {
    await db.createCollection('materials')
  } catch (e) {}
}

// 物资列表（支持搜索、分类筛选、预警筛选）
async function listMaterials(data = {}) {
  const { keyword, category, alertType, page = 1, pageSize = 50 } = data
  const where = {}

  if (keyword) {
    where.name = db.RegExp({ regexp: keyword, options: 'i' })
  }
  if (category) {
    where.category = category
  }
  if (alertType === 'lowStock') {
    where.stock = _.lte(_.fieldRef('minStock'))
  }
  if (alertType === 'slow') {
    where.isSlow = true
  }

  try {
    return success(await queryWithPage('materials', where, { page, pageSize, orderBy: 'createdAt', order: 'desc' }))
  } catch (e) {
    if (isMissingCollectionError(e)) {
      await ensureMaterialsCollection()
      return success({ list: [], total: 0, page, pageSize, totalPages: 0 })
    }
    throw e
  }
}

// 物资详情
async function getDetail(data) {
  const { id } = data
  if (!id) return fail('缺少物资ID')
  try {
    const res = await db.collection('materials').doc(id).get()
    return success(res.data)
  } catch (e) {
    if (isMissingCollectionError(e)) {
      await ensureMaterialsCollection()
      return fail('物资档案尚未初始化，请先新增气球')
    }
    throw e
  }
}

// 创建物资
async function createMaterial(data) {
  const { name, category, spec, unit, minStock = 0, image = '' } = data
  if (!name) return fail('物资名称不能为空')

  const material = {
    name,
    category: category || '其他',
    spec: spec || '',
    unit: unit || '个',
    stock: 0,
    avgPrice: 0,
    minStock,
    image,
    isSlow: false,
    lastUsedDate: null,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  try {
    const res = await db.collection('materials').add({ data: material })
    return success({ _id: res._id, ...material })
  } catch (e) {
    if (isMissingCollectionError(e)) {
      await ensureMaterialsCollection()
      const res = await db.collection('materials').add({ data: material })
      return success({ _id: res._id, ...material })
    }
    throw e
  }
}

// 更新物资
async function updateMaterial(data) {
  const { id, ...updateData } = data
  if (!id) return fail('缺少物资ID')

  const fields = {}
  const allowedFields = ['name', 'category', 'spec', 'unit', 'minStock', 'image', 'isSlow', 'lastUsedDate']
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      fields[field] = updateData[field]
    }
  }
  fields.updatedAt = db.serverDate()

  await db.collection('materials').doc(id).update({ data: fields })
  return success(null, '更新成功')
}

// 删除物资
async function deleteMaterial(data) {
  const { id } = data
  if (!id) return fail('缺少物资ID')
  await db.collection('materials').doc(id).remove()
  return success(null, '删除成功')
}

// 更新库存数量
async function updateStock(data) {
  const { id, delta } = data
  if (!id || delta === undefined) return fail('参数不完整')

  await db.collection('materials').doc(id).update({
    data: {
      stock: _.inc(delta),
      updatedAt: db.serverDate()
    }
  })
  return success(null, '库存已更新')
}

// 重新计算加权均价
async function recalcAvgPrice(data) {
  const { materialId } = data
  if (!materialId) return fail('缺少物资ID')

  // 获取该物资所有进货记录
  const purchases = await db.collection('purchases')
    .where({ materialId })
    .orderBy('purchaseDate', 'asc')
    .limit(1000)
    .get()

  if (purchases.data.length === 0) {
    await db.collection('materials').doc(materialId).update({
      data: { avgPrice: 0, updatedAt: db.serverDate() }
    })
    return success({ avgPrice: 0 })
  }

  // 加权平均计算
  let totalQuantity = 0
  let totalAmount = 0
  for (const p of purchases.data) {
    totalQuantity += p.quantity
    totalAmount += p.quantity * p.unitPrice
  }

  const avgPrice = totalQuantity > 0 ? Math.round((totalAmount / totalQuantity) * 100) / 100 : 0

  await db.collection('materials').doc(materialId).update({
    data: { avgPrice, updatedAt: db.serverDate() }
  })

  return success({ avgPrice })
}

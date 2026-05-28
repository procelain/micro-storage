// 进货服务 - 进货录入、自动更新库存
const { cloud, db, _, success, fail, queryWithPage } = require('../shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list':
      return await listPurchases(data)
    case 'create':
      return await createPurchase(data)
    case 'delete':
      return await deletePurchase(data)
    case 'stats':
      return await purchaseStats(data)
    default:
      return fail('未知操作')
  }
}

// 进货列表
async function listPurchases(data = {}) {
  const { materialId, supplierId, startDate, endDate, page = 1, pageSize = 20 } = data
  const where = {}

  if (materialId) where.materialId = materialId
  if (supplierId) where.supplierId = supplierId
  if (startDate || endDate) {
    where.purchaseDate = {}
    if (startDate) where.purchaseDate = _.gte(new Date(startDate))
    if (endDate) where.purchaseDate = _.lte(new Date(endDate))
  }

  return success(await queryWithPage('purchases', where, { page, pageSize, orderBy: 'purchaseDate', order: 'desc' }))
}

// 创建进货记录（事务：写入进货记录 + 更新库存 + 重新计算均价）
async function createPurchase(data) {
  const { materialId, quantity, unitPrice, supplierId, purchaseDate, remark = '' } = data
  if (!materialId || !quantity || !unitPrice) return fail('参数不完整')

  const totalAmount = Math.round(quantity * unitPrice * 100) / 100

  // 1. 写入进货记录
  const purchase = {
    materialId,
    quantity,
    unitPrice,
    totalAmount,
    supplierId: supplierId || '',
    purchaseDate: purchaseDate ? new Date(purchaseDate) : db.serverDate(),
    remark,
    createdAt: db.serverDate()
  }

  const res = await db.collection('purchases').add({ data: purchase })

  // 2. 更新库存数量
  await db.collection('materials').doc(materialId).update({
    data: {
      stock: _.inc(quantity),
      updatedAt: db.serverDate()
    }
  })

  // 3. 重新计算加权均价
  const materialDoc = await db.collection('materials').doc(materialId).get()
  const material = materialDoc.data
  const newStock = material.stock + quantity  // 注意：此时stock已更新
  const newAvgPrice = newStock > 0
    ? Math.round(((material.avgPrice * (newStock - quantity) + quantity * unitPrice) / newStock) * 100) / 100
    : unitPrice

  await db.collection('materials').doc(materialId).update({
    data: { avgPrice: newAvgPrice }
  })

  return success({ _id: res._id, ...purchase }, '进货录入成功')
}

// 删除进货记录（回退库存）
async function deletePurchase(data) {
  const { id } = data
  if (!id) return fail('缺少进货记录ID')

  const purchaseDoc = await db.collection('purchases').doc(id).get()
  const purchase = purchaseDoc.data

  // 回退库存
  await db.collection('materials').doc(purchase.materialId).update({
    data: {
      stock: _.inc(-purchase.quantity),
      updatedAt: db.serverDate()
    }
  })

  // 删除记录
  await db.collection('purchases').doc(id).remove()
  return success(null, '已删除并回退库存')
}

// 进货统计
async function purchaseStats(data = {}) {
  const { startDate, endDate } = data
  const where = {}
  if (startDate) where.purchaseDate = _.gte(new Date(startDate))
  if (endDate) where.purchaseDate = _.lte(new Date(endDate))

  const res = await db.collection('purchases').where(where).get()
  const totalAmount = res.data.reduce((sum, p) => sum + p.totalAmount, 0)

  return success({
    count: res.data.length,
    totalAmount: Math.round(totalAmount * 100) / 100
  })
}

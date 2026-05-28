// 损耗服务 - 损耗录入、扣减库存、图文上传
const { cloud, db, _, success, fail } = require('../shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list':
      return await listLosses(data)
    case 'create':
      return await createLoss(data)
    case 'delete':
      return await deleteLoss(data)
    case 'banquetSummary':
      return await banquetSummary(data)
    case 'topDamaged':
      return await topDamaged(data)
    default:
      return fail('未知操作')
  }
}

// 损耗列表
async function listLosses(data = {}) {
  const { banquetId, materialId, page = 1, pageSize = 20 } = data
  const where = {}
  if (banquetId) where.banquetId = banquetId
  if (materialId) where.materialId = materialId

  const totalRes = await db.collection('loss_records').where(where).count()
  const listRes = await db.collection('loss_records')
    .where(where)
    .orderBy('recordDate', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return success({
    list: listRes.data,
    total: totalRes.total,
    page,
    pageSize
  })
}

// 创建损耗记录（事务：写入记录 + 扣减库存 + 更新宴会成本 + 更新物资最近使用日期）
async function createLoss(data) {
  const { banquetId, materialId, consumedQty = 0, damagedQty = 0, damagedImages = [], remark = '' } = data
  if (!banquetId || !materialId) return fail('宴会ID和物资ID不能为空')
  if (consumedQty === 0 && damagedQty === 0) return fail('消耗或损坏数量至少填一项')

  const totalQty = consumedQty + damagedQty

  // 1. 获取物资信息（用于计算成本）
  const materialDoc = await db.collection('materials').doc(materialId).get()
  const material = materialDoc.data

  const costAmount = Math.round(totalQty * material.avgPrice * 100) / 100

  // 2. 写入损耗记录
  const lossRecord = {
    banquetId,
    materialId,
    materialName: material.name,
    consumedQty,
    damagedQty,
    costAmount,
    damagedImages,
    remark,
    recordDate: db.serverDate(),
    createdAt: db.serverDate()
  }

  const res = await db.collection('loss_records').add({ data: lossRecord })

  // 3. 扣减库存
  await db.collection('materials').doc(materialId).update({
    data: {
      stock: _.inc(-totalQty),
      lastUsedDate: db.serverDate(),
      isSlow: false,  // 有消耗则取消滞销标记
      updatedAt: db.serverDate()
    }
  })

  // 4. 更新宴会总成本
  await db.collection('banquets').doc(banquetId).update({
    data: {
      totalCost: _.inc(costAmount),
      updatedAt: db.serverDate()
    }
  })

  return success({ _id: res._id, ...lossRecord }, '损耗记录已添加')
}

// 删除损耗记录（回退库存和成本）
async function deleteLoss(data) {
  const { id } = data
  if (!id) return fail('缺少损耗记录ID')

  const lossDoc = await db.collection('loss_records').doc(id).get()
  const loss = lossDoc.data
  const totalQty = loss.consumedQty + loss.damagedQty

  // 回退库存
  await db.collection('materials').doc(loss.materialId).update({
    data: { stock: _.inc(totalQty), updatedAt: db.serverDate() }
  })

  // 回退宴会成本
  await db.collection('banquets').doc(loss.banquetId).update({
    data: { totalCost: _.inc(-loss.costAmount), updatedAt: db.serverDate() }
  })

  // 删除记录
  await db.collection('loss_records').doc(id).remove()
  return success(null, '已删除并回退')
}

// 单场宴会损耗汇总
async function banquetSummary(data) {
  const { banquetId } = data
  if (!banquetId) return fail('缺少宴会ID')

  const losses = await db.collection('loss_records')
    .where({ banquetId })
    .get()

  const summary = {
    totalConsumed: 0,
    totalDamaged: 0,
    totalCost: 0,
    items: []
  }

  // 按物资汇总
  const materialMap = {}
  for (const loss of losses.data) {
    if (!materialMap[loss.materialId]) {
      materialMap[loss.materialId] = {
        materialId: loss.materialId,
        materialName: loss.materialName,
        consumedQty: 0,
        damagedQty: 0,
        costAmount: 0
      }
    }
    materialMap[loss.materialId].consumedQty += loss.consumedQty
    materialMap[loss.materialId].damagedQty += loss.damagedQty
    materialMap[loss.materialId].costAmount += loss.costAmount
    summary.totalConsumed += loss.consumedQty
    summary.totalDamaged += loss.damagedQty
    summary.totalCost += loss.costAmount
  }

  summary.items = Object.values(materialMap)
  summary.totalCost = Math.round(summary.totalCost * 100) / 100

  return success(summary)
}

// 高损耗物资TOP N
async function topDamaged(data = {}) {
  const { limit = 10, startDate, endDate } = data
  const where = {}

  if (startDate || endDate) {
    where.recordDate = {}
    if (startDate) where.recordDate = _.gte(new Date(startDate))
    if (endDate) where.recordDate = _.lte(new Date(endDate))
  }

  const losses = await db.collection('loss_records').where(where).get()

  // 按物资汇总损耗金额
  const materialMap = {}
  for (const loss of losses.data) {
    if (!materialMap[loss.materialId]) {
      materialMap[loss.materialId] = {
        materialId: loss.materialId,
        materialName: loss.materialName,
        totalDamaged: 0,
        totalConsumed: 0,
        totalCost: 0
      }
    }
    materialMap[loss.materialId].totalDamaged += loss.damagedQty
    materialMap[loss.materialId].totalConsumed += loss.consumedQty
    materialMap[loss.materialId].totalCost += loss.costAmount
  }

  const sorted = Object.values(materialMap)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit)
    .map(item => ({ ...item, totalCost: Math.round(item.totalCost * 100) / 100 }))

  return success(sorted)
}

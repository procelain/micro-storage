// 看板服务 - 数据聚合、库存趋势、预警统计
const { cloud, db, _, success, fail, daysAgo, monthStart } = require('../shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'overview':
      return await dashboardOverview(data)
    case 'stockTrend':
      return await stockTrend(data)
    case 'topLossMaterials':
      return await topLossMaterials(data)
    case 'alerts':
      return await alertSummary(data)
    default:
      return fail('未知操作')
  }
}

// 看板总览
async function dashboardOverview(data = {}) {
  const now = new Date()
  const startOfMonth = monthStart()

  // 本月进货总额
  const purchases = await db.collection('purchases')
    .where({ purchaseDate: _.gte(startOfMonth) })
    .get()
  const totalPurchase = purchases.data.reduce((sum, p) => sum + p.totalAmount, 0)

  // 本月宴会收入
  const banquets = await db.collection('banquets')
    .where({ eventDate: _.gte(startOfMonth), status: '已结算' })
    .get()
  const totalRevenue = banquets.data.reduce((sum, b) => sum + (b.actualRevenue || 0), 0)

  // 本月损耗成本
  const losses = await db.collection('loss_records')
    .where({ recordDate: _.gte(startOfMonth) })
    .get()
  const totalLossCost = losses.data.reduce((sum, l) => sum + (l.costAmount || 0), 0)

  // 低库存数量
  const lowStockCount = (await db.collection('materials')
    .where({ stock: _.lte(0) })
    .count()).total

  // 滞销数量
  const slowCount = (await db.collection('materials')
    .where({ isSlow: true })
    .count()).total

  return success({
    totalPurchase: Math.round(totalPurchase * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalLossCost: Math.round(totalLossCost * 100) / 100,
    netProfit: Math.round((totalRevenue - totalPurchase - totalLossCost) * 100) / 100,
    lowStockCount,
    slowCount
  })
}

// 库存趋势（近30天每日库存总量）
async function stockTrend(data = {}) {
  const { days = 30 } = data
  const result = []

  // 获取所有物资
  const materials = await db.collection('materials').limit(1000).get()
  const currentTotal = materials.data.reduce((sum, m) => sum + (m.stock || 0), 0)

  // 获取近N天进货数据
  const startDate = daysAgo(days)
  const purchases = await db.collection('purchases')
    .where({ purchaseDate: _.gte(startDate) })
    .orderBy('purchaseDate', 'asc')
    .get()

  // 获取近N天损耗数据
  const losses = await db.collection('loss_records')
    .where({ recordDate: _.gte(startDate) })
    .orderBy('recordDate', 'asc')
    .get()

  // 按日期汇总
  const dailyData = {}
  for (let i = days; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dailyData[key] = { purchase: 0, loss: 0 }
  }

  for (const p of purchases.data) {
    const d = new Date(p.purchaseDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (dailyData[key]) dailyData[key].purchase += p.quantity
  }

  for (const l of losses.data) {
    const d = new Date(l.recordDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (dailyData[key]) dailyData[key].loss += (l.consumedQty + l.damagedQty)
  }

  // 从当前总量反推每天总量
  let stock = currentTotal
  const dates = Object.keys(dailyData).reverse()
  const dayValues = {}

  for (const date of dates) {
    dayValues[date] = stock
    stock -= (dailyData[date]?.purchase || 0)
    stock += (dailyData[date]?.loss || 0)
  }

  for (const date of Object.keys(dailyData)) {
    result.push({
      date,
      totalStock: Math.max(0, dayValues[date] || 0)
    })
  }

  return success(result)
}

// 高损耗物资TOP10
async function topLossMaterials(data = {}) {
  const { limit = 10 } = data
  const losses = await db.collection('loss_records').limit(1000).get()

  const materialMap = {}
  for (const loss of losses.data) {
    if (!materialMap[loss.materialId]) {
      materialMap[loss.materialId] = {
        materialId: loss.materialId,
        materialName: loss.materialName,
        totalCost: 0,
        totalDamaged: 0
      }
    }
    materialMap[loss.materialId].totalCost += loss.costAmount || 0
    materialMap[loss.materialId].totalDamaged += loss.damagedQty || 0
  }

  const sorted = Object.values(materialMap)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit)
    .map(item => ({ ...item, totalCost: Math.round(item.totalCost * 100) / 100 }))

  return success(sorted)
}

// 预警摘要
async function alertSummary(data = {}) {
  // 低库存物资
  const materials = await db.collection('materials').limit(1000).get()
  const lowStockItems = materials.data.filter(m => m.stock <= m.minStock && m.minStock > 0)

  // 滞销物资
  const slowItems = materials.data.filter(m => m.isSlow === true)

  return success({
    lowStockCount: lowStockItems.length,
    slowCount: slowItems.length,
    lowStockItems: lowStockItems.slice(0, 10).map(m => ({
      _id: m._id,
      name: m.name,
      stock: m.stock,
      minStock: m.minStock
    })),
    slowItems: slowItems.slice(0, 10).map(m => ({
      _id: m._id,
      name: m.name,
      stock: m.stock,
      lastUsedDate: m.lastUsedDate
    }))
  })
}

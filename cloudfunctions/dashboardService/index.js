// 看板服务 - 数据聚合、库存趋势、预警统计
const { cloud, db, _, success, fail, daysAgo, monthStart } = require('./shared/utils')

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

function isMissingCollectionError(error) {
  const message = error?.message || error?.errMsg || ''
  return error?.errCode === -502005
    || message.includes('database collection not exists')
    || message.includes('Db or Table not exist')
}

// 看板总览
async function dashboardOverview(data = {}) {
  try {
    const startOfMonth = monthStart()

    const purchases = await db.collection('purchases')
      .where({ purchaseDate: _.gte(startOfMonth) })
      .get()
    const totalPurchase = purchases.data.reduce((sum, p) => sum + p.totalAmount, 0)

    const losses = await db.collection('loss_records')
      .where({ recordDate: _.gte(startOfMonth) })
      .get()
    const totalLossCost = losses.data.reduce((sum, l) => sum + (l.costAmount || 0), 0)

    const lowStockCount = (await db.collection('materials')
      .where({ stock: _.lte(0) })
      .count()).total

    const slowCount = (await db.collection('materials')
      .where({ isSlow: true })
      .count()).total

    return success({
      totalPurchase: Math.round(totalPurchase * 100) / 100,
      totalLossCost: Math.round(totalLossCost * 100) / 100,
      lowStockCount,
      slowCount
    })
  } catch (e) {
    if (isMissingCollectionError(e)) {
      return success({
        totalPurchase: 0,
        totalLossCost: 0,
        lowStockCount: 0,
        slowCount: 0
      })
    }
    throw e
  }
}

// 库存趋势（近30天每日库存总量）
async function stockTrend(data = {}) {
  try {
    const { days = 30 } = data
    const result = []

    const materials = await db.collection('materials').limit(1000).get()
    const currentTotal = materials.data.reduce((sum, m) => sum + (m.stock || 0), 0)

    const startDate = daysAgo(days)
    const purchases = await db.collection('purchases')
      .where({ purchaseDate: _.gte(startDate) })
      .orderBy('purchaseDate', 'asc')
      .get()

    const losses = await db.collection('loss_records')
      .where({ recordDate: _.gte(startDate) })
      .orderBy('recordDate', 'asc')
      .get()

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
  } catch (e) {
    if (isMissingCollectionError(e)) {
      return success([])
    }
    throw e
  }
}

// 高损耗物资TOP10
async function topLossMaterials(data = {}) {
  try {
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
  } catch (e) {
    if (isMissingCollectionError(e)) {
      return success([])
    }
    throw e
  }
}

// 预警摘要
async function alertSummary(data = {}) {
  try {
    const materials = await db.collection('materials').limit(1000).get()
    const lowStockItems = materials.data.filter(m => m.stock <= m.minStock && m.minStock > 0)
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
  } catch (e) {
    if (isMissingCollectionError(e)) {
      return success({
        lowStockCount: 0,
        slowCount: 0,
        lowStockItems: [],
        slowItems: []
      })
    }
    throw e
  }
}

// 预警服务 - 低库存检测、滞销检测（定时触发器调用）
const { cloud, db, _, success, fail, daysAgo } = require('../shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'checkLowStock':
      return await checkLowStock(data)
    case 'checkSlowMoving':
      return await checkSlowMoving(data)
    case 'runAllChecks':
      return await runAllChecks(data)
    default:
      return fail('未知操作')
  }
}

// 检测低库存物资
async function checkLowStock(data = {}) {
  const materials = await db.collection('materials')
    .where({ minStock: _.gt(0) })
    .limit(1000)
    .get()

  const lowStockItems = materials.data.filter(m => m.stock <= m.minStock)

  return success({
    count: lowStockItems.length,
    items: lowStockItems.map(m => ({
      _id: m._id,
      name: m.name,
      stock: m.stock,
      minStock: m.minStock,
      category: m.category
    }))
  })
}

// 检测滞销物资
async function checkSlowMoving(data = {}) {
  const { slowDays = 90 } = data
  const thresholdDate = daysAgo(slowDays)

  // 查找 lastUsedDate 超过阈值且库存 > 0 的物资
  const materials = await db.collection('materials')
    .where({
      stock: _.gt(0),
      lastUsedDate: _.lt(thresholdDate)
    })
    .limit(1000)
    .get()

  // 也处理从未使用过且有库存的物资
  const neverUsed = await db.collection('materials')
    .where({
      stock: _.gt(0),
      lastUsedDate: null,
      createdAt: _.lt(thresholdDate)
    })
    .limit(1000)
    .get()

  const allSlowItems = [...materials.data, ...neverUsed.data]
  const uniqueIds = [...new Set(allSlowItems.map(m => m._id))]

  // 批量标记滞销
  let updatedCount = 0
  for (const id of uniqueIds) {
    try {
      await db.collection('materials').doc(id).update({
        data: { isSlow: true, updatedAt: db.serverDate() }
      })
      updatedCount++
    } catch (e) {
      // 忽略不存在的文档
    }
  }

  // 取消已不再滞销的物资标记
  const activeItems = await db.collection('materials')
    .where({
      isSlow: true,
      lastUsedDate: _.gte(thresholdDate)
    })
    .limit(1000)
    .get()

  let unmarkedCount = 0
  for (const item of activeItems.data) {
    try {
      await db.collection('materials').doc(item._id).update({
        data: { isSlow: false, updatedAt: db.serverDate() }
      })
      unmarkedCount++
    } catch (e) {}
  }

  return success({
    slowCount: uniqueIds.length,
    updatedCount,
    unmarkedCount
  })
}

// 执行所有检测（用于定时触发器）
async function runAllChecks(data = {}) {
  const slowResult = await checkSlowMoving(data)
  const lowResult = await checkLowStock(data)

  return success({
    slow: slowResult.data,
    lowStock: lowResult.data
  })
}

// 财务服务 - 成本核算、利润计算、报表生成
const { cloud, db, _, success, fail, monthStart, daysAgo } = require('../shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'overview':
      return await financeOverview(data)
    case 'banquetProfit':
      return await banquetProfit(data)
    case 'monthlyReport':
      return await monthlyReport(data)
    case 'profitTrend':
      return await profitTrend(data)
    default:
      return fail('未知操作')
  }
}

// 财务总览
async function financeOverview(data = {}) {
  const { startDate, endDate } = data
  const start = startDate ? new Date(startDate) : monthStart()
  const end = endDate ? new Date(endDate) : new Date()

  // 本期进货总额
  const purchases = await db.collection('purchases')
    .where({ purchaseDate: _.gte(start).and(_.lte(end)) })
    .get()
  const totalPurchase = purchases.data.reduce((sum, p) => sum + p.totalAmount, 0)

  // 本期宴会收入
  const banquets = await db.collection('banquets')
    .where({ eventDate: _.gte(start).and(_.lte(end)), status: '已结算' })
    .get()
  const totalRevenue = banquets.data.reduce((sum, b) => sum + (b.actualRevenue || 0), 0)

  // 本期损耗成本
  const losses = await db.collection('loss_records')
    .where({ recordDate: _.gte(start).and(_.lte(end)) })
    .get()
  const totalLossCost = losses.data.reduce((sum, l) => sum + (l.costAmount || 0), 0)

  const netProfit = Math.round((totalRevenue - totalPurchase - totalLossCost) * 100) / 100

  return success({
    totalPurchase: Math.round(totalPurchase * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalLossCost: Math.round(totalLossCost * 100) / 100,
    netProfit,
    profitRate: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0
  })
}

// 按宴会查看利润
async function banquetProfit(data = {}) {
  const { page = 1, pageSize = 20, status } = data
  const where = {}
  if (status) where.status = status

  const banquets = await db.collection('banquets')
    .where(where)
    .orderBy('eventDate', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const totalRes = await db.collection('banquets').where(where).count()

  const list = banquets.data.map(b => ({
    ...b,
    profit: Math.round(((b.actualRevenue || 0) - (b.totalCost || 0)) * 100) / 100,
    profitRate: b.actualRevenue > 0
      ? Math.round(((b.actualRevenue - b.totalCost) / b.actualRevenue) * 1000) / 10
      : 0
  })).sort((a, b) => b.profit - a.profit)

  return success({
    list,
    total: totalRes.total,
    page,
    pageSize
  })
}

// 月度报表
async function monthlyReport(data = {}) {
  const { year, month } = data
  const now = new Date()
  const y = year || now.getFullYear()
  const m = month || now.getMonth() + 1

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  // 该月进货
  const purchases = await db.collection('purchases')
    .where({ purchaseDate: _.gte(startDate).and(_.lte(endDate)) })
    .get()
  const totalPurchase = purchases.data.reduce((sum, p) => sum + p.totalAmount, 0)

  // 该月宴会
  const banquets = await db.collection('banquets')
    .where({ eventDate: _.gte(startDate).and(_.lte(endDate)) })
    .get()
  const totalRevenue = banquets.data.reduce((sum, b) => sum + (b.actualRevenue || 0), 0)
  const totalCost = banquets.data.reduce((sum, b) => sum + (b.totalCost || 0), 0)

  return success({
    year: y,
    month: m,
    purchaseCount: purchases.data.length,
    totalPurchase: Math.round(totalPurchase * 100) / 100,
    banquetCount: banquets.data.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    netProfit: Math.round((totalRevenue - totalCost) * 100) / 100
  })
}

// 利润趋势（近N个月）
async function profitTrend(data = {}) {
  const { months = 6 } = data
  const result = []

  for (let i = months - 1; i >= 0; i--) {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1 - i
    const date = new Date(y, m - 1, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const banquets = await db.collection('banquets')
      .where({ eventDate: _.gte(startDate).and(_.lte(endDate)) })
      .get()

    const revenue = banquets.data.reduce((sum, b) => sum + (b.actualRevenue || 0), 0)
    const cost = banquets.data.reduce((sum, b) => sum + (b.totalCost || 0), 0)

    result.push({
      month: `${year}-${String(month).padStart(2, '0')}`,
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round((revenue - cost) * 100) / 100
    })
  }

  return success(result)
}

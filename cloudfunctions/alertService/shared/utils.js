// 云函数公共工具模块
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 通用分页查询
async function queryWithPage(collection, where = {}, { page = 1, pageSize = 20, orderBy = 'createdAt', order = 'desc' } = {}) {
  const skip = (page - 1) * pageSize
  const countResult = await db.collection(collection).where(where).count()
  const total = countResult.total
  const queryResult = await db.collection(collection)
    .where(where)
    .orderBy(orderBy, order)
    .skip(skip)
    .limit(pageSize)
    .get()
  return {
    list: queryResult.data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

// 成功响应
function success(data = null, message = '操作成功') {
  return { code: 0, data, message }
}

// 失败响应
function fail(message = '操作失败', code = -1) {
  return { code, data: null, message }
}

// 获取今天0点时间戳
function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// 获取N天前的日期
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// 获取本月第一天
function monthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

module.exports = {
  cloud,
  db,
  _,
  queryWithPage,
  success,
  fail,
  todayStart,
  daysAgo,
  monthStart
}

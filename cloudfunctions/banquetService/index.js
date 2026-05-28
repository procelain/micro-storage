// 宴会服务 - 宴会CRUD、状态流转
const { cloud, db, _, success, fail, queryWithPage } = require('../shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list':
      return await listBanquets(data)
    case 'detail':
      return await getDetail(data)
    case 'create':
      return await createBanquet(data)
    case 'update':
      return await updateBanquet(data)
    case 'delete':
      return await deleteBanquet(data)
    case 'updateStatus':
      return await updateStatus(data)
    case 'setRevenue':
      return await setRevenue(data)
    default:
      return fail('未知操作')
  }
}

// 宴会列表
async function listBanquets(data = {}) {
  const { status, keyword, page = 1, pageSize = 20 } = data
  const where = {}

  if (status) where.status = status
  if (keyword) {
    where.clientName = db.RegExp({ regexp: keyword, options: 'i' })
  }

  return success(await queryWithPage('banquets', where, { page, pageSize, orderBy: 'eventDate', order: 'desc' }))
}

// 宴会详情
async function getDetail(data) {
  const { id } = data
  if (!id) return fail('缺少宴会ID')

  const banquetDoc = await db.collection('banquets').doc(id).get()
  const banquet = banquetDoc.data

  // 获取关联损耗记录
  const losses = await db.collection('loss_records')
    .where({ banquetId: id })
    .orderBy('recordDate', 'desc')
    .get()

  banquet.lossRecords = losses.data
  return success(banquet)
}

// 创建宴会
async function createBanquet(data) {
  const { clientName, eventDate, venue, budgetAmount = 0, remark = '' } = data
  if (!clientName || !eventDate) return fail('客户名称和宴会日期不能为空')

  const banquet = {
    clientName,
    eventDate: new Date(eventDate),
    venue: venue || '',
    budgetAmount,
    actualRevenue: 0,
    totalCost: 0,
    status: '筹备中',
    remark,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const res = await db.collection('banquets').add({ data: banquet })
  return success({ _id: res._id, ...banquet })
}

// 更新宴会
async function updateBanquet(data) {
  const { id, ...updateData } = data
  if (!id) return fail('缺少宴会ID')

  const fields = {}
  const allowedFields = ['clientName', 'eventDate', 'venue', 'budgetAmount', 'remark']
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      fields[field] = field === 'eventDate' ? new Date(updateData[field]) : updateData[field]
    }
  }
  fields.updatedAt = db.serverDate()

  await db.collection('banquets').doc(id).update({ data: fields })
  return success(null, '更新成功')
}

// 删除宴会
async function deleteBanquet(data) {
  const { id } = data
  if (!id) return fail('缺少宴会ID')
  await db.collection('banquets').doc(id).remove()
  return success(null, '删除成功')
}

// 更新宴会状态
async function updateStatus(data) {
  const { id, status } = data
  if (!id || !status) return fail('参数不完整')

  const validStatuses = ['筹备中', '进行中', '已完成', '已结算']
  if (!validStatuses.includes(status)) return fail('无效状态')

  await db.collection('banquets').doc(id).update({
    data: { status, updatedAt: db.serverDate() }
  })
  return success(null, '状态已更新')
}

// 设置实际收入
async function setRevenue(data) {
  const { id, actualRevenue } = data
  if (!id) return fail('缺少宴会ID')

  await db.collection('banquets').doc(id).update({
    data: {
      actualRevenue,
      status: '已结算',
      updatedAt: db.serverDate()
    }
  })
  return success(null, '收入已录入')
}

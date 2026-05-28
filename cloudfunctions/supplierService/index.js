// 供应商服务
const { cloud, db, _, success, fail } = require('../shared/utils')

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list':
      return await listSuppliers(data)
    case 'create':
      return await createSupplier(data)
    case 'update':
      return await updateSupplier(data)
    case 'delete':
      return await deleteSupplier(data)
    default:
      return fail('未知操作')
  }
}

async function listSuppliers(data = {}) {
  const res = await db.collection('suppliers').orderBy('createdAt', 'desc').limit(200).get()
  return success(res.data)
}

async function createSupplier(data) {
  const { name, contact, phone, address, mainCategory } = data
  if (!name) return fail('供应商名称不能为空')

  const supplier = {
    name,
    contact: contact || '',
    phone: phone || '',
    address: address || '',
    mainCategory: mainCategory || '',
    createdAt: db.serverDate()
  }

  const res = await db.collection('suppliers').add({ data: supplier })
  return success({ _id: res._id, ...supplier })
}

async function updateSupplier(data) {
  const { id, ...updateData } = data
  if (!id) return fail('缺少供应商ID')

  const fields = {}
  const allowedFields = ['name', 'contact', 'phone', 'address', 'mainCategory']
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) fields[field] = updateData[field]
  }

  await db.collection('suppliers').doc(id).update({ data: fields })
  return success(null, '更新成功')
}

async function deleteSupplier(data) {
  const { id } = data
  if (!id) return fail('缺少供应商ID')
  await db.collection('suppliers').doc(id).remove()
  return success(null, '删除成功')
}

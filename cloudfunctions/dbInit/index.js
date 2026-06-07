// 数据库集合初始化脚本
// 在微信云开发控制台中执行，或通过云函数调用
const { cloud, db, success } = require('./shared/utils')

const collections = [
  {
    name: 'materials',
    description: '物资档案',
    indexes: [
      { keys: { name: 1 }, options: { unique: false } },
      { keys: { category: 1 }, options: {} },
      { keys: { isSlow: 1 }, options: {} }
    ]
  },
  {
    name: 'categories',
    description: '分类配置',
    indexes: [
      { keys: { name: 1 }, options: { unique: false } }
    ]
  },
  {
    name: 'purchases',
    description: '进货记录',
    indexes: [
      { keys: { materialId: 1 }, options: {} },
      { keys: { purchaseDate: -1 }, options: {} }
    ]
  },
  {
    name: 'banquets',
    description: '宴会项目',
    indexes: [
      { keys: { status: 1 }, options: {} },
      { keys: { eventDate: -1 }, options: {} }
    ]
  },
  {
    name: 'loss_records',
    description: '损耗记录',
    indexes: [
      { keys: { banquetId: 1 }, options: {} },
      { keys: { materialId: 1 }, options: {} },
      { keys: { recordDate: -1 }, options: {} }
    ]
  },
  {
    name: 'alert_configs',
    description: '预警配置',
    indexes: [
      { keys: { materialId: 1 }, options: {} }
    ]
  }
]

// 初始化物资分类数据
const categories = [
  { name: '花艺', color: '#FF6B9D', icon: 'flower', sortOrder: 1 },
  { name: '灯光', color: '#FFD93D', icon: 'light', sortOrder: 2 },
  { name: '布艺', color: '#6BCB77', icon: 'cloth', sortOrder: 3 },
  { name: '餐具', color: '#4D96FF', icon: 'tableware', sortOrder: 4 },
  { name: '道具', color: '#9B59B6', icon: 'prop', sortOrder: 5 },
  { name: '其他', color: '#A0A0A0', icon: 'other', sortOrder: 6 }
]

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'initCollections':
      return await initCollections()
    case 'initCategories':
      return await initCategories()
    case 'initAll':
      await initCollections()
      await initCategories()
      return success('数据库初始化完成')
    default:
      return success({ collections: collections.map(c => c.name), categories })
  }
}

async function initCollections() {
  const results = []
  for (const col of collections) {
    try {
      await db.createCollection(col.name)
      results.push({ name: col.name, status: 'created' })
    } catch (e) {
      results.push({ name: col.name, status: 'exists', message: e.message })
    }
  }
  return success(results)
}

async function initCategories() {
  try {
    await db.createCollection('categories')
  } catch (e) {}

  for (const cat of categories) {
    const exists = await db.collection('categories').where({ name: cat.name }).limit(1).get()
    if (!exists.data.length) {
      await db.collection('categories').add({ data: cat })
    }
  }
  return success(categories)
}

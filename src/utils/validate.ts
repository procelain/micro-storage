// 表单校验规则

// 必填校验
export function required(value: any, message: string = '此字段为必填项'): string | true {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return message
  }
  return true
}

// 数字校验
export function isNumber(value: any, message: string = '请输入有效数字'): string | true {
  if (value === '' || value === null || value === undefined) return true
  if (isNaN(Number(value))) return message
  return true
}

// 正数校验
export function isPositive(value: any, message: string = '请输入正数'): string | true {
  if (value === '' || value === null || value === undefined) return true
  const num = Number(value)
  if (isNaN(num) || num <= 0) return message
  return true
}

// 最小值校验
export function minValue(min: number, message?: string) {
  return (value: any): string | true => {
    if (value === '' || value === null || value === undefined) return true
    const num = Number(value)
    if (isNaN(num) || num < min) return message || `最小值为${min}`
    return true
  }
}

// 最大长度校验
export function maxLength(max: number, message?: string) {
  return (value: any): string | true => {
    if (!value) return true
    if (String(value).length > max) return message || `最多${max}个字符`
    return true
  }
}

// 手机号校验
export function isPhone(value: any, message: string = '请输入有效手机号'): string | true {
  if (!value) return true
  if (!/^1[3-9]\d{9}$/.test(String(value))) return message
  return true
}

// 综合校验
export function validate(rules: Array<() => string | true>): string | true {
  for (const rule of rules) {
    const result = rule()
    if (result !== true) return result
  }
  return true
}

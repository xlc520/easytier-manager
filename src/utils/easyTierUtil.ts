export const parseNodeInfo = (content) => {
  const regex = /^\s*│\s*([^│]+)\s*│\s*([^│]+)\s*│\s*$/gm
  const result = {}
  let match
  while ((match = regex.exec(content)) !== null) {
    const key = match[1].trim()
    result[key] = match[2].trim()
  }
  return result
}
export const parsePeerInfo = (content) => {
  // 将表格字符串分割成行
  const lines = content.split('\n')

  // 提取表头（keys）
  const headers = lines[1]
    .split('│')
    .slice(1, -1)
    .map((h) => h.trim())

  // 初始化结果数组
  const result: any[] = []

  // 遍历数据行
  for (let i = 3; i < lines.length - 1; i += 2) {
    if (lines[i].trim() === '') continue // 跳过空行

    // 分割每一行的数据
    const values = lines[i]
      .split('│')
      .slice(1, -1)
      .map((v) => v.trim())

    // 创建对象并添加到结果数组
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] === '-' || values[index] === '' ? null : values[index]
    })

    // 每行数据都作为一个新对象添加到结果数组中
    result.push(obj)
  }

  return result
}

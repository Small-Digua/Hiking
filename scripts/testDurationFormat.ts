import { formatDuration } from '../src/utils/formatDuration'

console.log('🧪 测试时长格式化函数...')

const testCases = [
  '2.5h',
  '3h', 
  '1.25',
  '90min',
  '2小时30分钟',
  '12.2h',
  '75min',
  '0.5h',
  '120min',
  null,
  undefined,
  '',
  'invalid'
]

testCases.forEach(testCase => {
  const result = formatDuration(testCase)
  console.log(`"${testCase}" -> "${result}"`)
})

console.log('\n✅ 格式化测试完成！')
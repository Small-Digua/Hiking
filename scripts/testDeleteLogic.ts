import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error('❌ 错误: 未找到 DATABASE_URL 环境变量。')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
})

async function runTest() {
  const client = await pool.connect()
  try {
    console.log('🧪 开始测试软删除逻辑...')

    // 1. 获取一个测试用户和路线
    const userRes = await client.query('SELECT id FROM auth.users LIMIT 1')
    if (userRes.rows.length === 0) throw new Error('没有用户可测试')
    const userId = userRes.rows[0].id

    const routeRes = await client.query('SELECT id FROM public.routes LIMIT 1')
    if (routeRes.rows.length === 0) throw new Error('没有路线可测试')
    const routeId = routeRes.rows[0].id

    console.log(`👤 测试用户: ${userId}`)
    console.log(`🗺️ 测试路线: ${routeId}`)

    // 2. 创建一条测试行程
    const insertRes = await client.query(`
      INSERT INTO public.itineraries (user_id, route_id, planned_date, status)
      VALUES ($1, $2, NOW(), 'Pending')
      RETURNING id
    `, [userId, routeId])
    const itineraryId = insertRes.rows[0].id
    console.log(`✅ 创建测试行程: ${itineraryId}`)

    // 3. 验证可以查询到
    const query1 = await client.query(`
      SELECT * FROM public.itineraries 
      WHERE user_id = $1 AND deleted_at IS NULL AND id = $2
    `, [userId, itineraryId])
    
    if (query1.rows.length !== 1) {
      throw new Error('❌ 新增记录未查询到')
    }
    console.log('✅ 新增记录验证可见性：通过')

    // 4. 执行软删除 (模拟 dataService.deleteItinerary)
    await client.query(`
      UPDATE public.itineraries 
      SET deleted_at = NOW() 
      WHERE id = $1
    `, [itineraryId])
    console.log('🗑️ 执行软删除...')

    // 5. 验证查询不到 (模拟 getUserItineraries)
    const query2 = await client.query(`
      SELECT * FROM public.itineraries 
      WHERE user_id = $1 AND deleted_at IS NULL AND id = $2
    `, [userId, itineraryId])

    if (query2.rows.length !== 0) {
      throw new Error('❌ 已删除记录仍可见！软删除过滤失效。')
    }
    console.log('✅ 删除后验证不可见性：通过')

    // 6. 验证数据库中确实存在 (deleted_at 不为空)
    const query3 = await client.query(`
      SELECT * FROM public.itineraries 
      WHERE id = $1 AND deleted_at IS NOT NULL
    `, [itineraryId])

    if (query3.rows.length !== 1) {
      throw new Error('❌ 数据库中未找到软删除记录，可能是物理删除了？')
    }
    console.log('✅ 数据库记录完整性验证：通过')

    // 7. 模拟新增操作 (干扰项)
    console.log('🔄 模拟新增另一条记录...')
    const insert2 = await client.query(`
      INSERT INTO public.itineraries (user_id, route_id, planned_date, status)
      VALUES ($1, $2, NOW(), 'Pending')
      RETURNING id
    `, [userId, routeId])
    const id2 = insert2.rows[0].id

    // 8. 再次查询列表，确保只有 id2，没有 itineraryId
    const query4 = await client.query(`
      SELECT id FROM public.itineraries 
      WHERE user_id = $1 AND deleted_at IS NULL
    `, [userId])
    
    const ids = query4.rows.map(r => r.id)
    if (ids.includes(itineraryId)) {
      throw new Error('❌ 新增操作后，已删除记录再次出现！')
    }
    if (!ids.includes(id2)) {
      throw new Error('❌ 新增记录未出现')
    }
    console.log('✅ 混合操作验证：通过')

    // 9. 清理测试数据
    await client.query('DELETE FROM public.itineraries WHERE id IN ($1, $2)', [itineraryId, id2])
    console.log('🧹 清理测试数据完成')

  } catch (err) {
    console.error('❌ 测试失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runTest()

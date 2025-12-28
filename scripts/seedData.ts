import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import type { Database } from '../src/types/database.types'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// --- 精选真实数据 ---

// 1. 城市数据
const CITIES = [
  { 
    name: '广州', 
    district: '华南', 
    description: '千年商都，食在广州。除了早茶，这里的白云山和火炉山也是徒步爱好者的天堂。', 
    image_url: 'https://images.unsplash.com/photo-1583766297378-0e311394c502?q=80&w=1200' 
  },
  { 
    name: '深圳', 
    district: '华南', 
    description: '年轻的创新之都，拥有中国最美的海岸线穿越路线和梧桐山云海。', 
    image_url: 'https://images.unsplash.com/photo-1598218658826-6a2c20892095?q=80&w=1200' 
  },
  { 
    name: '佛山', 
    district: '华南', 
    description: '岭南文化发源地，黄飞鸿故里。西樵山的清幽与皂幕山的险峻相得益彰。', 
    image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1200' 
  },
  { 
    name: '厦门', 
    district: '华东', 
    description: '城在海上，海在城中。在环岛路吹海风，或登云顶山看日出，都是极致享受。', 
    image_url: 'https://images.unsplash.com/photo-1595066935222-38d5c98d665f?q=80&w=1200' 
  },
]

// 2. 路线详情结构
interface RouteSection {
  sort_order: number
  content: string
  image_url: string | null
}

interface RouteConfig {
  name: string
  difficulty: number
  distance: number
  duration: number
  cover_image: string
  sections: RouteSection[]
}

const ROUTES_DATA: Record<string, RouteConfig[]> = {
  '广州': [
    {
      name: '白云山·云道穿越',
      difficulty: 1.5,
      distance: 8.0,
      duration: 3.5,
      cover_image: 'https://images.unsplash.com/photo-1583766297378-0e311394c502?q=80&w=1200', // 广州塔/城市天际线
      sections: [
        {
          sort_order: 1,
          content: '起点：中山纪念堂。沿着空中步道（云道）一路向北，避开城市车流，在树冠层穿行，途径越秀公园，俯瞰广州老城区风貌。',
          image_url: 'https://images.unsplash.com/photo-1620632617066-1070744c7985?q=80&w=800' // 空中步道/绿色走廊
        },
        {
          sort_order: 2,
          content: '中段：踏入白云山风景区。从南门进入，沿着蜿蜒的盘山公路或登山台阶而上，沿途空气清新，是广州的“市肺”。',
          image_url: 'https://images.unsplash.com/photo-1596263576926-78711585c518?q=80&w=800' // 郁郁葱葱的山林
        },
        {
          sort_order: 3,
          content: '终点：摩星岭。登顶白云山最高峰摩星岭，天气晴好时可远眺珠江新城和小蛮腰，是欣赏广州日落的最佳地点。',
          image_url: 'https://images.unsplash.com/photo-1619864234503-4c5b36444853?q=80&w=800' // 俯瞰城市日落
        }
      ]
    },
    {
      name: '火炉山·龙眼洞森林穿越',
      difficulty: 2.5,
      distance: 6.5,
      duration: 3.0,
      cover_image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=1200', // 森林/光影
      sections: [
        {
          sort_order: 1,
          content: '火炉山以其山上泥土多为红泥土，空中看上去为火红色而得名。起点位于火炉山森林公园北门，这里有大片的草坪，适合热身。',
          image_url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=800' // 草坪/森林入口
        },
        {
          sort_order: 2,
          content: '沿途不再是铺装路面，而是充满野趣的土路和乱石坡。急升坡路段考验心肺功能，是广州户外圈经典的拉练胜地。',
          image_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800' // 土路/徒步径
        },
        {
          sort_order: 3,
          content: '下山途径猪头石，这里巨石嶙峋，在此稍作休息补充水分。终点可至龙眼洞森林公园，感受更原始的次生林景观。',
          image_url: null
        }
      ]
    }
  ],
  '深圳': [
    {
      name: '东西冲·海岸线穿越',
      difficulty: 4.0,
      distance: 8.0,
      duration: 5.0,
      cover_image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?q=80&w=1200', // 壮观的海岸线/礁石
      sections: [
        {
          sort_order: 1,
          content: '【起点：东涌沙滩】被评为“国内十大最美徒步路线”之一。从东涌沙滩出发，一面是蔚蓝无边的海，一面是险峻的山崖。起步阶段即需翻越一段小山坡，开启惊险刺激的穿越之旅。',
          image_url: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=800' // 远眺大海
        },
        {
          sort_order: 2,
          content: '【中段：鬼仔角与碎石坡】核心路段多为碎石和岩壁，必须手脚并用，建议佩戴防滑手套（比登山杖更好用）。沿途会经过鬼仔角等小沙滩，偶尔有渔民搭建的简易补给点卖水。',
          image_url: 'https://images.unsplash.com/photo-1516690553959-71a414d6b9b6?q=80&w=800' // 礁石/海浪
        },
        {
          sort_order: 3,
          content: '【终点：西冲沙滩】翻过最后一座山头，被评为“国内八大最美海滩”的西冲展现在眼前。全程约4-6小时，若体力不支，中途可乘坐渔民快艇直达终点。注意做好防晒！',
          image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800' // 沙滩
        }
      ]
    },
    {
      name: '梧桐山·百年古道',
      difficulty: 3.5,
      distance: 13.0,
      duration: 6.0,
      cover_image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200', // 茂密森林/光线
      sections: [
        {
          sort_order: 1,
          content: '梧桐山是深圳第一高峰，海拔943.7米。选择百年古道上山，避开了人挤人的大路。古道树荫浓密，石阶布满青苔，古意盎然。',
          image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800' // 森林古道
        },
        {
          sort_order: 2,
          content: '抵达好汉坡。这里是通往顶峰的最后考验，坡度陡峭，需要一鼓作气。站在好汉坡平台，已能俯瞰深圳盐田港和香港群山。',
          image_url: 'https://images.unsplash.com/photo-1533050487297-09b450131914?q=80&w=800' // 山顶俯瞰
        },
        {
          sort_order: 3,
          content: '登顶鹏城第一峰。巨型天池在云雾中若隐若现。一定要在这里打卡留念，见证自己征服深圳最高点的时刻。',
          image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800' // 高山云海
        }
      ]
    }
  ],
  '佛山': [
    {
      name: '西樵山·观音法相朝圣',
      difficulty: 2.0,
      distance: 9.0,
      duration: 4.0,
      cover_image: 'https://images.unsplash.com/photo-1560759226-1483a2be0344?q=80&w=1200', // 寺庙/台阶/氛围
      sections: [
        {
          sort_order: 1,
          content: '从北门进山，首先迎接你的是碧玉洞。洞内怪石嶙峋，飞瀑流泉，清凉宜人，是夏日避暑的好去处。',
          image_url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=800' // 瀑布/溪流
        },
        {
          sort_order: 2,
          content: '核心景点：南海观音文化苑。高达61.9米的观音坐像耸立在云端，在此虔诚祈福，俯瞰桑基鱼塘的水乡画卷。',
          image_url: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=800' // 观音/寺庙
        },
        {
          sort_order: 3,
          content: '下山途中经过四方竹园和九龙岩。这里可以欣赏到独特的方形竹子和火山岩地质地貌，感叹大自然的鬼斧神工。',
          image_url: null
        }
      ]
    },
    {
      name: '皂幕山·佛山之巅',
      difficulty: 3.5,
      distance: 6.0,
      duration: 4.5,
      cover_image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200', // 山脊线
      sections: [
        {
          sort_order: 1,
          content: '皂幕山海拔840.2米，是佛山第一峰。起点通常位于坑美村，这里保留了大量的原生态梯田，春季注水时波光粼粼。',
          image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800' // 梯田
        },
        {
          sort_order: 2,
          content: '著名的“长寿梯”有6666级台阶，直通山顶。这是对毅力的极大考验，但沿途竹林茂密，空气中负离子含量极高。',
          image_url: 'https://images.unsplash.com/photo-1616035978436-54c3752e50c8?q=80&w=800' // 陡峭台阶
        },
        {
          sort_order: 3,
          content: '登顶后可见“佛山第一峰”石碑。极目远眺，西江如练，群山起伏。这里也是观赏日出云海的绝佳位置。',
          image_url: 'https://images.unsplash.com/photo-1465188162913-8fb5709d6d57?q=80&w=800' // 山顶云海
        }
      ]
    }
  ],
  '厦门': [
    {
      name: '环岛路·最美海滨栈道',
      difficulty: 1.0,
      distance: 10.0,
      duration: 3.0,
      cover_image: 'https://images.unsplash.com/photo-1601229063943-8551978248c8?q=80&w=1200', // 厦门/海边
      sections: [
        {
          sort_order: 1,
          content: '起点：白城沙滩。紧邻厦门大学，这里是厦门最热闹的沙滩之一。沿着木栈道向东出发，左手是绿树红花，右手是碧海蓝天。',
          image_url: 'https://images.unsplash.com/photo-1533552028689-d29b0a649383?q=80&w=800' // 栈道/沙滩
        },
        {
          sort_order: 2,
          content: '途径曾厝垵和黄厝海滩。可以在这里稍作停留，品尝特色的沙茶面和土笋冻。这一段路视野开阔，海风习习。',
          image_url: 'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?q=80&w=800' // 海边/悠闲
        },
        {
          sort_order: 3,
          content: '终点：观音山。这里有大片的沙雕公园和游乐场，也是看金门岛最近的地方。',
          image_url: 'https://images.unsplash.com/photo-1566324671457-3f9050d5106e?q=80&w=800' // 海岸/城市
        }
      ]
    },
    {
      name: '云顶山·厦门最高峰',
      difficulty: 3.0,
      distance: 8.5,
      duration: 4.5,
      cover_image: 'https://images.unsplash.com/photo-1502472584811-0a2f2ca84465?q=80&w=1200', // 雾中山峰
      sections: [
        {
          sort_order: 1,
          content: '位于同安区的云顶山，海拔1175.2米。从坂头村出发，沿着古朴的石阶路上山，沿途溪水潺潺，生态环境极佳。',
          image_url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800' // 溪流/山谷
        },
        {
          sort_order: 2,
          content: '沙溪水库。位于半山腰的一块碧玉，倒映着蓝天白云和青山。很多徒步者会选择在这里露营野餐。',
          image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800' // 高山湖泊/水库
        },
        {
          sort_order: 3,
          content: '三界碑。登顶后可以看到这块标志性石碑，一脚踏三界（同安、安溪、南安）。这里常年云雾缭绕，宛如仙境。',
          image_url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800' // 山顶云雾
        }
      ]
    }
  ]
}

async function seed() {
  console.log('🌱 开始注入精选数据...')

  // 1. 插入城市
  console.log('正在插入城市数据...')
  const { data: citiesData, error: citiesError } = await supabase
    .from('cities')
    .upsert(CITIES, { onConflict: 'name' })
    .select()

  if (citiesError) {
    console.error('插入城市失败:', citiesError)
    process.exit(1)
  }

  // 2. 插入路线
  console.log('正在插入路线数据...')
  const routesToInsert = []
  
  // 临时存储 route_key -> sections 的映射，用于后续插入 section
  const routeSectionsMap = new Map<string, RouteSection[]>()

  for (const city of citiesData) {
    const cityRoutes = ROUTES_DATA[city.name] || []
    
    for (const route of cityRoutes) {
      routesToInsert.push({
        city_id: city.id,
        name: route.name,
        difficulty: route.difficulty,
        distance_km: route.distance,
        duration_hours: route.duration,
        cover_image_url: route.cover_image
      })
      // 存储 sections 数据
      routeSectionsMap.set(`${city.id}_${route.name}`, route.sections)
    }
  }

  const { data: routesData, error: routesError } = await supabase
    .from('routes')
    .upsert(routesToInsert, { onConflict: 'city_id,name' })
    .select()

  if (routesError) {
    console.error('插入路线失败:', routesError)
    process.exit(1)
  }

  // 3. 插入路线详情 (Sections)
  console.log('正在插入路线详情...')
  const sectionsToInsert = []

  for (const route of routesData) {
    const key = `${route.city_id}_${route.name}`
    const sections = routeSectionsMap.get(key)
    
    if (sections) {
      for (const section of sections) {
        sectionsToInsert.push({
          route_id: route.id,
          sort_order: section.sort_order,
          content: section.content,
          image_url: section.image_url
        })
      }
    }
  }

  const { error: sectionsError } = await supabase
    .from('route_sections')
    .insert(sectionsToInsert)

  if (sectionsError) {
    console.error('插入路线详情失败:', sectionsError)
    process.exit(1)
  }

  console.log('✅ 数据注入完成！')
  console.log(`共插入: ${citiesData.length} 个城市, ${routesData.length} 条路线, ${sectionsToInsert.length} 个详情段落`)
}

seed().catch(err => {
  console.error('未知错误:', err)
  process.exit(1)
})

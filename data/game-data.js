const { ipcRenderer } = require('electron');

const ARTIFACTS = [
  {
    id: 'bronze_ding_01',
    name: '青铜方鼎',
    era: '商代',
    material: '青铜',
    rarity: 4,
    description: '商代晚期青铜礼器，鼎身饰有饕餮纹，是研究商代祭祀文化的重要实物。',
    damage: ['锈迹严重', '足部残缺', '铭文模糊'],
    image: '🏺'
  },
  {
    id: 'porcelain_vase_01',
    name: '青花缠枝莲纹瓶',
    era: '明代',
    material: '瓷器',
    rarity: 5,
    description: '明永乐年间官窑出品，青花发色纯正，纹饰繁复精美，器型端庄大气。',
    damage: ['口沿破碎', '釉面剥落', '冲线三道'],
    image: '🏺'
  },
  {
    id: 'jade_bi_01',
    name: '玉璧',
    era: '战国',
    material: '和田玉',
    rarity: 4,
    description: '战国时期贵族陪葬玉器，玉质温润，雕工精细，谷纹排列整齐。',
    damage: ['表面沁蚀', '边缘崩缺', '绺裂一道'],
    image: '⭕'
  },
  {
    id: 'scroll_painting_01',
    name: '山水图卷',
    era: '宋代',
    material: '绢本设色',
    rarity: 5,
    description: '南宋画家作品，意境深远，笔墨精妙，是难得的书画珍品。',
    damage: ['画心开裂', '污渍多处', '装裱脱落'],
    image: '🖼️'
  },
  {
    id: 'terracotta_01',
    name: '陶俑',
    era: '唐代',
    material: '陶器',
    rarity: 3,
    description: '唐三彩女立俑，造型生动，色彩虽有褪失但仍可见当年风华。',
    damage: ['头部断裂', '色彩剥落', '底座残缺'],
    image: '🗿'
  },
  {
    id: 'lacquer_ware_01',
    name: '剔红漆盒',
    era: '元代',
    material: '漆器',
    rarity: 4,
    description: '元代剔红工艺精品，雕漆层次分明，花卉图案栩栩如生。',
    damage: ['漆层开裂', '边角磕碰', '胎体暴露'],
    image: '📦'
  },
  {
    id: 'coin_01',
    name: '半两钱',
    era: '秦代',
    material: '铜',
    rarity: 2,
    description: '秦统一货币后铸行的半两钱，见证了中国货币史的重要时刻。',
    damage: ['锈蚀严重', '文字不清', '边缘磨损'],
    image: '🪙'
  },
  {
    id: 'fossil_01',
    name: '恐龙蛋化石',
    era: '白垩纪',
    material: '化石',
    rarity: 5,
    description: '罕见的完整恐龙蛋化石，对研究古生物和地质变迁具有极高科学价值。',
    damage: ['蛋壳碎裂', '石化不完全', '表面风化'],
    image: '🥚'
  }
];

const TASKS = [
  {
    id: 'task_001',
    title: '青铜方鼎修复',
    client: '省博物馆',
    deadline: 30,
    baseReward: 8000,
    reputation: 15,
    difficulty: 3,
    artifact: ARTIFACTS[0],
    requirements: ['除锈', '补配足部', '铭文拓印'],
    description: '这件青铜方鼎出土于商代晚期墓葬，因长期埋藏地下，锈蚀严重，需要进行专业除锈和修复。'
  },
  {
    id: 'task_002',
    title: '青花瓷瓶修复',
    client: '私人收藏家',
    deadline: 45,
    baseReward: 15000,
    reputation: 25,
    difficulty: 5,
    artifact: ARTIFACTS[1],
    requirements: ['碎片拼接', '釉面修复', '做旧处理'],
    description: '此瓶在运输过程中不慎跌落，口沿破碎，需要高超的修复技艺使其恢复原貌。'
  },
  {
    id: 'task_003',
    title: '玉璧修复',
    client: '考古研究所',
    deadline: 20,
    baseReward: 6000,
    reputation: 12,
    difficulty: 2,
    artifact: ARTIFACTS[2],
    requirements: ['表面清理', '边缘修补', '加固处理'],
    description: '战国玉璧，出土时已有损伤，需进行保护性修复。'
  },
  {
    id: 'task_004',
    title: '古画修复',
    client: '故宫博物院',
    deadline: 60,
    baseReward: 20000,
    reputation: 40,
    difficulty: 5,
    artifact: ARTIFACTS[3],
    requirements: ['清洗去污', '修补画心', '重新装裱'],
    description: '宋代山水图卷，因年代久远，画心多处开裂，污渍严重，需要全色修复。'
  },
  {
    id: 'task_005',
    title: '唐三彩修复',
    client: '市博物馆',
    deadline: 25,
    baseReward: 5000,
    reputation: 10,
    difficulty: 2,
    artifact: ARTIFACTS[4],
    requirements: ['拼接头部', '色彩回补', '底座修复'],
    description: '出土时头部已断裂，需要进行粘接和色彩复原。'
  }
];

const MATERIALS_INFO = {
  cleaningSolution: { name: '清洁剂', price: 200, unit: '瓶', description: '专业文物表面清洁剂' },
  adhesive: { name: '粘合剂', price: 350, unit: '支', description: '可逆性文物专用粘合剂' },
  filler: { name: '填充剂', price: 280, unit: '盒', description: '矿物填充材料' },
  pigment: { name: '矿物颜料', price: 180, unit: '套', description: '传统矿物颜料' },
  varnish: { name: '保护漆', price: 420, unit: '瓶', description: '文物保护层涂料' },
  solvent: { name: '溶剂', price: 150, unit: '瓶', description: '有机溶剂' }
};

const TOOLS_INFO = {
  softBrush: { name: '软毛刷', unlockCost: 0, description: '基础清洁工具' },
  scalpel: { name: '手术刀', unlockCost: 0, description: '精细清理工具' },
  microscope: { name: '显微镜', unlockCost: 15000, description: '观察微观结构' },
  laserCleaner: { name: '激光清洗机', unlockCost: 50000, description: '无损清洗设备' },
  uvLamp: { name: '紫外线灯', unlockCost: 8000, description: '检测修复痕迹' },
  xrayMachine: { name: 'X光机', unlockCost: 80000, description: '内部结构检测' }
};

const APPRENTICE_POOL = [
  { id: 'app_01', name: '李明', skills: { cleaning: 2, assembly: 1, analysis: 1 }, salary: 2000, traits: ['细心', '耐心不足'] },
  { id: 'app_02', name: '王芳', skills: { cleaning: 1, assembly: 3, analysis: 1 }, salary: 2500, traits: ['手巧', '理论薄弱'] },
  { id: 'app_03', name: '张伟', skills: { cleaning: 1, assembly: 1, analysis: 3 }, salary: 2800, traits: ['理论扎实', '动手稍慢'] },
  { id: 'app_04', name: '刘静', skills: { cleaning: 2, assembly: 2, analysis: 2 }, salary: 3000, traits: ['全能型', '经验不足'] }
];

async function getGameState() {
  return await ipcRenderer.invoke('get-game-state');
}

async function saveGameState(state) {
  return await ipcRenderer.invoke('save-game-state', state);
}

function getTasks() {
  return TASKS;
}

function getArtifacts() {
  return ARTIFACTS;
}

function getMaterialsInfo() {
  return MATERIALS_INFO;
}

function getToolsInfo() {
  return TOOLS_INFO;
}

function getApprenticePool() {
  return APPRENTICE_POOL;
}

function getMaterialName(key) {
  return MATERIALS_INFO[key]?.name || key;
}

function getToolName(key) {
  return TOOLS_INFO[key]?.name || key;
}

function getEraColor(era) {
  const colors = {
    '商代': '#8B4513',
    '战国': '#4A4A4A',
    '秦代': '#2F4F4F',
    '汉代': '#8B0000',
    '唐代': '#FFD700',
    '宋代': '#4682B4',
    '元代': '#228B22',
    '明代': '#1E90FF',
    '清代': '#DC143C',
    '白垩纪': '#8B4513'
  };
  return colors[era] || '#666';
}

function getQualityStars(quality) {
  if (quality >= 0.9) return '★★★★★';
  if (quality >= 0.75) return '★★★★☆';
  if (quality >= 0.6) return '★★★☆☆';
  if (quality >= 0.4) return '★★☆☆☆';
  return '★☆☆☆☆';
}

/* ============================================================
 * 一起查经｜66卷圣经互动学习平台
 * 数据层 1：Bible → Testament → Book
 * 66 卷完整元数据（分类、章数、主题、作者等）
 * ============================================================ */

const TESTAMENTS = [
  {
    id: 'ot',
    name: '旧约',
    count: 39,
    subtitle: '39卷 · 律法、历史、诗歌智慧、先知',
    categories: ['律法书', '历史书', '诗歌智慧书', '大先知书', '小先知书']
  },
  {
    id: 'nt',
    name: '新约',
    count: 27,
    subtitle: '27卷 · 福音、历史、书信、启示',
    categories: ['福音书', '历史书', '保罗书信', '普通书信', '预言书']
  }
];

const BOOKS = [
  /* ============ 旧约 · 律法书 ============ */
  { id: 'genesis',        name: '创世记',     en: 'Genesis',          testament: 'ot', category: '律法书',   chapters: 50, emoji: '🌎', tagline: '起初',       theme: '创造、堕落、应许、拣选', author: '摩西', summary: '万物起源：创造、人的堕落、洪水、巴别塔，以及亚伯拉罕、以撒、雅各、约瑟的故事。', color: '#3E8E5A' },
  { id: 'exodus',         name: '出埃及记',   en: 'Exodus',           testament: 'ot', category: '律法书',   chapters: 40, emoji: '🔥', tagline: '出埃及',     theme: '拯救、律法、圣约、会幕', author: '摩西', summary: '神用大能拯救以色列人脱离埃及，在西奈山赐下十诫与律法，并吩咐建造会幕。', color: '#C05621' },
  { id: 'leviticus',      name: '利未记',     en: 'Leviticus',        testament: 'ot', category: '律法书',   chapters: 27, emoji: '🕊️', tagline: '圣洁之路',   theme: '圣洁、献祭、敬拜、赎罪', author: '摩西', summary: '教导以色列人如何过圣洁的生活：献祭、节期、祭司与神的同在。', color: '#9C6B1F' },
  { id: 'numbers',        name: '民数记',     en: 'Numbers',          testament: 'ot', category: '律法书',   chapters: 36, emoji: '🏜️', tagline: '旷野之旅',   theme: '旷野、数点、悖逆、信心', author: '摩西', summary: '以色列人在旷野漂流四十年，数点百姓，学习顺服与信心的功课。', color: '#B7791F' },
  { id: 'deuteronomy',    name: '申命记',     en: 'Deuteronomy',      testament: 'ot', category: '律法书',   chapters: 34, emoji: '📜', tagline: '重申律法',   theme: '律法、盟约、爱神、顺服', author: '摩西', summary: '摩西在约旦河东重申律法，呼召新一代以色列人尽心爱神、遵行诫命。', color: '#6B46C1' },

  /* ============ 旧约 · 历史书 ============ */
  { id: 'joshua',         name: '约书亚记',   en: 'Joshua',           testament: 'ot', category: '历史书',   chapters: 24, emoji: '⚔️', tagline: '得地为业',   theme: '争战、得胜、分地、顺服', author: '约书亚', summary: '约书亚带领以色列人进入应许之地，征服迦南并按支派分地。', color: '#2F855A' },
  { id: 'judges',         name: '士师记',     en: 'Judges',           testament: 'ot', category: '历史书',   chapters: 21, emoji: '⚖️', tagline: '循环的救赎', theme: '悖逆、审判、拯救、士师', author: '撒母耳（传统）', summary: '以色列人离弃神陷入「悖逆—受苦—呼求—拯救」的循环，神兴起士师拯救他们。', color: '#C53030' },
  { id: 'ruth',           name: '路得记',     en: 'Ruth',             testament: 'ot', category: '历史书',   chapters: 4,  emoji: '🌾', tagline: '爱与忠诚',   theme: '忠诚、恩典、救赎、家谱', author: '撒母耳（传统）', summary: '路得对拿俄米的忠诚与波阿斯的救赎，预表神的恩典，家谱通向大卫。', color: '#D69E2E' },
  { id: '1samuel',        name: '撒母耳记上', en: '1 Samuel',         testament: 'ot', category: '历史书',   chapters: 31, emoji: '👑', tagline: '王权的建立', theme: '撒母耳、扫罗、大卫、受膏', author: '撒母耳/拿单/迦得（传统）', summary: '从士师到君王：撒母耳兴起，扫罗被弃，大卫被膏立。', color: '#805AD5' },
  { id: '2samuel',        name: '撒母耳记下', en: '2 Samuel',         testament: 'ot', category: '历史书',   chapters: 24, emoji: '🏰', tagline: '大卫王朝',   theme: '大卫、王国、犯罪、悔改', author: '拿单/迦得（传统）', summary: '大卫作王，统一以色列，也在犯罪与悔改中经历神的恩典与管教。', color: '#553C9A' },
  { id: '1kings',         name: '列王纪上',   en: '1 Kings',          testament: 'ot', category: '历史书',   chapters: 22, emoji: '🏛️', tagline: '分裂的王国', theme: '所罗门、圣殿、分裂、先知', author: '耶利米（传统）', summary: '所罗门建造圣殿，晚年堕落，王国分裂为南北两国。', color: '#B83280' },
  { id: '2kings',         name: '列王纪下',   en: '2 Kings',          testament: 'ot', category: '历史书',   chapters: 25, emoji: '📉', tagline: '亡国与余民', theme: '北国、南国、被掳、先知', author: '耶利米（传统）', summary: '南北两国先后因拜偶像而亡国，犹大被掳往巴比伦。', color: '#97266D' },
  { id: '1chronicles',    name: '历代志上',   en: '1 Chronicles',     testament: 'ot', category: '历史书',   chapters: 29, emoji: '📖', tagline: '祭司的眼光', theme: '家谱、大卫、圣殿、敬拜', author: '以斯拉（传统）', summary: '从祭司眼光重述以色列历史：家谱、大卫与圣殿预备。', color: '#4A5568' },
  { id: '2chronicles',    name: '历代志下',   en: '2 Chronicles',     testament: 'ot', category: '历史书',   chapters: 36, emoji: '🏛️', tagline: '圣殿与复兴', theme: '圣殿、复兴、君王、被掳', author: '以斯拉（传统）', summary: '以圣殿为中心讲述犹大诸王，呼吁回转与复兴。', color: '#2D3748' },
  { id: 'ezra',           name: '以斯拉记',   en: 'Ezra',             testament: 'ot', category: '历史书',   chapters: 10, emoji: '📚', tagline: '归回重建',   theme: '归回、圣殿、律法、复兴', author: '以斯拉', summary: '被掳归回后重建圣殿，以斯拉教导律法带来复兴。', color: '#2B6CB0' },
  { id: 'nehemiah',       name: '尼希米记',   en: 'Nehemiah',         testament: 'ot', category: '历史书',   chapters: 13, emoji: '🧱', tagline: '重建城墙',   theme: '城墙、重建、服事、祷告', author: '尼希米', summary: '尼希米带领百姓重建耶路撒冷城墙，恢复圣约生活。', color: '#3182CE' },
  { id: 'esther',         name: '以斯帖记',   en: 'Esther',           testament: 'ot', category: '历史书',   chapters: 10, emoji: '👸', tagline: '隐藏的保守', theme: '以斯帖、末底改、拯救、普珥日', author: '末底改（传统）', summary: '在波斯宫中，以斯帖冒险拯救犹大民族，看见神暗中的保守。', color: '#DD6B20' },

  /* ============ 旧约 · 诗歌智慧书 ============ */
  { id: 'job',            name: '约伯记',     en: 'Job',              testament: 'ot', category: '诗歌智慧书', chapters: 42, emoji: '🌪️', tagline: '苦难中的信心', theme: '苦难、公义、信心、盼望', author: '不详', summary: '义人约伯在极大苦难中与神对话，最终更深认识神。', color: '#718096' },
  { id: 'psalms',         name: '诗篇',       en: 'Psalms',           testament: 'ot', category: '诗歌智慧书', chapters: 150, emoji: '🎵', tagline: '心灵之歌',   theme: '敬拜、祷告、患难、赞美', author: '大卫等多位作者', summary: '150篇诗歌：祷告、赞美、哀歌与信靠，是灵魂的镜子。', color: '#D69E2E' },
  { id: 'proverbs',       name: '箴言',       en: 'Proverbs',         testament: 'ot', category: '诗歌智慧书', chapters: 31, emoji: '💡', tagline: '智慧人生',   theme: '智慧、言语、工作、家庭', author: '所罗门等多位作者', summary: '一句句格言，教导敬畏耶和华是智慧的开端，应用于生活。', color: '#B7791F' },
  { id: 'ecclesiastes',   name: '传道书',     en: 'Ecclesiastes',     testament: 'ot', category: '诗歌智慧书', chapters: 12, emoji: '🍃', tagline: '虚空与敬畏', theme: '虚空、人生、敬畏、永恒', author: '所罗门（传统）', summary: '在日光之下的虚空里，找到敬畏神、享受恩赐的人生智慧。', color: '#2F855A' },
  { id: 'songofsongs',    name: '雅歌',       en: 'Song of Songs',    testament: 'ot', category: '诗歌智慧书', chapters: 8,  emoji: '🌹', tagline: '爱情的颂歌', theme: '爱情、婚姻、委身', author: '所罗门', summary: '用诗歌描绘爱情与婚姻的美好，象征基督与教会的爱。', color: '#D53F8C' },

  /* ============ 旧约 · 大先知书 ============ */
  { id: 'isaiah',         name: '以赛亚书',   en: 'Isaiah',           testament: 'ot', category: '大先知书', chapters: 66, emoji: '✨', tagline: '弥赛亚的盼望', theme: '审判、拯救、弥赛亚、安慰', author: '以赛亚', summary: '先知以赛亚宣告审判与拯救，充满对弥赛亚的盼望。', color: '#B83280' },
  { id: 'jeremiah',       name: '耶利米书',   en: 'Jeremiah',         testament: 'ot', category: '大先知书', chapters: 52, emoji: '💧', tagline: '流泪的先知', theme: '审判、悔改、新约、盼望', author: '耶利米', summary: '流泪的先知呼吁犹大悔改，也宣告新约与归回的盼望。', color: '#2B6CB0' },
  { id: 'lamentations',   name: '耶利米哀歌', en: 'Lamentations',     testament: 'ot', category: '大先知书', chapters: 5,  emoji: '🌙', tagline: '哀歌中的信靠', theme: '哀伤、悔罪、信实、怜悯', author: '耶利米（传统）', summary: '为耶路撒冷的毁灭哀哭，却在神的信实中得着清晨的盼望。', color: '#4A5568' },
  { id: 'ezekiel',        name: '以西结书',   en: 'Ezekiel',          testament: 'ot', category: '大先知书', chapters: 48, emoji: '👁️', tagline: '荣耀的异象', theme: '荣耀、审判、复兴、圣殿', author: '以西结', summary: '先知以西结看见神的荣耀、枯骨复生的异象与新圣殿。', color: '#6B46C1' },
  { id: 'daniel',         name: '但以理书',   en: 'Daniel',           testament: 'ot', category: '大先知书', chapters: 12, emoji: '🦁', tagline: '至高的掌权者', theme: '信心、异象、国度、末后', author: '但以理', summary: '但以理在巴比伦忠于神，异象显明神在历史中掌权直到永远。', color: '#C05621' },

  /* ============ 旧约 · 小先知书 ============ */
  { id: 'hosea',          name: '何西阿书',   en: 'Hosea',            testament: 'ot', category: '小先知书', chapters: 14, emoji: '💔', tagline: '不变的爱',   theme: '背道、爱、挽回、盟约', author: '何西阿', summary: '何西阿以婚姻比喻神对背道子民不离不弃的爱。', color: '#C53030' },
  { id: 'joel',           name: '约珥书',     en: 'Joel',             testament: 'ot', category: '小先知书', chapters: 3,  emoji: '🌾', tagline: '耶和华的日子', theme: '审判、悔改、圣灵、拯救', author: '约珥', summary: '蝗灾之祸指向耶和华的日子，呼召悔改并应许浇灌圣灵。', color: '#B7791F' },
  { id: 'amos',           name: '阿摩司书',   en: 'Amos',             testament: 'ot', category: '小先知书', chapters: 9,  emoji: '⚖️', tagline: '公义的审判', theme: '公义、审判、社会、悔改', author: '阿摩司', summary: '牧人阿摩司斥责社会不公，宣告神公义的审判与复兴。', color: '#2F855A' },
  { id: 'obadiah',        name: '俄巴底亚书', en: 'Obadiah',          testament: 'ot', category: '小先知书', chapters: 1,  emoji: '🏔️', tagline: '骄傲的坠落', theme: '以东、骄傲、审判、国度', author: '俄巴底亚', summary: '宣告以东因骄傲受审判，并应许神的国度得胜。', color: '#718096' },
  { id: 'jonah',          name: '约拿书',     en: 'Jonah',            testament: 'ot', category: '小先知书', chapters: 4,  emoji: '🐋', tagline: '不愿的使者', theme: '怜悯、悔改、外邦、使命', author: '约拿（传统）', summary: '约拿不愿去尼尼微，却看见神对外邦人也满有怜悯。', color: '#2B6CB0' },
  { id: 'micah',          name: '弥迦书',     en: 'Micah',            testament: 'ot', category: '小先知书', chapters: 7,  emoji: '⛰️', tagline: '行公义好怜悯', theme: '公义、怜悯、谦卑、弥赛亚', author: '弥迦', summary: '要行公义、好怜悯、存谦卑的心与神同行，并预言弥赛亚降生。', color: '#38A169' },
  { id: 'nahum',          name: '那鸿书',     en: 'Nahum',            testament: 'ot', category: '小先知书', chapters: 3,  emoji: '🏛️', tagline: '尼尼微的倾覆', theme: '审判、公义、安慰', author: '那鸿', summary: '宣告尼尼微的倾覆，安慰受欺压的犹大。', color: '#805AD5' },
  { id: 'habakkuk',       name: '哈巴谷书',   en: 'Habakkuk',         testament: 'ot', category: '小先知书', chapters: 3,  emoji: '🗼', tagline: '因信得生',   theme: '疑问、信心、守望、喜乐', author: '哈巴谷', summary: '先知向神发问，从困惑走向「义人因信得生」的坚定信靠。', color: '#3182CE' },
  { id: 'zephaniah',      name: '西番雅书',   en: 'Zephaniah',        testament: 'ot', category: '小先知书', chapters: 3,  emoji: '🌅', tagline: '耶和华的日子', theme: '审判、余民、喜乐、拯救', author: '西番雅', summary: '宣告耶和华的日子，也宣告神在锡安中欢乐的拯救。', color: '#D69E2E' },
  { id: 'haggai',         name: '哈该书',     en: 'Haggai',           testament: 'ot', category: '小先知书', chapters: 2,  emoji: '🛠️', tagline: '重建圣殿',   theme: '圣殿、优先次序、激励', author: '哈该', summary: '鼓励归回的百姓先求神的国，重建圣殿。', color: '#9C6B1F' },
  { id: 'zechariah',      name: '撒迦利亚书', en: 'Zechariah',        testament: 'ot', category: '小先知书', chapters: 14, emoji: '🌟', tagline: '荣耀的降临', theme: '异象、弥赛亚、国度、复兴', author: '撒迦利亚', summary: '一连串异象安慰并激励百姓，指向弥赛亚与荣耀的国度。', color: '#B7791F' },
  { id: 'malachi',        name: '玛拉基书',   en: 'Malachi',          testament: 'ot', category: '小先知书', chapters: 4,  emoji: '🔁', tagline: '预备主的路', theme: '责备、悔改、以利亚、预备', author: '玛拉基', summary: '最后一位先知呼召百姓回转，预告以利亚的来临预备主的道路。', color: '#C05621' },

  /* ============ 新约 · 福音书 ============ */
  { id: 'matthew',        name: '马太福音',   en: 'Matthew',          testament: 'nt', category: '福音书',   chapters: 28, emoji: '👑', tagline: '君王降临',   theme: '弥赛亚、天国、教训、大使命', author: '马太', summary: '耶稣是所应许的君王与弥赛亚，从天国教训到大使命。', color: '#B83280' },
  { id: 'mark',           name: '马可福音',   en: 'Mark',             testament: 'nt', category: '福音书',   chapters: 16, emoji: '⚡', tagline: '服事的基督', theme: '仆人、行动、受苦、福音', author: '马可（彼得口述）', summary: '最简洁的福音书，聚焦耶稣的服事、受苦与复活。', color: '#DD6B20' },
  { id: 'luke',           name: '路加福音',   en: 'Luke',             testament: 'nt', category: '福音书',   chapters: 24, emoji: '🕊️', tagline: '人子耶稣',   theme: '怜悯、救恩、祷告、圣灵', author: '路加', summary: '最详细叙述耶稣的生平，强调祂对贫穷、妇人与外邦人的怜悯。', color: '#2B6CB0' },
  { id: 'john',           name: '约翰福音',   en: 'John',             testament: 'nt', category: '福音书',   chapters: 21, emoji: '❤️', tagline: '生命之道',   theme: '道成肉身、相信、生命、爱', author: '约翰', summary: '从永恒之道讲起：「信耶稣得生命」，充满七个神迹与七个「我是」。', color: '#C53030' },

  /* ============ 新约 · 历史书 ============ */
  { id: 'acts',           name: '使徒行传',   en: 'Acts',             testament: 'nt', category: '历史书',   chapters: 28, emoji: '🌍', tagline: '圣灵的工作', theme: '圣灵、教会、宣教、见证', author: '路加', summary: '圣灵降临，福音从耶路撒冷、犹太全地传到地极。', color: '#38A169' },

  /* ============ 新约 · 保罗书信 ============ */
  { id: 'romans',         name: '罗马书',     en: 'Romans',           testament: 'nt', category: '保罗书信', chapters: 16, emoji: '⚖️', tagline: '因信称义',   theme: '称义、恩典、信心、圣灵', author: '保罗', summary: '系统论述因信称义：世人都犯了罪，唯独靠恩典藉信心得救。', color: '#805AD5' },
  { id: '1corinthians',   name: '哥林多前书', en: '1 Corinthians',   testament: 'nt', category: '保罗书信', chapters: 16, emoji: '🏗️', tagline: '教会的根基', theme: '合一、圣灵恩赐、爱、复活', author: '保罗', summary: '解决教会纷争与道德问题，颂赞爱，阐明复活的盼望。', color: '#C53030' },
  { id: '2corinthians',   name: '哥林多后书', en: '2 Corinthians',   testament: 'nt', category: '保罗书信', chapters: 13, emoji: '🌧️', tagline: '软弱中的能力', theme: '安慰、软弱、慷慨、使徒', author: '保罗', summary: '在软弱中经历神的能力，呼吁哥林多教会悔改与奉献。', color: '#9B2C2C' },
  { id: 'galatians',      name: '加拉太书',   en: 'Galatians',        testament: 'nt', category: '保罗书信', chapters: 6,  emoji: '🕊️', tagline: '福音的自由', theme: '恩典、自由、律法、圣灵', author: '保罗', summary: '捍卫因信称义的福音，宣告基督里的自由与圣灵的生活。', color: '#2F855A' },
  { id: 'ephesians',      name: '以弗所书',   en: 'Ephesians',        testament: 'nt', category: '保罗书信', chapters: 6,  emoji: '🏰', tagline: '教会的奥秘', theme: '教会、合一、恩典、属灵争战', author: '保罗', summary: '从天上来的异象：在基督里的合一、新生活与属灵军装。', color: '#6B46C1' },
  { id: 'philippians',    name: '腓立比书',   en: 'Philippians',      testament: 'nt', category: '保罗书信', chapters: 4,  emoji: '😊', tagline: '喜乐的秘诀', theme: '喜乐、谦卑、知足、合一', author: '保罗', summary: '在监狱中写下的喜乐之书：以基督为至宝，凡事靠主喜乐。', color: '#D69E2E' },
  { id: 'colossians',     name: '歌罗西书',   en: 'Colossians',       testament: 'nt', category: '保罗书信', chapters: 4,  emoji: '🌌', tagline: '基督的超越', theme: '基督、丰盛、新造、智慧', author: '保罗', summary: '高举基督的超越与丰盛，驳斥异端，活出与基督联合的新生活。', color: '#3182CE' },
  { id: '1thessalonians', name: '帖撒罗尼迦前书', en: '1 Thessalonians', testament: 'nt', category: '保罗书信', chapters: 5, emoji: '🌅', tagline: '盼望的教会', theme: '信心、爱心、盼望、主再来', author: '保罗', summary: '称赞帖撒罗尼迦教会的信心爱心，安慰关于主再来的盼望。', color: '#2B6CB0' },
  { id: '2thessalonians', name: '帖撒罗尼迦后书', en: '2 Thessalonians', testament: 'nt', category: '保罗书信', chapters: 3, emoji: '⏳', tagline: '主来的日子', theme: '主再来、警醒、殷勤、坚固', author: '保罗', summary: '纠正对主再来日期的误解，劝勉警醒、殷勤做工。', color: '#4A5568' },
  { id: '1timothy',       name: '提摩太前书', en: '1 Timothy',       testament: 'nt', category: '保罗书信', chapters: 6,  emoji: '🛡️', tagline: '牧养的托付', theme: '教牧、真理、敬虔、榜样', author: '保罗', summary: '教导提摩太如何在教会中牧养、守望纯正真理。', color: '#C05621' },
  { id: '2timothy',       name: '提摩太后书', en: '2 Timothy',       testament: 'nt', category: '保罗书信', chapters: 4,  emoji: '🔥', tagline: '传承的使命', theme: '忠心、受苦、圣经、传承', author: '保罗', summary: '保罗最后的嘱咐：为福音受苦、忠于圣经、传承使命。', color: '#DD6B20' },
  { id: 'titus',          name: '提多书',     en: 'Titus',            testament: 'nt', category: '保罗书信', chapters: 3,  emoji: '🏛️', tagline: '教会的秩序', theme: '善行、教会治理、敬虔', author: '保罗', summary: '嘱咐提多在各城设立长老，教导敬虔生活与善行。', color: '#2F855A' },
  { id: 'philemon',       name: '腓利门书',   en: 'Philemon',         testament: 'nt', category: '保罗书信', chapters: 1,  emoji: '🤝', tagline: '爱中接纳',   theme: '饶恕、接纳、主内平等', author: '保罗', summary: '为逃跑的奴隶阿尼西母求情，彰显主里彼此接纳的爱。', color: '#38A169' },

  /* ============ 新约 · 普通书信 ============ */
  { id: 'hebrews',        name: '希伯来书',   en: 'Hebrews',          testament: 'nt', category: '普通书信', chapters: 13, emoji: '⛰️', tagline: '更美的约',   theme: '基督、更美、信心、坚忍', author: '不详', summary: '基督超越一切，是新约的中保；勉励信心坚忍，仰望更美的家乡。', color: '#6B46C1' },
  { id: 'james',          name: '雅各书',     en: 'James',            testament: 'nt', category: '普通书信', chapters: 5,  emoji: '🛤️', tagline: '信心的行动', theme: '试炼、信心、行为、智慧', author: '雅各（主的兄弟）', summary: '信心没有行为是死的：在试炼中活出真信心与智慧。', color: '#2F855A' },
  { id: '1peter',         name: '彼得前书',   en: '1 Peter',          testament: 'nt', category: '普通书信', chapters: 5,  emoji: '⚓', tagline: '苦难中的盼望', theme: '盼望、圣洁、顺服、受苦', author: '彼得', summary: '在苦难与寄居中，活出圣洁与盼望，将荣耀归给神。', color: '#3182CE' },
  { id: '2peter',         name: '彼得后书',   en: '2 Peter',          testament: 'nt', category: '普通书信', chapters: 3,  emoji: '📖', tagline: '真理的根基', theme: '真知识、假教师、主再来', author: '彼得', summary: '提醒真知识、防备假教师，等候主再来。', color: '#2B6CB0' },
  { id: '1john',          name: '约翰一书',   en: '1 John',           testament: 'nt', category: '普通书信', chapters: 5,  emoji: '💡', tagline: '爱中相交',   theme: '相交、光明、爱、确据', author: '约翰', summary: '在光中与神相交，彼此相爱，得着永生的确据。', color: '#C53030' },
  { id: '2john',          name: '约翰二书',   en: '2 John',           testament: 'nt', category: '普通书信', chapters: 1,  emoji: '🚪', tagline: '爱与真理',   theme: '爱、真理、警醒', author: '约翰', summary: '在爱与真理中警醒，拒绝假教导。', color: '#9B2C2C' },
  { id: '3john',          name: '约翰三书',   en: '3 John',           testament: 'nt', category: '普通书信', chapters: 1,  emoji: '🤗', tagline: '接待与同行', theme: '接待、忠信、行善', author: '约翰', summary: '称赞该犹的接待与忠信，勉励效法善。', color: '#C05621' },
  { id: 'jude',           name: '犹大书',     en: 'Jude',             testament: 'nt', category: '普通书信', chapters: 1,  emoji: '🛡️', tagline: '竭力争辩',   theme: '护道、警醒、怜悯', author: '犹大（主的兄弟）', summary: '为真道竭力争辩，警醒防备假教师。', color: '#718096' },

  /* ============ 新约 · 预言书 ============ */
  { id: 'revelation',     name: '启示录',     en: 'Revelation',       testament: 'nt', category: '预言书',   chapters: 22, emoji: '🌅', tagline: '最终的盼望', theme: '基督再来、审判、新天新地、敬拜', author: '约翰', summary: '启示录：基督得胜，新天新地降临，「主耶稣啊，我愿你来」。', color: '#B7791F' }
];

/* 便捷索引 */
const bookIndex = {};
BOOKS.forEach(b => { bookIndex[b.id] = b; });

function getBook(id) { return bookIndex[id] || null; }
function getTestament(id) { return TESTAMENTS.find(t => t.id === id) || null; }
function booksOf(testamentId, category) {
  return BOOKS.filter(b => b.testament === testamentId && (!category || b.category === category));
}
function categoryOrder(testamentId) {
  return getTestament(testamentId).categories;
}

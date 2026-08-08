/* ============================================================
 * 数据层 4：圣经主题地图（横向学习）
 * 66卷是纵向学习，主题是横向学习：看一个主题如何贯穿全本圣经
 * ============================================================ */

const THEMES = [
  {
    id: 'love', name: '爱', emoji: '❤️', color: '#E53E3E',
    desc: '从「神爱世人」到「彼此相爱」，爱是圣经从头到尾的主线。',
    verse: '约翰一书 4:19 「我们爱，因为神先爱我们。」',
    books: [
      { book: 'genesis', note: '神与亚伯拉罕立约的爱' },
      { book: 'leviticus', note: '「爱人如己」的律法' },
      { book: 'deuteronomy', note: '尽心尽性尽意爱主你的神' },
      { book: 'psalms', note: '「祂的慈爱永远长存」' },
      { book: 'proverbs', note: '爱能遮掩一切过错' },
      { book: 'songofsongs', note: '爱情与委身的颂歌' },
      { book: 'hosea', note: '神不离不弃的盟约之爱' },
      { book: 'matthew', note: '最大的诫命：爱神爱人' },
      { book: 'john', note: '神爱世人，赐下独生子' },
      { book: '1corinthians', note: '爱的真谛（爱的颂歌）' },
      { book: '1john', note: '神就是爱，住在爱里的住在神里面' }
    ]
  },
  {
    id: 'prayer', name: '祷告', emoji: '🙏', color: '#3182CE',
    desc: '祷告是与神对话：求告、赞美、认罪、代求，贯穿整本圣经。',
    verse: '腓立比书 4:6-7 「凡事藉着祷告、祈求和感谢……神所赐出人意外的平安。」',
    books: [
      { book: 'genesis', note: '亚伯拉罕为所多玛代求' },
      { book: 'exodus', note: '摩西在红海边呼求' },
      { book: '1samuel', note: '哈拿的倾心吐意' },
      { book: 'psalms', note: '整卷书就是一本祷告书' },
      { book: 'daniel', note: '但以理一日三次祷告' },
      { book: 'jonah', note: '鱼腹中的祷告' },
      { book: 'luke', note: '耶稣常常独自祷告' },
      { book: 'acts', note: '教会同心合意恒切祷告' },
      { book: 'philippians', note: '凡事藉着祷告祈求和感谢' },
      { book: 'james', note: '义人的祈祷大有功效' }
    ]
  },
  {
    id: 'suffering', name: '苦难', emoji: '😢', color: '#718096',
    desc: '圣经不回避苦难，而是在苦难中显明神的同在与最终的安慰。',
    verse: '罗马书 8:28 「万事都互相效力，叫爱神的人得益处。」',
    books: [
      { book: 'genesis', note: '约瑟：被卖却成了祝福' },
      { book: 'job', note: '义人约伯的苦难之问' },
      { book: 'psalms', note: '哀歌中的呼求' },
      { book: 'lamentations', note: '在哀伤中仰望神的信实' },
      { book: 'isaiah', note: '受苦的仆人' },
      { book: 'habakkuk', note: '从困惑到信靠' },
      { book: 'mark', note: '受苦的人子' },
      { book: 'romans', note: '患难生忍耐，忍耐生老练' },
      { book: '2corinthians', note: '在软弱中显完全' },
      { book: '1peter', note: '苦难中的盼望' },
      { book: 'revelation', note: '神要擦去一切眼泪' }
    ]
  },
  {
    id: 'forgiveness', name: '饶恕', emoji: '🤝', color: '#38A169',
    desc: '从约瑟饶恕哥哥们，到耶稣在十字架上求父赦免，饶恕是福音的记号。',
    verse: '以弗所书 4:32 「并要以恩慈相待……彼此饶恕，正如神在基督里饶恕了你们一样。」',
    books: [
      { book: 'genesis', note: '约瑟饶恕出卖他的哥哥们' },
      { book: 'exodus', note: '神的赦免与重新立约' },
      { book: 'psalms', note: '大卫的悔罪与蒙赦' },
      { book: 'isaiah', note: '「你们的罪虽像朱红，必变成雪白」' },
      { book: 'micah', note: '神将我们的罪投于深海' },
      { book: 'matthew', note: '免我们的债，如同我们免了人的债' },
      { book: 'luke', note: '浪子回头的父亲' },
      { book: 'philemon', note: '接纳曾犯错的人' },
      { book: 'colossians', note: '主怎样饶恕了你们，你们也要怎样饶恕人' }
    ]
  },
  {
    id: 'anxiety', name: '忧虑', emoji: '😨', color: '#D69E2E',
    desc: '面对焦虑，圣经给的不是鸡汤，而是把眼光转向那位看顾我们的天父。',
    verse: '马太福音 6:34 「所以，不要为明天忧虑，因为明天自有明天的忧虑。」',
    books: [
      { book: 'exodus', note: '红海前的「不要惧怕，只管站住」' },
      { book: 'psalms', note: '「我惧怕的时候要倚靠你」' },
      { book: 'proverbs', note: '心中安静是肉体的生命' },
      { book: 'isaiah', note: '「你不要害怕，因为我与你同在」' },
      { book: 'matthew', note: '不要忧虑：天上的飞鸟与野地的花' },
      { book: 'john', note: '「你们心里不要忧愁」' },
      { book: 'philippians', note: '一无挂虑，凡事祷告' },
      { book: '1peter', note: '把一切忧虑卸给神，因为祂顾念你们' }
    ]
  },
  {
    id: 'money', name: '金钱', emoji: '💰', color: '#B7791F',
    desc: '圣经不否定金钱，而是呼召人以神为主、以慷慨回应恩典。',
    verse: '马太福音 6:21 「因为你的财宝在哪里，你的心也在那里。」',
    books: [
      { book: 'genesis', note: '亚伯拉罕的富足与抉择' },
      { book: 'deuteronomy', note: '不可贪恋、要记念赐福的神' },
      { book: 'proverbs', note: '「你要以财物和一切初熟的土产尊荣耶和华」' },
      { book: 'ecclesiastes', note: '钱财的虚空' },
      { book: 'haggai', note: '先求神的国，仓房才有祝福' },
      { book: 'matthew', note: '不能又事奉神又事奉玛门' },
      { book: 'luke', note: '无知的财主' },
      { book: '2corinthians', note: '少种的少收，多种的多收' },
      { book: '1timothy', note: '贪财是万恶之根' }
    ]
  },
  {
    id: 'family', name: '家庭', emoji: '👨‍👩‍👧', color: '#DD6B20',
    desc: '从亚伯拉罕之家到耶稣的家庭，圣经看重家庭中的爱与传承。',
    verse: '申命记 6:6-7 「我今日所吩咐你的话都要记在心上，也要殷勤教训你的儿女。」',
    books: [
      { book: 'genesis', note: '亚伯拉罕、以撒、雅各的家庭故事' },
      { book: 'exodus', note: '逾越节：家庭中的信仰传承' },
      { book: 'deuteronomy', note: '教训儿女：家庭信仰教育' },
      { book: 'ruth', note: '婆媳之间的忠诚与爱' },
      { book: 'proverbs', note: '智慧妇人建立家室' },
      { book: 'luke', note: '耶稣在拿撒勒的家庭生活' },
      { book: 'ephesians', note: '丈夫爱妻子、儿女孝敬父母' },
      { book: 'colossians', note: '家庭的彼此顺服' }
    ]
  },
  {
    id: 'salvation', name: '救恩', emoji: '✝️', color: '#C53030',
    desc: '从出埃及到十字架，救恩是神主动的行动：祂拯救、祂赎回。',
    verse: '以弗所书 2:8-9 「你们得救是本乎恩，也因着信；这并不是出于自己，乃是神所赐的。」',
    books: [
      { book: 'exodus', note: '逾越节羔羊：救赎的预表' },
      { book: 'leviticus', note: '献祭制度指向赦罪' },
      { book: 'isaiah', note: '「祂为我们的过犯受害」' },
      { book: 'jonah', note: '神也拯救外邦人' },
      { book: 'john', note: '「叫一切信祂的，不致灭亡，反得永生」' },
      { book: 'acts', note: '「除祂以外，别无拯救」' },
      { book: 'romans', note: '因信称义的系统论述' },
      { book: 'galatians', note: '福音的自由' },
      { book: 'hebrews', note: '更美之约的大祭司' }
    ]
  },
  {
    id: 'holyspirit', name: '圣灵', emoji: '🕊️', color: '#4299E1',
    desc: '圣灵是保惠师：叫人重生、赐下能力、结出果子、见证基督。',
    verse: '约翰福音 14:26 「但保惠师，就是父因我的名所要差来的圣灵……要将一切的事指教你们。」',
    books: [
      { book: 'genesis', note: '神的灵运行在水面上' },
      { book: 'ezekiel', note: '枯骨复生：圣灵的气息' },
      { book: 'joel', note: '「我要将我的灵浇灌凡有血气的」' },
      { book: 'luke', note: '圣灵充满与祷告' },
      { book: 'john', note: '重生与保惠师的应许' },
      { book: 'acts', note: '圣灵降临与教会诞生' },
      { book: 'romans', note: '圣灵里的生命' },
      { book: 'galatians', note: '圣灵的果子' },
      { book: '1corinthians', note: '圣灵的恩赐' }
    ]
  },
  {
    id: 'kingdom', name: '神的国', emoji: '👑', color: '#805AD5',
    desc: '神的国不是地理的国度，而是神掌权的领域：现在临到，将来完全。',
    verse: '马太福音 6:10 「愿你的国降临；愿你的旨意行在地上，如同行在天上。」',
    books: [
      { book: 'exodus', note: '神作王、作百姓的国度' },
      { book: 'psalms', note: '「耶和华作王」' },
      { book: 'daniel', note: '「祂的国必不败坏」' },
      { book: 'obadiah', note: '国度就归耶和华了' },
      { book: 'matthew', note: '天国近了：天国的比喻' },
      { book: 'mark', note: '神国的奥秘' },
      { book: 'romans', note: '神的国在乎公义、和平并圣灵中的喜乐' },
      { book: 'revelation', note: '世上的国成了我主和主基督的国' }
    ]
  },
  {
    id: 'faith', name: '信心', emoji: '🔥', color: '#DD6B20',
    desc: '信心是未见之事的实底，是圣经英雄们共同的生命轴线。',
    verse: '希伯来书 11:1 「信就是所望之事的实底，是未见之事的确据。」',
    books: [
      { book: 'genesis', note: '亚伯拉罕信神，就算为义' },
      { book: 'exodus', note: '过红海的信心' },
      { book: 'joshua', note: '绕耶利哥城得胜' },
      { book: 'daniel', note: '狮子坑中的信心' },
      { book: 'habakkuk', note: '「义人因信得生」' },
      { book: 'matthew', note: '「照着你们的信心给你们成全」' },
      { book: 'romans', note: '因信称义' },
      { book: 'hebrews', note: '信心英雄榜' },
      { book: 'james', note: '信心与行为并行' }
    ]
  },
  {
    id: 'resurrection', name: '复活', emoji: '🌅', color: '#D69E2E',
    desc: '复活是基督教信仰的基石：基督复活了，我们也必复活。',
    verse: '哥林多前书 15:20 「但基督已经从死里复活，成为睡了之人初熟的果子。」',
    books: [
      { book: 'ezekiel', note: '枯骨复生的异象' },
      { book: 'hosea', note: '「过两天祂必使我们苏醒」' },
      { book: 'daniel', note: '「睡在尘埃中的必有多人复醒」' },
      { book: 'matthew', note: '空坟墓与复活显现' },
      { book: 'mark', note: '「祂不在这里，已经复活了」' },
      { book: 'luke', note: '以马忤斯路上的复活主' },
      { book: 'john', note: '「我是复活，我是生命」' },
      { book: '1corinthians', note: '复活身体的荣耀' },
      { book: 'revelation', note: '第一次与第二次的复活' }
    ]
  },
  {
    id: 'worship', name: '敬拜', emoji: '🛐', color: '#B83280',
    desc: '敬拜不是一场节目，而是全人以心灵和诚实回应神的配得。',
    verse: '约翰福音 4:24 「神是个灵，所以拜祂的必须用心灵和诚实拜祂。」',
    books: [
      { book: 'genesis', note: '亚伯拉罕筑坛敬拜' },
      { book: 'exodus', note: '会幕：神与人同在的敬拜' },
      { book: 'leviticus', note: '献祭与节期的敬拜' },
      { book: '1chronicles', note: '大卫设立敬拜的职分' },
      { book: 'psalms', note: '「你们要赞美耶和华」' },
      { book: 'isaiah', note: '「圣哉！圣哉！圣哉！」' },
      { book: 'john', note: '心灵和诚实的敬拜' },
      { book: 'revelation', note: '天上宝座前的敬拜' }
    ]
  },
  {
    id: 'hope', name: '盼望', emoji: '🌟', color: '#3182CE',
    desc: '圣经的盼望不是乐观，而是对神应许的确定：末后的日子有荣耀。',
    verse: '耶利米书 29:11 「耶和华说：我知道我向你们所怀的意念，是赐平安的意念，不是降灾祸的意念，要叫你们末后有指望。」',
    books: [
      { book: 'genesis', note: '应许之地的盼望' },
      { book: 'lamentations', note: '「每早晨这都是新的」' },
      { book: 'isaiah', note: '新天新地的应许' },
      { book: 'romans', note: '盼望不至于羞耻' },
      { book: '1thessalonians', note: '主再来的安慰' },
      { book: 'titus', note: '「有福的盼望」' },
      { book: '1peter', note: '活泼的盼望' },
      { book: 'revelation', note: '「我必快来」' }
    ]
  }
];

const themeIndex = {};
THEMES.forEach(t => { themeIndex[t.id] = t; });
function getTheme(id) { return themeIndex[id] || null; }

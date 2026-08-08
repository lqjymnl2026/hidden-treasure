/* ============================================================
 * 数据层 3：Chapter → Passage → Question → Quiz
 *             → Discussion → Application → Prayer
 * 精选章节的完整七步互动内容（第一阶段样例）
 * ============================================================ */

const LESSONS = {

  /* ============ 创世记 1 · 创造 ============ */
  'genesis.1': {
    title: '起初，神创造天地',
    minutes: 10,
    difficulty: 2,
    memoryVerse: '创世记 1:1 「起初，神创造天地。」',
    passage: '创世记 1:1-31',
    opening: {
      question: '在你看来，这个世界是怎么开始的？',
      options: ['纯粹是随机巧合', '大爆炸后自然演化', '一位有智慧的神精心创造', '我还没有认真想过']
    },
    observation: {
      question: '创世记第一章里，神在创造中反复宣告哪一句话，显明创造的次序与美善？',
      options: [
        { text: '「神说：要有光」', correct: false },
        { text: '「神看着是好的」', correct: true },
        { text: '「各从其类」', correct: false },
        { text: '「天地万物都造齐了」', correct: false }
      ]
    },
    discovery: {
      question: '读了创世记第一章，你看见神是一位怎样的神？',
      options: [
        { key: 'A', text: '祂有主权：说有就有，命立就立', correct: true },
        { key: 'B', text: '祂有智慧：创造有次序、有设计', correct: true },
        { key: 'C', text: '祂顾念人：把人放在创造的顶点', correct: true },
        { key: 'D', text: '以上都看见', correct: true }
      ],
      note: '神不只是「创造者」，更是「有设计、有旨意」的创造主。祂造人，是要人与祂同行。'
    },
    discussion: {
      prompt: '如果世界真是神精心创造的，你的生命会有什么不一样？',
      samples: [
        '我会更珍惜自己的身体和身边的人，因为一切都是神赐的礼物。',
        '我会在工作学习时多一点敬畏：世界有设计，我的每一天也有意义。',
        '以前觉得是「运气」，现在想感谢那位造我的主。'
      ]
    },
    application: {
      prompt: '本周做一件「管理受托」的小事：善待环境、珍惜身体，或好好照顾你负责的人事物。',
      placeholder: '例如：今天早点休息，为健康感谢神……'
    },
    prayer: '创造天地的主，谢谢你用话语创造万有，也把我造得奇妙可畏。帮助我看见自己是你的杰作，每一天都为荣耀你而活。奉耶稣的名，阿们。'
  },

  /* ============ 马太福音 5 · 八福 ============ */
  'matthew.5': {
    title: '八福',
    minutes: 10,
    difficulty: 2,
    memoryVerse: '马太福音 5:3 「虚心的人有福了，因为天国是他们的。」',
    passage: '马太福音 5:1-12',
    opening: {
      question: '如果让你选择，你认为一个真正「有福」的人应该是什么样的人？',
      options: ['💰 有钱', '🏆 成功', '❤️ 被爱', '🙏 与神亲近', '😌 内心平安']
    },
    observation: {
      question: '耶稣在这段经文里连续用了多少次「有福」？',
      options: [
        { text: '6次', correct: false },
        { text: '8次', correct: true },
        { text: '9次', correct: false },
        { text: '10次', correct: false }
      ]
    },
    discovery: {
      question: '为什么耶稣说「哀恸的人有福了」？',
      options: [
        { key: 'A', text: '因为神看见人的痛苦', correct: true },
        { key: 'B', text: '因为哀恸能够带来安慰', correct: true },
        { key: 'C', text: '因为天国的价值观和世界不同', correct: true },
        { key: 'D', text: '以上都有', correct: true }
      ],
      note: '天国的价值观与世界的价值观常常相反：虚心、哀恸、温柔、饥渴慕义……耶稣翻转了我们对「福」的定义。'
    },
    discussion: {
      prompt: '八福中，哪一福最触动你？为什么？',
      samples: [
        '「哀恸的人有福了」最触动我——原来神不嫌弃我的眼泪。',
        '「温柔的人有福了」，我脾气急，这一福是对我的邀请。',
        '「清心的人必得见神」，我最想要的就是更多看见神。'
      ]
    },
    application: {
      prompt: '今天有没有一个人，需要你用「温柔」对待？',
      placeholder: '写下一个名字和一件你可以做的小事……'
    },
    prayer: '主耶稣，谢谢你把天国的价值观启示给我。求你让我的心成为虚心、温柔、怜恤人的心，使我在地上活出天国的福气。阿们。'
  },

  /* ============ 马太福音 28 · 大使命 ============ */
  'matthew.28': {
    title: '复活与大使命',
    minutes: 12,
    difficulty: 3,
    memoryVerse: '马太福音 28:19-20 「所以，你们要去，使万民作我的门徒……」',
    passage: '马太福音 28:1-20',
    opening: {
      question: '如果耶稣复活后只对门徒说一句话，你觉得最可能是哪一句？',
      options: ['「你们要小心」', '「我要离开你们了」', '「你们要去，使万民作我的门徒」', '「把这段经历写下来」']
    },
    observation: {
      question: '耶稣给门徒的大使命，包含哪几个关键动词？',
      options: [
        { text: '爱、信、守', correct: false },
        { text: '去、施洗、教训', correct: true },
        { text: '传、讲、写', correct: false },
        { text: '听、看、跟', correct: false }
      ]
    },
    discovery: {
      question: '为什么「我就常与你们同在」是这使命中最安慰的应许？',
      options: [
        { key: 'A', text: '说明神知道我们会孤单', correct: true },
        { key: 'B', text: '因为使命艰难，我们需要同行者', correct: true },
        { key: 'C', text: '耶稣的权柄托住我们的「去」', correct: true },
        { key: 'D', text: '以上都是', correct: true }
      ],
      note: '大使命以「天上地下所有的权柄」开始，以「我常与你们同在」结束：权柄加同行，是「去」的动力。'
    },
    discussion: {
      prompt: '在你的生活圈里（家庭、职场、学校），谁是神放在你身边的「万民」？',
      samples: [
        '我的同事小林，最近刚经历低谷，我想先关心他。',
        '我的爸妈还没信主，我愿意从「更爱他们」开始。',
        '我的孩子，我想每天睡前为他祷告。'
      ]
    },
    application: {
      prompt: '本周用「去」的行动：主动关心一位未信或远离神的亲友。',
      placeholder: '例如：发一条问候消息、约一次饭、为他祷告……'
    },
    prayer: '复活的主，谢谢你赐下权柄与同在。我愿意带着你的爱「去」，把福音带到我的家、我的职场、我的城市。阿们。'
  },

  /* ============ 诗篇 23 · 好牧人 ============ */
  'psalms.23': {
    title: '耶和华是我的牧者',
    minutes: 8,
    difficulty: 1,
    memoryVerse: '诗篇 23:1 「耶和华是我的牧者，我必不至缺乏。」',
    passage: '诗篇 23:1-6',
    opening: {
      question: '提到「牧者」，你脑海里会浮现怎样的画面？',
      options: ['🏞️ 青草地与溪水边', '🐑 被带领与被保护', '🏠 安息与归属', '🚶 走一段有方向的路']
    },
    observation: {
      question: '大卫宣告「耶和华是我的牧者」之后，紧接着说的第一句话是什么？',
      options: [
        { text: '祂使我躺卧在青草地上', correct: false },
        { text: '我必不至缺乏', correct: true },
        { text: '祂领我到可安歇的水边', correct: false },
        { text: '祂引导我走义路', correct: false }
      ]
    },
    discovery: {
      question: '为什么在「死荫的幽谷」里，大卫也「不怕遭害」？',
      options: [
        { key: 'A', text: '因为环境其实不危险', correct: false },
        { key: 'B', text: '因为他的杖和竿能赶走一切', correct: false },
        { key: 'C', text: '因为牧者与他同在，安慰他', correct: true },
        { key: 'D', text: '因为他天生勇敢', correct: false }
      ],
      note: '关键不是环境改变，而是「你与我同在」。同在，是幽谷中最大的安慰。'
    },
    discussion: {
      prompt: '你生命中的「死荫幽谷」是什么？你如何经历神的同在？',
      samples: [
        '工作的瓶颈期，每天靠诗篇23撑过来的。',
        '家人住院那段时间，最深的感受就是「祂与我同在」。',
        '面对未知的未来，我学着把自己交给这位牧者。'
      ]
    },
    application: {
      prompt: '记下今天神供应你的一件小事，睡前为此感恩。',
      placeholder: '例如：今天有人对我说了一句温暖的话……'
    },
    prayer: '耶和华我的牧者，谢谢你使我躺卧在青草地上，领我到可安歇的水边。在幽谷中，你的杖、你的竿都安慰我。阿们。'
  },

  /* ============ 约翰福音 3 · 重生 ============ */
  'john.3': {
    title: '重生',
    minutes: 12,
    difficulty: 2,
    memoryVerse: '约翰福音 3:16 「神爱世人，甚至将祂的独生子赐给他们……」',
    passage: '约翰福音 3:1-21',
    opening: {
      question: '如果有人说「人要重生才能进神的国」，你会怎么理解「重生」？',
      options: ['重新投胎做人', '重新开始、改过自新', '从神而来的新生命', '不明白，想弄清楚']
    },
    observation: {
      question: '耶稣对尼哥底母说，人若不是从什么生的，就不能见神的国？',
      options: [
        { text: '从母腹生', correct: false },
        { text: '从水和圣灵生', correct: true },
        { text: '从亚伯拉罕生', correct: false },
        { text: '从好行为生', correct: false }
      ]
    },
    discovery: {
      question: '约翰福音 3:16 被称为「福音的浓缩」，因为它包含了什么？',
      options: [
        { key: 'A', text: '神爱世人', correct: true },
        { key: 'B', text: '赐下独生子', correct: true },
        { key: 'C', text: '信的人得永生', correct: true },
        { key: 'D', text: '以上都是', correct: true }
      ],
      note: '爱—赐—信—得：四个字串起整本圣经的救恩故事。'
    },
    discussion: {
      prompt: '约翰福音 3:16 里，最打动你的是哪一个词？为什么？',
      samples: [
        '「爱」——原来神不是审判官，而是先爱了我。',
        '「世人」——包括我，也包括我以为不配的人。',
        '「永生」——不是死后才开始，而是现在就拥有的新生命。'
      ]
    },
    application: {
      prompt: '今天向一位朋友分享「神爱你」这一句话。',
      placeholder: '可以是一条消息、一通电话，或一个实际的关心……'
    },
    prayer: '神啊，谢谢你爱世人，甚至将你的独生子赐给我们。帮助我真实经历重生，也用爱去告诉别人这好消息。阿们。'
  },

  /* ============ 罗马书 3 · 因信称义 ============ */
  'romans.3': {
    title: '因信称义',
    minutes: 15,
    difficulty: 3,
    memoryVerse: '罗马书 3:23-24 「因为世人都犯了罪，亏缺了神的荣耀；如今却蒙神的恩典，因基督耶稣的救赎，就白白地称义。」',
    passage: '罗马书 3:9-31',
    opening: {
      question: '你觉得一个人「在神面前被称为义」，靠的是什么？',
      options: ['做好事积功德', '遵守道德良心', '神的恩典，凭信心领受', '不清楚什么是称义']
    },
    observation: {
      question: '保罗说「世人都犯了罪」，亏缺了什么？',
      options: [
        { text: '神的律法', correct: false },
        { text: '神的荣耀', correct: true },
        { text: '神的祝福', correct: false },
        { text: '神的同在', correct: false }
      ]
    },
    discovery: {
      question: '什么是「因信称义」？',
      options: [
        { key: 'A', text: '靠行为赚取义', correct: false },
        { key: 'B', text: '凭信心领受神白白的恩典', correct: true },
        { key: 'C', text: '靠宗教仪式换取', correct: false },
        { key: 'D', text: '靠比别人更道德', correct: false }
      ],
      note: '称义是法庭式的宣告：神看我们「在基督里」为义，不是因为我们配，而是因为祂的恩典。'
    },
    discussion: {
      prompt: '明白「因信称义」之后，你心里的重担有什么变化？',
      samples: [
        '不再需要用表现证明自己，心里轻松了很多。',
        '以前总觉得「我不够好」，现在知道神先接纳了我。',
        '我愿意开始学习饶恕自己，因为神已经称我为义。'
      ]
    },
    application: {
      prompt: '今天不再靠表现赚取爱，安静领受「在基督里被称为义」的恩典。',
      placeholder: '写下此刻你想对神说的话……'
    },
    prayer: '公义又慈爱的神，谢谢你藉着耶稣的宝血使我称义。我不再活在定罪里，求你让我活在恩典与自由中。阿们。'
  },

  /* ============ 雅各书 1 · 试炼中的信心 ============ */
  'james.1': {
    title: '试炼中的信心',
    minutes: 12,
    difficulty: 2,
    memoryVerse: '雅各书 1:2-3 「我的弟兄们，你们落在百般试炼中，都要以为大喜乐；因为知道你们的信心经过试验，就生忍耐。」',
    passage: '雅各书 1:1-18',
    opening: {
      question: '当试炼（考验、困难）临到时，你的第一反应通常是？',
      options: ['😟 焦虑害怕', '😤 抱怨不平', '🤔 想办法解决', '🙏 先祷告交托']
    },
    observation: {
      question: '雅各说，落在百般试炼中，要以为怎样？',
      options: [
        { text: '倒霉', correct: false },
        { text: '大喜乐', correct: true },
        { text: '忍耐就好', correct: false },
        { text: '忧愁', correct: false }
      ]
    },
    discovery: {
      question: '试炼如何帮助我们成长？',
      options: [
        { key: 'A', text: '生忍耐', correct: true },
        { key: 'B', text: '使信心成全、完备、毫无缺欠', correct: true },
        { key: 'C', text: '让我们更真实地亲近神', correct: true },
        { key: 'D', text: '以上都是', correct: true }
      ],
      note: '不是试炼本身是好事，而是神能在试炼中炼出我们信心的「肌肉」。'
    },
    discussion: {
      prompt: '最近一次试炼中，神教了你什么功课？',
      samples: [
        '学会了在开口抱怨前先祷告。',
        '发现原来很多事不在我的掌控中，学习交托。',
        '低谷里反而更真实地读经祷告，灵命长大了一圈。'
      ]
    },
    application: {
      prompt: '写下你正在面对的试炼，并求神给你「大喜乐」的眼光。',
      placeholder: '我正在面对的试炼是……'
    },
    prayer: '主啊，当试炼临到，求你赐我喜乐与智慧，使我的信心经过试验就生忍耐，生命渐渐成全完备。阿们。'
  },

  /* ============ 启示录 21 · 新天新地 ============ */
  'revelation.21': {
    title: '新天新地',
    minutes: 15,
    difficulty: 3,
    memoryVerse: '启示录 21:4 「神要擦去他们一切的眼泪；不再有死亡，也不再有悲哀、哭号、疼痛……」',
    passage: '启示录 21:1-27',
    opening: {
      question: '如果可以想象一个「完美的新世界」，你的画面里会有什么？',
      options: ['🏡 没有疾病的家人', '🤝 不再有纷争的世界', '🌈 平安与喜乐', '👑 与神面对面']
    },
    observation: {
      question: '在新天新地里，神要亲自做什么？',
      options: [
        { text: '审判列国', correct: false },
        { text: '与人同住，擦去一切眼泪', correct: true },
        { text: '重建圣殿', correct: false },
        { text: '颁布新律法', correct: false }
      ]
    },
    discovery: {
      question: '启示录 21 章为什么能给人这么大的盼望？',
      options: [
        { key: 'A', text: '不再有死亡', correct: true },
        { key: 'B', text: '不再有悲哀、哭号、疼痛', correct: true },
        { key: 'C', text: '神要亲自与我们同在', correct: true },
        { key: 'D', text: '以上都是', correct: true }
      ],
      note: '新天新地不是「复制现在的好日子」，而是「神同在、一切更新」的完全境界。'
    },
    discussion: {
      prompt: '如果知道结局是「新天新地」，你现在的生活态度会有什么改变？',
      samples: [
        '会更看重永恒的事，少为眼前的小事焦虑。',
        '会更有勇气面对苦难，因为知道终点是喜乐。',
        '会更珍惜身边的人，因为我们要一起走向那个新世界。'
      ]
    },
    application: {
      prompt: '用「终局」的眼光，为今天的一个难处祷告。',
      placeholder: '主啊，我把这个难处交给你……'
    },
    prayer: '主耶稣，谢谢你应许新天新地，在那里你要擦去我们一切的眼泪。让我带着盼望度过每一天——主耶稣啊，我愿你来。阿们。'
  }
};

function getLesson(bookId, chapterNum) {
  return LESSONS[bookId + '.' + chapterNum] || null;
}

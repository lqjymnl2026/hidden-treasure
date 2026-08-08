/* ============================================================
 * 数据层 5：人物地图
 * 用户可以跟着人物的人生轨迹查圣经
 * ============================================================ */

const PEOPLE = [
  {
    id: 'david', name: '大卫', emoji: '👑', role: '合神心意之王',
    color: '#805AD5',
    summary: '从牧羊少年到以色列君王，大卫一生有高峰有低谷，却始终被称为「合神心意的人」。',
    books: [
      { book: '1samuel', note: '受膏、击杀歌利亚、逃亡' },
      { book: '2samuel', note: '作王、犯罪、悔改' },
      { book: '1kings', note: '晚年的交接' },
      { book: '1chronicles', note: '为圣殿预备' },
      { book: 'psalms', note: '他写下的诗篇' }
    ],
    journey: [
      { title: '少年牧羊', ref: '撒上16:11', note: '神看人的内心，拣选了大卫。' },
      { title: '受膏为王', ref: '撒上16:13', note: '撒母耳膏立大卫，圣灵大大感动他。' },
      { title: '击杀歌利亚', ref: '撒上17:49', note: '「争战的胜败全在乎耶和华」。' },
      { title: '逃亡岁月', ref: '撒上21-26', note: '被扫罗追杀，学习等候神的时机。' },
      { title: '成为君王', ref: '撒下5:1-5', note: '在希伯仑作王，统一以色列。' },
      { title: '犯罪跌倒', ref: '撒下11', note: '与拔示巴犯罪，用计杀害乌利亚。' },
      { title: '痛悔回转', ref: '撒下12:13; 诗51', note: '「神啊，求你按你的慈爱怜恤我」。' },
      { title: '晚年与传承', ref: '王上2; 代上28', note: '吩咐所罗门建殿，把国度交给下一代。' }
    ]
  },
  {
    id: 'abraham', name: '亚伯拉罕', emoji: '⭐', role: '信心之父',
    color: '#D69E2E',
    summary: '亚伯拉罕因信离开家乡，等候应许，成为「信心之父」，万国都要因他得福。',
    books: [
      { book: 'genesis', note: '蒙召、立约、献以撒' },
      { book: 'romans', note: '因信称义的榜样' },
      { book: 'galatians', note: '「亚伯拉罕信神，这就算为他的义」' },
      { book: 'hebrews', note: '凭信心等候那座有根基的城' }
    ],
    journey: [
      { title: '蒙召离开', ref: '创12:1-4', note: '「你要离开本地、本族、父家」。' },
      { title: '下埃及的失败', ref: '创12:10-20', note: '信心也有低谷，但神仍保守。' },
      { title: '与罗得分离', ref: '创13', note: '让出选择权，神赐他全地。' },
      { title: '神与他立约', ref: '创15', note: '「你向天观看，数算众星」。' },
      { title: '等待以实玛利', ref: '创16', note: '用人的方法等神的应许。' },
      { title: '割礼之约', ref: '创17', note: '神改名亚伯拉罕，作多国之父。' },
      { title: '接待天使', ref: '创18', note: '为所多玛代求。' },
      { title: '以撒出生', ref: '创21', note: '神按祂的应许成就。' },
      { title: '献以撒', ref: '创22', note: '「神必自己预备作燔祭的羊羔」。' }
    ]
  },
  {
    id: 'moses', name: '摩西', emoji: '🔥', role: '神的仆人',
    color: '#C05621',
    summary: '从法老宫中到旷野，摩西被神呼召，带领以色列人出埃及，领受律法。',
    books: [
      { book: 'exodus', note: '出埃及与十诫' },
      { book: 'leviticus', note: '献祭与圣洁的律法' },
      { book: 'numbers', note: '旷野四十年' },
      { book: 'deuteronomy', note: '临终前的重申律法' },
      { book: 'hebrews', note: '「摩西为神的家尽忠」' }
    ],
    journey: [
      { title: '河中救起', ref: '出2:1-10', note: '神预备的环境。' },
      { title: '王宫四十年', ref: '出2:10', note: '学了埃及一切的学问。' },
      { title: '米甸旷野', ref: '出2:15-22', note: '在旷野牧羊四十年，被神炼净。' },
      { title: '燃烧的荆棘', ref: '出3', note: '「我在这里」——神的呼召。' },
      { title: '十灾与出埃及', ref: '出7-12', note: '神以大能拯救祂的百姓。' },
      { title: '过红海', ref: '出14', note: '「不要惧怕，只管站住」。' },
      { title: '西奈山领受律法', ref: '出19-20', note: '神与以色列立约。' },
      { title: '旷野试炼', ref: '民20:1-13', note: '在米利巴水击打磐石。' },
      { title: '遥望应许之地', ref: '申34', note: '在尼波山看见迦南，被神埋葬。' }
    ]
  },
  {
    id: 'joseph', name: '约瑟', emoji: '🎯', role: '饶恕与预备',
    color: '#3182CE',
    summary: '被哥哥们出卖、被诬陷入狱，约瑟却看见「神的意思原是好的」，成为埃及宰相。',
    books: [
      { book: 'genesis', note: '37-50章的人生故事' },
      { book: 'psalms', note: '「祂命饥荒降在那地上……又在埃及地预备了约瑟」' },
      { book: 'acts', note: '司提反讲述约瑟的历史' }
    ],
    journey: [
      { title: '彩衣少年', ref: '创37:3', note: '父亲所爱的儿子。' },
      { title: '被卖为奴', ref: '创37:28', note: '被哥哥们卖到埃及。' },
      { title: '波提乏家中', ref: '创39:2-6', note: '「耶和华与他同在，他就百事顺利」。' },
      { title: '被诬下狱', ref: '创39:20', note: '为持守圣洁付上代价。' },
      { title: '狱中解梦', ref: '创40', note: '在患难中服事别人。' },
      { title: '为法老解梦', ref: '创41', note: '神将智慧赐给他。' },
      { title: '成为宰相', ref: '创41:41', note: '从囚犯到宰相。' },
      { title: '与兄弟相认', ref: '创45', note: '「不要因为把我卖到这里自忧自恨」。' },
      { title: '饶恕与安葬', ref: '创50', note: '「神的意思原是好的」。' }
    ]
  },
  {
    id: 'peter', name: '彼得', emoji: '⚓', role: '跌倒又站起的使徒',
    color: '#2B6CB0',
    summary: '从渔夫到使徒，从三次否认主到五旬节放胆讲道，彼得的一生是恩典的见证。',
    books: [
      { book: 'matthew', note: '蒙召、认信、跌倒' },
      { book: 'mark', note: '彼得口述的福音书' },
      { book: 'luke', note: '打鱼的呼召' },
      { book: 'john', note: '「你爱我吗？你喂养我的羊」' },
      { book: 'acts', note: '五旬节讲道与服事' },
      { book: '1peter', note: '写给受苦教会的第一封书信' },
      { book: '2peter', note: '末了的嘱咐' }
    ],
    journey: [
      { title: '蒙召作渔夫', ref: '路5:1-11', note: '「把船开到水深之处」。' },
      { title: '认信基督', ref: '太16:16', note: '「你是基督，是永生神的儿子」。' },
      { title: '看见主的荣光', ref: '太17', note: '登山变像。' },
      { title: '三次否认主', ref: '路22:54-62', note: '鸡叫以先，你三次不认我。' },
      { title: '被主挽回', ref: '约21:15-19', note: '「你爱我吗？」三次的重新委身。' },
      { title: '五旬节讲道', ref: '徒2:14-41', note: '一次讲道，三千人信主。' },
      { title: '外邦人的门', ref: '徒10', note: '哥尼流家：福音临到外邦。' },
      { title: '牧养与殉道', ref: '彼前5', note: '「我快要脱离这帐棚了」。' }
    ]
  },
  {
    id: 'paul', name: '保罗', emoji: '✉️', role: '外邦人的使徒',
    color: '#C53030',
    summary: '从逼迫教会的扫罗，到为福音鞠躬尽瘁的保罗，他写了新约大半的书信。',
    books: [
      { book: 'acts', note: '大马士革路上的回转与宣教' },
      { book: 'romans', note: '因信称义' },
      { book: '1corinthians', note: '爱的颂歌与复活' },
      { book: '2corinthians', note: '软弱中的能力' },
      { book: 'galatians', note: '福音的自由' },
      { book: 'ephesians', note: '教会的奥秘' },
      { book: 'philippians', note: '喜乐的秘诀' },
      { book: '2timothy', note: '「那美好的仗我已经打过了」' }
    ],
    journey: [
      { title: '逼迫教会', ref: '徒8:3', note: '「扫罗却残害教会，进各人的家」。' },
      { title: '大马士革路上', ref: '徒9:1-9', note: '「扫罗，扫罗！你为什么逼迫我？」' },
      { title: '亚拿尼亚的接纳', ref: '徒9:10-19', note: '「他是我所拣选的器皿」。' },
      { title: '在安提阿被差遣', ref: '徒13:1-3', note: '第一次宣教之旅。' },
      { title: '耶路撒冷会议', ref: '徒15', note: '外邦人得救的真理被确认。' },
      { title: '第三次宣教', ref: '徒18-21', note: '在以弗所、希腊各地建立教会。' },
      { title: '被捕受审', ref: '徒21-26', note: '为福音被囚，仍放胆作见证。' },
      { title: '罗马的监牢', ref: '腓1; 提后4', note: '「活着就是基督，死了就有益处」。' }
    ]
  },
  {
    id: 'esther', name: '以斯帖', emoji: '👸', role: '勇敢的王后',
    color: '#DD6B20',
    summary: '一个孤儿女子被神放在王后的位置，「为现今的机会」，拯救了整个民族。',
    books: [
      { book: 'esther', note: '全书（1-10章）' }
    ],
    journey: [
      { title: '失去双亲', ref: '斯2:7', note: '被堂兄末底改收养。' },
      { title: '入宫选后', ref: '斯2:17', note: '「王爱以斯帖过于爱众女」。' },
      { title: '哈曼的阴谋', ref: '斯3', note: '灭绝犹太人的谕旨。' },
      { title: '「焉知你得了王后的位分」', ref: '斯4:14', note: '末底改的提醒。' },
      { title: '「我若死就死吧」', ref: '斯4:16', note: '禁食三日后冒死见王。' },
      { title: '两次筵席', ref: '斯5-7', note: '智慧地揭穿哈曼。' },
      { title: '拯救民族', ref: '斯8-9', note: '犹太人反败为胜，设立普珥日。' }
    ]
  },
  {
    id: 'ruth', name: '路得', emoji: '🌾', role: '忠诚的跟随者',
    color: '#D69E2E',
    summary: '「你往哪里去，我也往哪里去」——外邦女子路得以忠诚进入神的家谱，成为大卫的曾祖母。',
    books: [
      { book: 'ruth', note: '全书（1-4章）' },
      { book: 'matthew', note: '出现在耶稣的家谱中' }
    ],
    journey: [
      { title: '丧夫与抉择', ref: '得1', note: '「你的国就是我的国，你的神就是我的神」。' },
      { title: '拾麦穗', ref: '得2', note: '在波阿斯的田里殷勤做工。' },
      { title: '蒙波阿斯眷顾', ref: '得2:8-16', note: '恩典临到这位外邦女子。' },
      { title: '至近的亲属', ref: '得3-4', note: '波阿斯履行赎业之责。' },
      { title: '进入弥赛亚家谱', ref: '得4:17', note: '成为大卫的曾祖母。' }
    ]
  },
  {
    id: 'daniel', name: '但以理', emoji: '🦁', role: '忠心的守望者',
    color: '#6B46C1',
    summary: '在异教王宫中，但以理持守信仰、一日三次祷告，神保守他脱离狮子坑。',
    books: [
      { book: 'daniel', note: '全书（1-12章）' },
      { book: 'ezekiel', note: '被同代先知提及' }
    ],
    journey: [
      { title: '被掳入宫', ref: '但1', note: '立志不以王的膳玷污自己。' },
      { title: '解尼布甲尼撒之梦', ref: '但2', note: '「只有一位在天上的神能显明奥秘」。' },
      { title: '火窑中的三友', ref: '但3', note: '「即或不然，也决不事奉你的神」。' },
      { title: '伯沙撒的宴会', ref: '但5', note: '指头写字：「你被称在天平里显出亏欠」。' },
      { title: '狮子坑', ref: '但6', note: '一日三次祷告，神封住狮子的口。' },
      { title: '末后的异象', ref: '但7-12', note: '「智慧人必发光如穹苍的光芒」。' }
    ]
  },
  {
    id: 'job', name: '约伯', emoji: '🌪️', role: '苦难中的持守者',
    color: '#718096',
    summary: '一夜之间失去一切，约伯在苦难中质问神，最终在「风闻」与「亲眼看见」之间更认识神。',
    books: [
      { book: 'job', note: '全书（1-42章）' },
      { book: 'james', note: '「你们听见过约伯的忍耐」' }
    ],
    journey: [
      { title: '完全正直', ref: '伯1:1', note: '「敬畏神，远离恶事」。' },
      { title: '失去一切', ref: '伯1:13-22', note: '「赏赐的是耶和华，收取的也是耶和华」。' },
      { title: '三个朋友', ref: '伯2:11', note: '沉默七天七夜，然后开始辩论。' },
      { title: '苦难之问', ref: '伯3-31', note: '「我的肺腑啊，我的心哪！」' },
      { title: '以利户的插话', ref: '伯32-37', note: '「神藉着困苦救拔困苦人」。' },
      { title: '神从旋风中回答', ref: '伯38-41', note: '「我立大地根基的时候，你在哪里呢？」' },
      { title: '亲眼看见神', ref: '伯42:5', note: '「我从前风闻有你，现在亲眼看见你」。' },
      { title: '加倍赐福', ref: '伯42:10-17', note: '耶和华赐给约伯的比从前加倍。' }
    ]
  }
];

const peopleIndex = {};
PEOPLE.forEach(p => { peopleIndex[p.id] = p; });
function getPerson(id) { return peopleIndex[id] || null; }

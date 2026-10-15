export const abilityNames={platform:'平台认知',audience:'用户洞察',content:'内容创作',ip:'个人IP',data:'数据分析',operation:'账号运营',business:'商业化',strategy:'专业操盘'};

export const platforms=[
  {id:'douyin',name:'抖音',icon:'◈'},
  {id:'wechat',name:'视频号',icon:'◎'},
  {id:'xiaohongshu',name:'小红书',icon:'✳'},
  {id:'tiktok',name:'TikTok',icon:'♪'}
];

export const pipelineStages=['idea','research','script','shoot','edit','scheduled','published','review'];
export const pipelineLabels={idea:'灵感',research:'待研究',script:'待写脚本',shoot:'待拍摄',edit:'剪辑中',scheduled:'待发布',published:'已发布',review:'已复盘'};

export const tasks=[
  {id:'research',name:'研究一个用户需求或商业机会',type:'研究',ability:'audience',points:4},
  {id:'ideas',name:'产出 10 个候选选题',type:'选题',ability:'content',points:5},
  {id:'script',name:'完成 1 条可拍摄脚本',type:'脚本',ability:'content',points:6},
  {id:'camera',name:'完成真人出镜拍摄',type:'表达',ability:'ip',points:5},
  {id:'publish',name:'发布今日内容',type:'发布',ability:'operation',points:7},
  {id:'review',name:'记录数据并写下一条复盘结论',type:'复盘',ability:'data',points:6}
];

const makeRecords=()=>({content:[],topics:[],scripts:[],cases:[],reviews:[]});

export function initialState(){
  return {
    version:3,
    done:{},
    abilities:Object.fromEntries(Object.keys(abilityNames).map(k=>[k,0])),
    records:makeRecords(),
    profile:{
      position:'研究普通人副业和商业机会的博主',
      audience:'希望寻找靠谱副业、提升商业认知、建立个人IP的普通人',
      value:'研究机会、拆解模式、验证可行性，不夸大收益',
      pillars:'副业机会拆解\n商业机会研究\n认知与避坑\n90天成长记录'
    },
    training:{currentDay:1,startDate:'',streak:0,lastPublishDate:''},
    quiz:null
  };
}

export function normalizeState(raw){
  const base=initialState();
  if(!raw||typeof raw!=='object')return base;
  const rawRecords=raw.records&&typeof raw.records==='object'?raw.records:{};
  return {
    ...base,
    ...raw,
    version:3,
    done:{...base.done,...(raw.done||{})},
    abilities:{...base.abilities,...(raw.abilities||{})},
    records:{...base.records,...rawRecords},
    profile:{...base.profile,...(raw.profile||{})},
    training:{...base.training,...(raw.training||{}),currentDay:Math.max(1,Math.min(30,Number(raw?.training?.currentDay)||1))}
  };
}

export function toggleTask(state,id){
  const task=tasks.find(t=>t.id===id);
  if(!task)return state;
  const done={...state.done,[id]:!state.done[id]};
  return {
    ...state,
    done,
    abilities:{
      ...state.abilities,
      [task.ability]:Math.max(0,Math.min(100,(state.abilities[task.ability]||0)+(done[id]?task.points:-task.points)))
    }
  };
}

export function addRecord(state,type,record){
  if(!Object.hasOwn(state.records,type))return state;
  return {
    ...state,
    records:{
      ...state.records,
      [type]:[{...record,id:record.id||makeId(type),created:record.created||new Date().toLocaleDateString('zh-CN')},...state.records[type]]
    }
  };
}

export function scoreQuiz(answers,correct){
  if(!correct.length)return 0;
  return Math.round(correct.filter((x,i)=>x===answers[i]).length/correct.length*100);
}

export function overallProgress(state){
  return Math.round(tasks.filter(t=>state.done[t.id]).length/tasks.length*100);
}

export function getDayPlan(day){
  const n=Math.max(1,Math.min(90,Number(day)||1));
  let phase='基础内容训练';
  let cycle=1;
  let focus='建立定位、选题、脚本和真人表达的基本功';
  if(n>=31&&n<=60){cycle=2;phase='内容实验与增长';focus='把内容变成可验证的运营实验，形成系列和稳定栏目';}
  if(n>=61){cycle=3;phase='专业操盘训练';focus='训练账号诊断、内容战略、商业模式与客户操盘思维';}
  const tasksForDay=tasks.map(t=>({...t}));
  return {day:n,cycle,phase,focus,tasks:tasksForDay};
}

export function moveContent(state,id,stage){
  if(!pipelineStages.includes(stage))return state;
  return {
    ...state,
    records:{
      ...state.records,
      content:state.records.content.map(item=>item.id===id?{...item,stage,updatedAt:new Date().toISOString()}:item)
    }
  };
}

export function dashboardStats(state){
  const result=Object.fromEntries(pipelineStages.map(stage=>[stage,0]));
  const items=state?.records?.content||[];
  for(const item of items){if(Object.hasOwn(result,item.stage))result[item.stage]++;}
  result.total=items.length;
  result.publishedTotal=items.filter(x=>x.stage==='published'||x.stage==='review').length;
  return result;
}

export function createContentRecord(data={}){
  const title=String(data.title||data.topic||'').trim();
  if(!title)return null;
  return {
    id:makeId('content'),
    title,
    platform:data.platform||'douyin',
    stage:pipelineStages.includes(data.stage)?data.stage:'idea',
    audience:String(data.audience||''),
    angle:String(data.angle||''),
    hook:String(data.hook||''),
    script:String(data.script||''),
    publishedAt:String(data.publishedAt||''),
    metrics:data.metrics&&typeof data.metrics==='object'?data.metrics:{},
    created:new Date().toLocaleDateString('zh-CN'),
    createdAt:new Date().toISOString()
  };
}

export function createTopicRecord(data={}){
  const title=String(data.title||'').trim();
  if(!title)return null;
  return {
    id:makeId('topic'),title,
    platform:data.platform||'douyin',
    userProblem:String(data.userProblem||''),
    promise:String(data.promise||''),
    angle:String(data.angle||''),
    source:String(data.source||''),
    score:Number(data.score)||0,
    status:data.status||'待研究',
    created:new Date().toLocaleDateString('zh-CN')
  };
}

export function createScriptRecord(data={}){
  const title=String(data.title||'').trim();
  if(!title)return null;
  return {
    id:makeId('script'),title,
    platform:data.platform||'douyin',
    hook:String(data.hook||''),
    pain:String(data.pain||''),
    conflict:String(data.conflict||''),
    point:String(data.point||''),
    example:String(data.example||''),
    solution:String(data.solution||''),
    proof:String(data.proof||''),
    cta:String(data.cta||''),
    version:String(data.version||'V1'),
    created:new Date().toLocaleDateString('zh-CN')
  };
}

function makeId(prefix){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;}

export const trainingDays=[
  [1,'平台与用户','理解推荐、搜索、关注三种流量入口','写出你的目标用户一句话画像','研究3条同赛道内容，并发布一条“我为什么开始这30天研究”的真实起点内容','明天根据观察重写用户画像'],
  [2,'账号定位','区分赛道、定位、人设、价值主张','完成第一版IP定位卡','写出定位三句话，并发布一条“我不装副业大师，我会怎么研究”的定位内容','明天用3个陌生人视角检查是否听得懂'],
  [3,'用户痛点','学会从抱怨、搜索、评论里找需求','收集20个真实用户问题','把问题分类，并从中选1个做成今天的真人出镜短内容','明天从高频问题做选题'],
  [4,'选题基本功','学习痛点型、收益型、避坑型、反常识型选题','完成30个候选选题','筛选3个并各写一句观看理由，再把最强的1个拍成今日内容','明天只保留最想点开的1个'],
  [5,'标题与钩子','理解承诺、冲突、悬念和具体性','同一选题写10个开头','真人试读3个版本，选最自然的开头完成今日发布','明天对比哪个最自然、最清楚'],
  [6,'脚本结构','掌握钩子→问题→观点→证据→行动','完成1条60-90秒脚本','第一次完整真人拍摄并发布，记录自己最卡的三个表达点','明天看回放找表达卡点'],
  [7,'首次发布','学习发布前事实检查与平台适配','发布第1条真实内容','记录标题、封面、发布时间与链接','24小时后只记录真实数据'],
  [8,'表达训练','学习口语化、停顿、重音和镜头感','重录昨天最卡的一段3次','发布第2条内容','明天复盘表达而非只看播放'],
  [9,'价值密度','每15秒都要给用户一个继续看的理由','删掉脚本中30%的空话','发布第3条内容','记录掉线位置或主观拖沓点'],
  [10,'系列化','把单条选题扩成栏目而非重复标题','设计3个固定栏目','发布第4条并归属一个栏目','明天检查哪个栏目最容易持续'],
  [11,'副业判断','学习需求、成本、交付、复购、风险五问','拆1个副业模式','发布第5条机会/避坑内容','明天补充反例与风险'],
  [12,'商业机会','区分风口、需求、商业模式和变现方式','拆1个真实商业案例','发布第6条内容','明天检查是否把推测说成事实'],
  [13,'证据意识','区分事实、观点、经验和未核验说法','给脚本逐句标证据级别','发布第7条内容','明天把最弱的一句换成可验证表达'],
  [14,'两周复盘','学会看趋势而不是迷信单条爆款','完成7条内容对比表','发布第8条并只改一个变量','明天判断变量是否值得继续测'],
  [15,'钩子实验','同选题只改前三秒做A/B思维训练','写5个钩子并选2个试拍','发布第9条内容','明天记录哪种开头更符合自己'],
  [16,'评论洞察','评论区是用户语言库，不是只拿来互动','整理30条评论/搜索表达','发布第10条“用户原话型”内容','明天新增10个选题'],
  [17,'平台差异','同一主题按抖音/视频号/小红书/TikTok重写','完成一题四版','发布第11条主平台版本','明天比较平台改写差异'],
  [18,'搜索内容','学习关键词意图、问题词和长期搜索价值','做20个搜索型关键词','发布第12条搜索友好内容','明天检查标题是否真正回答关键词'],
  [19,'信任构建','观点必须有来源、经历或清晰推理','给脚本补1个证据或真实过程','发布第13条内容','明天记录哪部分最像“你”'],
  [20,'反常识表达','反常识不是反事实，要能解释为什么','写10个反常识命题筛1个','发布第14条内容','明天检查是否为了冲突而夸张'],
  [21,'三周复盘','建立选题→数据→结论→下一实验链路','完成前14条复盘矩阵','发布第15条延展内容','明天选出2个继续做的方向'],
  [22,'爆款拆解','只拆可观察结构，不脑补成功原因','深拆3条标杆内容','发布第16条结构借鉴内容','明天写清借了什么、没借什么'],
  [23,'个人观点','从资料搬运升级为有判断的表达','同一事实写3个不同观点','发布第17条观点内容','明天检查评论是否理解你的立场'],
  [24,'故事表达','用人物、场景、冲突、选择、结果承载观点','把1个观点改成故事脚本','发布第18条内容','明天复盘故事哪里拖'],
  [25,'内容资产','把高频元素沉淀成模板而不是每次重来','建立标题/钩子/CTA素材库','发布第19条模板化内容','明天确认模板有没有失去真实感'],
  [26,'商业模式地图','研究广告、咨询、知识产品、电商、服务、联盟等','完成6种商业模式对比','发布第20条商业认知内容','明天选2种最适合长期观察的模式'],
  [27,'账号诊断','学习定位、人群、内容、数据、转化五层诊断','诊断1个标杆账号','发布第21条拆解型内容','明天补充“证据不足”的地方'],
  [28,'30天内容计划','从灵感驱动升级为栏目和实验驱动','排未来30条选题','发布第22条内容','明天检查选题是否过度同质'],
  [29,'模拟操盘','用陌生账号做30分钟快速诊断','完成1份模拟操盘方案','发布第23条运营认知内容','明天自评哪些结论只是猜测'],
  [30,'周期毕业','总结定位、内容模型、表达、数据和下一阶段','完成30天毕业复盘与下一周期计划','发布第24条或30天总结内容','根据真实数据决定Day31-60实验重点']
].map(([day,title,learn,deliverable,action,feedback])=>({day,title,learn,deliverables:[deliverable],action,feedback}));

export function getTrainingDay(day){
  const n=Math.max(1,Math.min(30,Number(day)||1));
  return trainingDays[n-1];
}

export function closedLoopStatus(state){
  const order=tasks.map(t=>t.id);
  const next=order.find(id=>!state?.done?.[id]);
  return {complete:!next,next:next||'done',completed:order.filter(id=>state?.done?.[id]).length,total:order.length};
}

export const topicFrameworks=[
  '避坑型：很多人以为___，真正要先看___',
  '判断型：一个副业值不值得做，先看___',
  '反常识型：越想靠___赚钱，越要先别急着___',
  '拆解型：这个项目到底靠什么赚钱？钱从谁流向谁？',
  '成本型：看起来门槛很低，真正贵的是___',
  '失败型：为什么很多人做___没结果？',
  '机会型：变化发生在___，普通人的机会可能在___',
  '清单型：判断一个商业机会，我只看这5件事',
  '对比型：同样做___，为什么A赚钱而B很累？',
  '验证型：我不先相信这个机会，我先用___验证'
];

export const scriptFrameworks=[
  {name:'判断型',steps:['具体问题','常见误判','你的判断标准','案例/证据','一个行动']},
  {name:'避坑型',steps:['危险信号','为什么容易上当','真实成本/风险','怎么核验','边界提醒']},
  {name:'机会拆解型',steps:['机会是什么','谁在付钱','价值链','门槛与风险','适合谁/不适合谁']},
  {name:'观点型',steps:['冲突观点','为什么这么想','证据或观察','反例','有分寸的结论']},
  {name:'成长记录型',steps:['我遇到什么','我原来怎么想','做了什么','实际发现','下一步怎么验证']}
];

export const reviewFramework=[
  '这条内容原本想验证什么？',
  '数据最先在哪个环节出现异常或优势？',
  '哪些结论有数据支持，哪些仍然只是猜测？',
  '下一条只改哪一个变量？',
  '这条内容沉淀了什么可复用资产？'
];

export const benchmarkAccounts=[
  {name:'王小艳是个运营',platform:'douyin',url:'',confirmed:false,focus:'运营/IP方法'},
  {name:'薛辉小清新',platform:'douyin',url:'',confirmed:false,focus:'IP/内容表达'},
  {name:'直播运营东哥',platform:'douyin',url:'',confirmed:false,focus:'直播运营'},
  {name:'是铭铭呀',platform:'douyin',url:'https://www.douyin.com/user/MS4wLjABAAAAWnS5kN20EDjpicHKm1H2PIEB6XuI_ss0EHb2PZ8eWgOuLN4OY5ZDvj_1HPfHL9wn?from_tab_name=main&vid=7695970346990569905',confirmed:true,focus:'待持续拆解'},
  {name:'亲爱的安先生',platform:'douyin',url:'',confirmed:false,focus:'IP/内容'},
  {name:'小胡也是小狐',platform:'douyin',url:'https://v.douyin.com/C_Y-nJtumUk/',confirmed:true,focus:'待持续拆解'},
  {name:'鹤老师',platform:'douyin',url:'',confirmed:false,focus:'认知/IP'},
  {name:'袁梦｜良策文化',platform:'douyin',url:'',confirmed:false,focus:'IP/商业'}
];

export const lessons=[
  {title:'推荐系统到底在做什么？',tag:'基础认知',source:'公开机制 + 教学归纳',trust:'evidence',body:'推荐系统的目标不是平均分配流量，而是把内容匹配给可能感兴趣的人。公开资料通常讨论候选内容召回、排序和反馈等环节；各平台具体实现与权重并不公开。'},
  {title:'内容与用户如何匹配',tag:'用户洞察',source:'教学模型',trust:'opinion',body:'创作者要明确：谁会停下来、为什么看、看完会得到什么。不同用户对同一条内容的反应可能完全不同。'},
  {title:'哪些行为值得关注？',tag:'数据思维',source:'公开机制 + 行业经验',trust:'experience',body:'观看时长、完播、互动、分享、关注等都是值得分析的行为指标，但其重要性会因平台、场景与内容类型而变化。不要假设统一权重。'},
  {title:'“固定流量池”是铁律吗？',tag:'避坑指南',source:'审慎核查',trust:'unverified',body:'诸如“先给500播放、达到某个点赞率必进下一池”的固定公式，不能作为已验证的平台官方规则。应通过账号数据做实验，而不是照搬传言。'},
  {title:'个人IP与专业操盘的区别',tag:'职业路径',source:'教学归纳',trust:'opinion',body:'个人IP侧重持续建立可识别的价值与信任；专业操盘侧重围绕业务目标进行定位、内容生产、数据诊断、协作与迭代。两种能力相互支持。'}
];

export const quiz=[
  {q:'平台推荐机制最稳妥的理解是什么？',options:['所有内容平均分流','内容与可能感兴趣的用户匹配','点赞数决定一切'],answer:'b',why:'公开资料支持“匹配与预测行为”的方向，不支持统一单一指标。'},
  {q:'看到“固定500播放流量池”说法应如何处理？',options:['核查来源并用数据验证','立即作为平台官方规则执行','所有平台通用'],answer:'a',why:'具体阈值和私有权重通常无法从官方公开资料确认。'},
  {q:'专业运营复盘应该做什么？',options:['只看播放量','结合目标、指标、假设和下次实验','直接复制爆款标题'],answer:'b',why:'运营能力来自可验证的实验闭环。'}
];

export const rules=[
  {platform:'douyin',title:'抖音规则核查入口',desc:'官方安全与信任中心公开说明推荐系统会综合预测用户行为并进行多目标治理；具体私有权重和固定流量阈值并未公开。',url:'https://trust.douyin.com/',status:'官方入口·已核验',verifiedAt:'2026-10-15'},
  {platform:'wechat',title:'视频号规则核查',desc:'当前尚未可靠核验到可直接作为本软件条款依据的最新官方完整页面，因此不收录具体“敏感词表”或算法阈值。',url:'',status:'待核验',verifiedAt:'2026-10-15'},
  {platform:'xiaohongshu',title:'小红书社区公约 2.0',desc:'官方公约强调真实分享、尊重原创、对争议信息核验来源，并要求AI辅助创作进行清晰披露；不得用虚假财富、学历、收入或情感经历塑造人设。',url:'https://pgy.xiaohongshu.com/help/detail?id=1eda0a065dd894063c2e029a49e8f6a1&userType=4',status:'官方资料·已核验',verifiedAt:'2026-10-15'},
  {platform:'tiktok',title:'TikTok Community Guidelines',desc:'官方准则覆盖违规内容移除、年龄限制、For You推荐资格等治理；推广品牌、产品或服务时还需按官方要求进行商业内容披露。',url:'https://www.tiktok.com/community-guidelines/',status:'官方资料·已核验',verifiedAt:'2026-10-15'}
];

export function createReviewRecord(data={}){
  const title=String(data.title||'').trim();
  if(!title)return null;
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
  return {
    id:makeId('review'),
    title,
    platform:data.platform||'douyin',
    url:String(data.url||'').trim(),
    publishedAt:String(data.publishedAt||'').trim(),
    weakestStage:String(data.weakestStage||'').trim(),
    hypothesis:String(data.hypothesis||'').trim(),
    conclusion:String(data.conclusion||'').trim(),
    checkpoints:{
      h24:{views:num(data.views24),completion:num(data.completion24),engagement:num(data.engagement24),followers:num(data.followers24),conversions:num(data.conversions24)},
      h72:{views:num(data.views72),completion:num(data.completion72),engagement:num(data.engagement72),followers:num(data.followers72),conversions:num(data.conversions72)}
    },
    created:new Date().toLocaleDateString('zh-CN')
  };
}

export function suggestNextExperiment(review={}){
  const map={
    topic:{variable:'选题',action:'下一条只改选题：保持表达结构和时长接近，换成更具体、更强需求的问题。'},
    hook:{variable:'前三秒钩子',action:'下一条只改前三秒钩子：主体内容尽量不变，测试更具体的场景、冲突或结果承诺。'},
    structure:{variable:'内容结构',action:'下一条只改内容结构：减少绕路，让“问题→判断→证据→行动”更快出现。'},
    value:{variable:'价值密度',action:'下一条只改价值密度：删空话，增加一个可验证案例、判断标准或具体动作。'},
    trust:{variable:'信任证据',action:'下一条只改信任证据：补公开来源、真实过程、反例或明确的事实/观点边界。'},
    expression:{variable:'真人表达',action:'下一条只改表达：保留选题和脚本，训练停顿、重音、语速和镜头感。'},
    cta:{variable:'结尾互动',action:'下一条只改结尾：用一个自然、具体、容易回答的问题替代泛泛的“点赞关注”。'},
    positioning:{variable:'IP记忆点',action:'下一条只改IP记忆点：明确“我在研究什么、我如何验证、你为什么值得继续看”。'}
  };
  const picked=map[review.weakestStage];
  if(!picked)return {variable:'证据补全',action:'先补发布链接、24h/72h真实数据和你观察到的最弱环节，再决定下一条改什么。',note:'这是训练启发式，不是平台官方算法诊断。'};
  return {...picked,note:'这是训练启发式：依据你记录的弱环节设计单变量实验，不代表平台官方算法结论。'};
}

export const businessModels=[
  {name:'广告合作',payer:'品牌/机构',value:'用可信内容触达匹配人群',risk:'过早接广告会稀释信任；需清晰披露商业合作',validation:'先观察是否形成稳定垂直受众与自然咨询'},
  {name:'咨询/陪跑',payer:'有明确问题的个人或企业',value:'诊断问题并提供结构化方案与跟进',risk:'没有真实能力与案例时容易过度承诺',validation:'先用免费/低风险诊断练习验证自己是否能稳定交付'},
  {name:'知识产品',payer:'希望系统学习的人',value:'把重复出现的问题整理成课程、手册或训练营',risk:'内容同质、结果承诺和售后成本',validation:'先看同一问题是否被持续询问，再做最小版本'},
  {name:'电商/带货',payer:'消费者；品牌/平台可能提供佣金',value:'筛选和解释产品，降低选择成本',risk:'选品、质量、售后与合规责任',validation:'先验证受众需求与产品匹配，不以高佣金代替用户价值'},
  {name:'代运营/内容服务',payer:'企业/创作者',value:'定位、选题、脚本、制作、发布和复盘的专业执行',risk:'目标不清、权限边界和结果归因争议',validation:'先完成模拟操盘与小范围项目，明确交付边界'},
  {name:'联盟营销/推荐分成',payer:'商家或平台按规则结算',value:'把合适的产品/服务与有需求的人连接',risk:'利益冲突、披露不足、追求佣金导致错误推荐',validation:'只推荐真正研究过且与内容方向匹配的项目'},
  {name:'社群/会员',payer:'持续需要信息、交流或陪伴的成员',value:'稳定筛选信息、答疑、同行交流和行动机制',risk:'持续交付压力高，容易变成低质量信息群',validation:'先验证用户是否持续需要同一类支持'},
  {name:'数字工具/模板',payer:'希望提高效率的用户',value:'把重复流程做成模板、表格、提示词或软件工具',risk:'工具更新快、售后和数据安全要求高',validation:'先用自己的真实工作流反复使用，证明能稳定解决一个具体问题'}
];

export function advanceTrainingDay(state){
  const loop=closedLoopStatus(state);
  if(!loop.complete)return state;
  const current=Math.max(1,Math.min(30,Number(state?.training?.currentDay)||1));
  const next=Math.min(30,current+1);
  if(next===current)return state;
  return {...state,done:{},training:{...state.training,currentDay:next}};
}

export function createBackup(state){
  return JSON.stringify({schema:'new-media-academy-os-backup',version:3,exportedAt:new Date().toISOString(),state:normalizeState(state)},null,2);
}

export function restoreBackup(text){
  try{
    const parsed=JSON.parse(text);
    if(parsed?.schema!=='new-media-academy-os-backup'||!parsed.state||typeof parsed.state!=='object')return null;
    return normalizeState(parsed.state);
  }catch{return null;}
}

export const starterTopics=[
  {pillar:'副业机会拆解',title:'一个副业值不值得做，我会先看这5个问题',research:'查清谁付钱、交付什么、获客方式、成本和主要风险'},
  {pillar:'副业机会拆解',title:'为什么我研究副业时不会先问“能赚多少”',research:'整理收益数字容易失真的原因，并找可验证的经营变量'},
  {pillar:'副业机会拆解',title:'看起来“低门槛”的副业，真正门槛可能藏在哪里？',research:'列时间、技能、获客、设备、售后、平台规则等隐性成本'},
  {pillar:'副业机会拆解',title:'判断一个项目是不是生意，先找“谁在持续付钱”',research:'画出付款方、服务方和用户之间的价值链'},
  {pillar:'副业机会拆解',title:'副业项目里，最容易被忽略的获客成本是什么？',research:'研究至少2种获客渠道的时间和金钱成本'},
  {pillar:'副业机会拆解',title:'“零成本副业”真的零成本吗？我会怎么算这笔账',research:'把时间机会成本、学习成本和试错成本纳入'},
  {pillar:'副业机会拆解',title:'一个副业适不适合普通人，不只看门槛，还要看什么？',research:'比较技能、资源、现金流、时间和抗风险要求'},
  {pillar:'副业机会拆解',title:'我会怎么验证一个网上很火的副业项目',research:'只使用公开资料和小成本验证步骤，不先下结论'},
  {pillar:'商业机会研究',title:'商业机会和“热点”有什么区别？',research:'找一个热点和一个可持续需求做对比'},
  {pillar:'商业机会研究',title:'看到一个新风口，我会先画这张“钱从哪里来”的图',research:'明确付款方、收入来源、成本和利益相关方'},
  {pillar:'商业机会研究',title:'普通人研究商业机会，最值得盯的可能不是热搜',research:'研究需求变化、供给变化、成本变化和渠道变化'},
  {pillar:'商业机会研究',title:'为什么“很多人在做”既可能是机会，也可能是风险？',research:'分别找需求验证与竞争拥挤的证据'},
  {pillar:'商业机会研究',title:'一个行业突然变热，我会用哪4个问题判断能不能长期做',research:'检查需求持续性、差异化、交付能力、合规风险'},
  {pillar:'商业机会研究',title:'平台规则变化，为什么可能创造机会也可能摧毁机会？',research:'找真实平台政策更新作为案例并核验日期'},
  {pillar:'商业机会研究',title:'信息差不是“知道一个秘密”，更可能是什么？',research:'研究执行差、认知差、渠道差和效率差的具体例子'},
  {pillar:'商业机会研究',title:'我会怎么拆一个商业模式：客户、价值、渠道、成本、复购',research:'选择一个公开可观察案例逐项填写'},
  {pillar:'认知与避坑',title:'副业最危险的信号之一：只讲收入，不讲成本和失败率',research:'收集公开营销话术并分析缺失信息，不点名造谣'},
  {pillar:'认知与避坑',title:'“别人赚到了”为什么不等于“我也适合做”？',research:'拆资源、时机、能力和样本偏差'},
  {pillar:'认知与避坑',title:'看到收益截图时，我至少会核验哪几件事？',research:'整理来源、时间范围、口径、成本、可重复性等核验项'},
  {pillar:'认知与避坑',title:'真正值得警惕的，不是项目贵，而是你不知道钱花在哪',research:'区分工具、培训、获客、库存、服务等成本'},
  {pillar:'认知与避坑',title:'为什么越焦虑赚钱，越容易掉进“确定性承诺”里？',research:'用行为心理和营销机制解释，避免医学化判断'},
  {pillar:'认知与避坑',title:'一个项目不适合你，不代表它一定是骗局',research:'区分商业可行性、个人适配度和欺诈证据'},
  {pillar:'认知与避坑',title:'我现在不会做“副业推荐榜”，原因很简单',research:'解释证据不足、个体差异和动态变化'},
  {pillar:'认知与避坑',title:'判断商机最重要的能力之一：允许自己说“我还不知道”',research:'用一个待验证案例展示如何记录未知项'},
  {pillar:'90天成长记录',title:'我不是副业大师，我为什么还要做这个账号？',research:'只讲真实起点、研究方法和公开承诺'},
  {pillar:'90天成长记录',title:'一个零基础的人，怎么开始研究副业而不是到处抄答案？',research:'展示你的研究流程和今天实际做的步骤'},
  {pillar:'90天成长记录',title:'Day 1：我给自己定了一个“不装懂”的规则',research:'展示事实/观点/未核验三类标记方法'},
  {pillar:'90天成长记录',title:'我做这个账号的第一个目标，不是涨粉',research:'说明先建立稳定研究、发布和复盘能力'},
  {pillar:'90天成长记录',title:'今天我删掉了一句话，因为我找不到证据',research:'用真实脚本修改案例展示证据意识'},
  {pillar:'90天成长记录',title:'连续做内容后，我准备怎么判断自己有没有进步？',research:'定义选题、脚本、表达、发布、复盘等过程指标'},
  {pillar:'90天成长记录',title:'如果一条视频没人看，我不会立刻得出什么结论？',research:'列出样本小、选题、钩子、表达、账号阶段等可能性'},
  {pillar:'90天成长记录',title:'我准备把每条内容都当成一个小实验',research:'展示单变量实验和复盘表的用法'}
];

export const starterScripts=[
  {name:'首发自我定位',hook:'我不是副业大师，也不准备装成一个。',body:'我想做的是：花90天认真研究普通人的副业和商业机会。一个项目到底靠什么赚钱、谁在付钱、成本在哪、风险在哪，我会尽量查清楚再说。遇到查不到的，我会直接告诉你“还不知道”。',cta:'如果你也在研究普通人能做什么，我们一起从事实开始。'},
  {name:'判断副业五问',hook:'以后我看到一个副业，先不问能赚多少，我先问5个问题。',body:'第一，谁在付钱；第二，他为什么愿意持续付；第三，我要交付什么；第四，获客和交付的真实成本是什么；第五，最大的风险和不确定性是什么。五个问题答不清，我就先不下结论。',cta:'你最近在研究哪个项目？我可以按这5问继续拆。'},
  {name:'收益截图避坑',hook:'一张收益截图，能证明的事情其实非常有限。',body:'它可能没有告诉你时间范围、成本、退款、广告费、团队投入，也不知道是不是可重复。所以我看到收益数字时，会先查口径和来源，再判断这个模式本身是否成立。',cta:'下次看到“收入案例”，先问一句：这是什么口径？'},
  {name:'成长记录',hook:'今天我做内容时，主动删掉了一句“听起来很厉害”的话。',body:'原因很简单：我找不到足够证据。这个账号以后我想坚持一个规则——事实就给来源，观点就说是判断，还没验证的就明确写待验证。短期可能没那么刺激，但长期我更想积累可信度。',cta:'这是我今天的一个小进步，明天继续验证。'}
];

import {
  abilityNames,platforms,pipelineStages,pipelineLabels,tasks,initialState,normalizeState,toggleTask,addRecord,
  overallProgress,getDayPlan,moveContent,dashboardStats,createContentRecord,createTopicRecord,createScriptRecord,
  benchmarkAccounts,lessons,rules,trainingDays,getTrainingDay,closedLoopStatus,topicFrameworks,scriptFrameworks,reviewFramework,
  createReviewRecord,suggestNextExperiment,businessModels,advanceTrainingDay,createBackup,restoreBackup,starterTopics,starterScripts
} from './core.js';

const KEY='new_media_academy_os_v3';
const LEGACY_KEYS=['new_media_academy_os_v2','new_media_academy_os_v1'];
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{try{const u=new URL(String(v||''));return ['http:','https:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};
const pf=id=>platforms.find(x=>x.id===id)?.name||'未知平台';
let page='cockpit',platform='all';
let state=load();

function load(){
  try{
    const raw=localStorage.getItem(KEY)||LEGACY_KEYS.map(k=>localStorage.getItem(k)).find(Boolean);
    return normalizeState(raw?JSON.parse(raw):initialState());
  }catch{return initialState();}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}

const nav=[
  ['cockpit','◉','驾驶舱'],['today','⌁','今日任务'],['topics','⌖','选题雷达'],['scripts','⌘','脚本驾驶舱'],
  ['pipeline','▦','内容流水线'],['benchmarks','◎','标杆账号'],['reviews','▥','数据复盘'],['ip','◇','IP控制台'],
  ['learn','▤','学习中心'],['rules','⚑','平台规则']
];

function head(title,sub,kicker='MISSION CONTROL'){return `<div class="eyebrow">${kicker}</div><h1 class="h1">${title}</h1><p class="sub">${sub}</p>`;}
function tag(text,cls=''){return `<span class="tag ${cls}">${esc(text)}</span>`;}
function platformsBar(){return `<div class="platforms">${[{id:'all',name:'全部平台'},...platforms].map(x=>`<button class="platform-btn ${platform===x.id?'active':''}" data-platform="${x.id}">${esc(x.name)}</button>`).join('')}</div>`;}
function abilities(){return Object.entries(abilityNames).map(([k,n])=>`<div class="meter-row"><span>${n}</span><b>${state.abilities[k]||0}</b><div class="meter"><i style="width:${state.abilities[k]||0}%"></i></div></div>`).join('');}
function stageLabel(stage){return pipelineLabels[stage]||stage;}

function cockpit(){
  const day=getDayPlan(state.training.currentDay);const intensive=getTrainingDay(Math.min(30,state.training.currentDay));const stats=dashboardStats(state);const pct=overallProgress(state);const loop=closedLoopStatus(state);
  const nextName=loop.next==='done'?'今日闭环已完成':(tasks.find(t=>t.id===loop.next)?.name||'继续训练');
  return `${head('驾驶舱','今天不问“学什么”，只问：今天要交付什么、发布什么、明天根据什么反馈继续。','ACADEMY OS / FLIGHT DECK')}
  <div class="cockpit-grid">
    <div class="panel"><div class="panel-title"><h3>ABILITY VECTOR / 能力仪表</h3>${tag('训练分','gray')}</div><div class="meter-list">${abilities()}</div></div>
    <div class="panel hero-core"><div class="day-ring"><div><strong>${String(day.day).padStart(2,'0')}</strong><span>DAY / 30</span></div></div><h2>${esc(intensive.title)}</h2><p>${esc(intensive.learn)}</p><div class="btn-row" style="margin-top:16px"><button class="btn" data-go="today">启动今日训练</button><button class="btn secondary" data-go="pipeline">内容生产线</button></div></div>
    <div class="panel"><div class="panel-title"><h3>闭环状态</h3><div class="progress-ring" style="--p:${pct}"><span>${pct}%</span></div></div><div class="record accent"><strong>下一步：${esc(nextName)}</strong><p>今日闭环 ${loop.completed}/${loop.total}。研究→选题→脚本→拍摄→发布→复盘，一个环节都不跳。</p></div>${tasks.map(t=>`<label class="mission-row"><input type="checkbox" data-task="${t.id}" ${state.done[t.id]?'checked':''}><span class="grow"><strong>${t.name}</strong><small>${t.type} · ${abilityNames[t.ability]}</small></span>${tag(state.done[t.id]?'DONE':'PENDING',state.done[t.id]?'green':'gray')}</label>`).join('')}</div>
  </div>
  <div class="section-grid"><div class="panel"><div class="panel-title"><h3>今日必交付</h3>${tag(`30天强化 Day ${intensive.day}`,'cyan')}</div><div class="record"><strong>学习</strong><p>${esc(intensive.learn)}</p></div>${intensive.deliverables.map(x=>`<div class="record"><strong>交付物</strong><p>${esc(x)}</p></div>`).join('')}<div class="record"><strong>实战动作</strong><p>${esc(intensive.action)}</p></div><div class="record"><strong>明日反馈</strong><p>${esc(intensive.feedback)}</p></div></div><div class="panel"><div class="panel-title"><h3>CONTENT RADAR / 内容生产状态</h3><button class="btn small secondary" data-go="pipeline">OPEN PIPELINE</button></div><div class="stat-grid" style="grid-template-columns:repeat(2,1fr);margin:0">${['idea','script','shoot','published'].map(s=>`<div class="stat-card"><span>${stageLabel(s)}</span><strong>${stats[s]}</strong></div>`).join('')}</div><div class="record" style="margin-top:12px"><strong>当前IP方向</strong><p>${esc(state.profile.position)}</p></div></div></div>
  <div class="panel" style="margin-top:16px"><div class="panel-title"><h3>DATA SAFETY / 数据安全</h3>${tag('本地优先','green')}</div><div class="record"><strong>建议每周备份一次</strong><p>选题、脚本、IP资料和复盘默认保存在当前浏览器。点击“备份数据”会下载一个 JSON 文件；换电脑或清理浏览器后可用它恢复。</p></div><div class="btn-row"><button id="export-backup" class="btn secondary">备份数据</button><button id="import-backup" class="btn secondary">恢复备份</button><input id="backup-file" type="file" accept="application/json,.json" hidden></div></div>`;
}
function today(){const day=getDayPlan(state.training.currentDay);const intensive=getTrainingDay(Math.min(30,state.training.currentDay));const loop=closedLoopStatus(state);return `${head(`今日任务 · Day ${day.day}`,'每天180+分钟，学习只占一部分，最终一定要形成可拍、可发、可复盘的真实作品。','DAILY SORTIE')}
<div class="section-grid"><div class="panel"><div class="panel-title"><h3>${esc(intensive.title)}</h3>${tag(`闭环 ${loop.completed}/${loop.total}`,'cyan')}</div><div class="record accent"><strong>今天学什么</strong><p>${esc(intensive.learn)}</p></div><div class="record"><strong>今日必交付</strong><p>${esc(intensive.deliverables.join('；'))}</p></div><div class="record"><strong>今天必须做</strong><p>${esc(intensive.action)}</p></div><div class="record"><strong>明日反馈</strong><p>${esc(intensive.feedback)}</p></div>${tasks.map((t,i)=>`<label class="mission-row"><input type="checkbox" data-task="${t.id}" ${state.done[t.id]?'checked':''}><span class="grow"><strong>0${i+1} / ${t.name}</strong><small>${t.type} · 完成后 ${abilityNames[t.ability]} +${t.points}</small></span>${tag(state.done[t.id]?'已完成':'待执行',state.done[t.id]?'green':'gray')}</label>`).join('')}${loop.complete?`<button id="advance-day" class="btn" style="margin-top:14px;width:100%">${day.day>=30?'30天第一周期已完成':'完成今日闭环 → 进入 Day '+(day.day+1)}</button>`:''}</div><div class="panel"><div class="panel-title"><h3>发布前检查</h3>${tag('不通过就不发','amber')}</div>${['这条内容到底帮谁解决什么问题？','前三秒是否给了明确观看理由？','事实、数据、收益说法是否有来源或明确标为观点？','有没有把副业/商机写成“稳赚”“轻松暴富”之类承诺？','标题、封面和正文是否说的是同一件事？','结尾是否给一个自然行动或讨论问题？'].map((x,i)=>`<div class="record"><strong>0${i+1}</strong><p>${x}</p></div>`).join('')}<label class="field" style="margin-top:14px">当前训练日<input id="day-input" type="number" min="1" max="30" value="${day.day}"></label><button id="save-day" class="btn small" style="margin-top:8px">更新训练日</button></div></div>`;}
function topics(){return `${head('选题雷达','把灵感变成可验证的用户需求假设；目标是持续建立 100+ 可用选题库存。','TOPIC RADAR')}${platformsBar()}<div class="section-grid"><div class="panel"><div class="panel-title"><h3>新增选题</h3>${tag('用户需求优先','green')}</div><form id="topic-form"><div class="form-grid"><label class="field">平台${platformSelect()}</label><label class="field">评分 0–10<input name="score" type="number" min="0" max="10" value="5"></label><label class="field full">选题标题<input name="title" required placeholder="例：普通人判断一个副业值不值得做，先看这3点"></label><label class="field">用户问题<textarea name="userProblem" placeholder="用户真正卡在哪里？"></textarea></label><label class="field">价值承诺<textarea name="promise" placeholder="看完能获得什么？"></textarea></label><label class="field">我的切入角度<textarea name="angle"></textarea></label><label class="field">来源/参考<textarea name="source" placeholder="标杆账号、评论区、真实经历等"></textarea></label></div><button class="btn" type="submit" style="margin-top:12px">录入选题雷达</button></form></div><div class="panel"><div class="panel-title"><h3>筛选规则</h3>${tag('不要只追热点','amber')}</div><div class="record"><strong>需求强度</strong><p>用户是否真的在意、搜索、讨论、付费或反复遇到？</p></div><div class="record"><strong>你的证据</strong><p>有没有案例、公开数据、真实体验或可核验来源支撑？</p></div><div class="record"><strong>表达空间</strong><p>你能否提供不同角度，而不是简单复制标杆账号？</p></div></div></div><div class="panel" style="margin-top:16px"><div class="panel-title"><h3>首发选题库</h3>${tag('先研究再发布','green')}</div><div class="callout">这些不是“现成事实”，而是适合你当前IP定位的研究题。先完成旁边的研究要求，再改成自己的表达。</div><div class="training-grid">${starterTopics.map((t,i)=>`<article class="lesson-card">${tag(t.pillar,'gray')}<h3>${esc(t.title)}</h3><p><b>发布前先查：</b>${esc(t.research)}</p><button class="btn small secondary" data-use-topic="${i}">一键带入选题</button></article>`).join('')}</div></div><div class="panel" style="margin-top:16px"><div class="panel-title"><h3>选题模板库</h3>${tag('直接套结构，不照抄观点','amber')}</div><div class="cards">${topicFrameworks.map((x,i)=>`<article class="lesson-card">${tag(`T${String(i+1).padStart(2,'0')}`,'gray')}<p>${esc(x)}</p></article>`).join('')}</div></div><div class="panel" style="margin-top:16px"><div class="panel-title"><h3>选题库存</h3>${tag(`${state.records.topics.length} 条`)}</div>${records(state.records.topics.filter(x=>platform==='all'||x.platform===platform),r=>`${tag(pf(r.platform))}${tag(`评分 ${r.score}`,'gray')}<h3>${esc(r.title)}</h3><p>${esc(r.userProblem||r.promise||r.angle||'等待补充研究')}</p>` )}</div>`;}

function scripts(){return `${head('脚本驾驶舱','用结构化脚本减少“想到哪说到哪”，并保留版本迭代痕迹。','SCRIPT COCKPIT')}<div class="section-grid"><div class="panel"><div class="panel-title"><h3>新建脚本</h3>${tag('V1 → 发布版')}</div><form id="script-form"><div class="form-grid"><label class="field">平台${platformSelect()}</label><label class="field">版本<input name="version" value="V1"></label><label class="field full">脚本标题<input name="title" required></label>${['hook|前三秒钩子','pain|用户痛点','conflict|冲突/反常识','point|核心观点','example|案例','solution|解决方案','proof|信任证明','cta|结尾/CTA'].map(x=>{const [n,l]=x.split('|');return `<label class="field">${l}<textarea name="${n}"></textarea></label>`}).join('')}</div><button class="btn" type="submit" style="margin-top:12px">保存脚本</button></form></div><div class="panel"><div class="panel-title"><h3>SCRIPT CHECK</h3>${tag('发布前检查','amber')}</div>${['前三秒是否明确告诉用户为什么要继续看？','有没有一个清晰的核心观点？','信息是否能被普通人听懂？','案例/证据是否真实可核验？','有没有夸大收益或制造虚假承诺？','结尾是否自然，而非生硬求关注？'].map((x,i)=>`<div class="mission-row"><span class="tag gray">0${i+1}</span><span class="grow"><strong>${x}</strong></span></div>`).join('')}</div></div><div class="panel" style="margin-top:16px"><div class="panel-title"><h3>新手首发脚本</h3>${tag('真实身份起步','green')}</div><div class="cards">${starterScripts.map((sc,i)=>`<article class="lesson-card"><h3>${esc(sc.name)}</h3><p><b>钩子：</b>${esc(sc.hook)}</p><p>${esc(sc.body)}</p><p><b>结尾：</b>${esc(sc.cta)}</p><button class="btn small secondary" data-use-script="${i}">一键带入脚本</button></article>`).join('')}</div></div><div class="panel" style="margin-top:16px"><div class="panel-title"><h3>脚本结构库</h3>${tag('按问题选结构','cyan')}</div><div class="cards">${scriptFrameworks.map(f=>`<article class="lesson-card"><h3>${esc(f.name)}</h3><p>${esc(f.steps.join(' → '))}</p></article>`).join('')}</div></div><div class="panel" style="margin-top:16px"><div class="panel-title"><h3>脚本库</h3>${tag(`${state.records.scripts.length} 条`)}</div>${records(state.records.scripts,r=>`${tag(pf(r.platform))}${tag(r.version,'gray')}<h3>${esc(r.title)}</h3><p><b>钩子：</b>${esc(r.hook||'未填写')}</p><p><b>核心观点：</b>${esc(r.point||'未填写')}</p>`)}</div>`;}

function pipeline(){const stats=dashboardStats(state);return `${head('内容流水线','让每条内容都处在明确状态，避免灵感、脚本和成片散落在聊天记录或备忘录里。','CONTENT PIPELINE')}<div class="panel"><form id="content-form"><div class="form-grid"><label class="field">平台${platformSelect()}</label><label class="field">初始阶段<select name="stage">${pipelineStages.map(s=>`<option value="${s}">${stageLabel(s)}</option>`).join('')}</select></label><label class="field full">内容标题<input name="title" required placeholder="输入一个明确内容项目"></label><label class="field">目标人群<textarea name="audience"></textarea></label><label class="field">切入角度<textarea name="angle"></textarea></label><label class="field full">钩子/脚本备注<textarea name="script"></textarea></label></div><button class="btn" type="submit" style="margin-top:12px">加入流水线</button></form></div><div class="pipeline" style="margin-top:16px">${pipelineStages.map(stage=>`<div class="pipe-col"><div class="pipe-head"><span>${stageLabel(stage)}</span><b>${stats[stage]}</b></div>${state.records.content.filter(x=>x.stage===stage).map(pipeCard).join('')||'<div class="empty">暂无</div>'}</div>`).join('')}</div>`;}
function pipeCard(item){const i=pipelineStages.indexOf(item.stage);return `<div class="pipe-card"><strong>${esc(item.title)}</strong><small>${pf(item.platform)} · ${esc(item.created||'')}</small><div class="pipe-actions">${i>0?`<button class="btn small secondary" data-move="${item.id}" data-stage="${pipelineStages[i-1]}">←</button>`:''}${i<pipelineStages.length-1?`<button class="btn small" data-move="${item.id}" data-stage="${pipelineStages[i+1]}">→ ${stageLabel(pipelineStages[i+1])}</button>`:''}</div></div>`;}

function benchmarks(){return `${head('标杆账号情报库','研究“为什么有效”，而不是只收藏爆款；未提供主页链接的账号明确标记为待确认。','BENCHMARK INTELLIGENCE')}<div class="callout">目前仅“是铭铭呀”“小胡也是小狐”的主页链接由你确认。其余账号不会自动假定同名账号身份。</div><div class="benchmark-grid">${benchmarkAccounts.map(a=>`<article class="benchmark-card">${tag(pf(a.platform))} ${tag(a.confirmed?'已确认主页':'待补主页',a.confirmed?'green':'amber')}<h3>${esc(a.name)}</h3><p>研究重点：${esc(a.focus)}</p>${a.url?`<a href="${safeUrl(a.url)}" target="_blank" rel="noopener noreferrer">打开主页 ↗</a>`:'<span class="tag gray">等待主页链接</span>'}</article>`).join('')}</div>`;}

function reviews(){
  const latest=state.records.reviews[0];
  const next=suggestNextExperiment(latest||{});
  return `${head('数据复盘','先记录真实发布证据，再决定下一条只改什么；没有数据时不强行诊断。','DATA REVIEW')}
  <div class="section-grid"><div class="panel"><div class="panel-title"><h3>发布证据 + 24H / 72H</h3>${tag('真实数据','green')}</div><form id="review-form"><div class="form-grid">
  <label class="field">平台${platformSelect()}</label><label class="field">内容名称<input name="title" required></label>
  <label class="field full">发布链接<input name="url" type="url" placeholder="粘贴真实作品链接；未发布就不要填复盘"></label><label class="field">发布时间<input name="publishedAt" type="datetime-local"></label>
  <label class="field">你观察到最弱环节<select name="weakestStage"><option value="">证据不足 / 暂不判断</option><option value="topic">选题</option><option value="hook">前三秒钩子</option><option value="structure">内容结构</option><option value="value">价值密度</option><option value="trust">信任证据</option><option value="expression">真人表达</option><option value="cta">结尾互动</option><option value="positioning">IP记忆点</option></select></label>
  <label class="field">24H 播放/阅读<input name="views24" type="number"></label><label class="field">24H 完播率 %<input name="completion24" type="number" step="0.1"></label><label class="field">24H 互动量<input name="engagement24" type="number"></label><label class="field">24H 涨粉<input name="followers24" type="number"></label><label class="field">24H 转化<input name="conversions24" type="number"></label>
  <label class="field">72H 播放/阅读<input name="views72" type="number"></label><label class="field">72H 完播率 %<input name="completion72" type="number" step="0.1"></label><label class="field">72H 互动量<input name="engagement72" type="number"></label><label class="field">72H 涨粉<input name="followers72" type="number"></label><label class="field">72H 转化<input name="conversions72" type="number"></label>
  <label class="field full">原始假设<textarea name="hypothesis" placeholder="发布前你想验证什么？"></textarea></label><label class="field full">结论<textarea name="conclusion" placeholder="只写有证据支持的结论；猜测要明确写‘待验证’"></textarea></label>
  </div><button class="btn" style="margin-top:12px">保存真实复盘</button></form></div>
  <div class="panel"><div class="panel-title"><h3>NEXT EXPERIMENT / 下一条实验</h3>${tag('只改一个变量','cyan')}</div><div class="record accent"><strong>${esc(next.variable)}</strong><p>${esc(next.action)}</p></div><div class="callout">${esc(next.note)}</div><div class="panel-title" style="margin-top:18px"><h3>诊断顺序</h3>${tag('不脑补算法','amber')}</div>${reviewFramework.map((x,i)=>`<div class="record"><strong>0${i+1}</strong><p>${x}</p></div>`).join('')}</div></div>
  <div class="panel" style="margin-top:16px"><div class="panel-title"><h3>历史复盘</h3>${tag(`${state.records.reviews.length} 条`)}</div>${records(state.records.reviews,r=>{const sg=suggestNextExperiment(r);return `${tag(pf(r.platform))}${r.url?tag('有发布证据','green'):tag('缺链接','amber')}<h3>${esc(r.title)}</h3><p>${esc(r.conclusion||r.hypothesis||'等待补充')}</p><p><b>下一实验：</b>${esc(sg.variable)} · ${esc(sg.action)}</p>${r.url?`<a href="${safeUrl(r.url)}" target="_blank" rel="noopener noreferrer">打开作品 ↗</a>`:''}`})}</div>`;
}
function ip(){return `${head('IP控制台','当前不是“副业大师”人设，而是一个认真研究普通人副业和商业机会、并用行动验证的人。','IP CORE')}<div class="section-grid"><div class="panel"><form id="ip-form"><div class="form-grid">${[['position','我的定位'],['audience','目标人群'],['value','价值主张'],['pillars','内容支柱'],['persona','表达风格/人设'],['experiment','下一个定位实验']].map(([n,l])=>`<label class="field">${l}<textarea name="${n}">${esc(state.profile[n]||'')}</textarea></label>`).join('')}</div><button class="btn" style="margin-top:12px">保存IP假设</button></form></div><div class="panel"><div class="panel-title"><h3>IP可信度边界</h3>${tag('长期资产','green')}</div><div class="record accent"><strong>你的正确起点</strong><p>“我在研究普通人副业和商业机会，并用公开资料、真实过程和持续实验来验证。”</p></div><div class="record"><strong>不应该做</strong><p>不要编造收入、资历、学员结果、项目收益，也不要为了流量把商业机会说成确定性赚钱结果。</p></div><div class="record"><strong>应该积累</strong><p>研究记录、判断框架、验证过程、失败案例、真实复盘和越来越稳定的观点。</p></div></div></div><div class="panel" style="margin-top:16px"><div class="panel-title"><h3>商业模式实验室</h3>${tag('先研究，不急着变现','amber')}</div><div class="training-grid">${businessModels.map(m=>`<article class="lesson-card"><h3>${esc(m.name)}</h3><p><b>谁付钱：</b>${esc(m.payer)}</p><p><b>为什么付：</b>${esc(m.value)}</p><p><b>主要风险：</b>${esc(m.risk)}</p><p><b>最小验证：</b>${esc(m.validation)}</p></article>`).join('')}</div></div>`;}
function learn(){
  const current=Math.min(30,state.training.currentDay);
  return `${head('30天学习中心','每天只学当天要用的知识；真正的掌握标准是你能完成交付、发布，并在第二天根据反馈继续。','LEARNING BAY')}
  <div class="callout">当前强化周期：Day ${current}/30。第31–90天将继续进入“内容实验增长”和“专业操盘”周期，但第一周期先把真实发布闭环跑通。</div>
  <div class="training-grid" style="margin-top:16px">${trainingDays.map(d=>`<article class="lesson-card ${d.day===current?'current-day':''}">${tag(`DAY ${String(d.day).padStart(2,'0')}`,d.day===current?'green':'gray')}<h3>${esc(d.title)}</h3><p><b>学：</b>${esc(d.learn)}</p><p><b>交：</b>${esc(d.deliverables.join('；'))}</p><p><b>做：</b>${esc(d.action)}</p><p><b>反馈：</b>${esc(d.feedback)}</p></article>`).join('')}</div>
  <div class="panel" style="margin-top:16px"><div class="panel-title"><h3>Day 1 基础课</h3>${tag('机制认知','cyan')}</div><div class="cards">${lessons.map((l,i)=>`<article class="lesson-card">${tag(`L${i+1}`)} ${tag(l.source,'gray')}<h3>${esc(l.title)}</h3><p>${esc(l.body)}</p></article>`).join('')}</div></div>`;
}
function rulesPage(){const shown=rules.filter(r=>platform==='all'||r.platform===platform);return `${head('平台规则','规则和算法信息必须区分“官方已公开、行业经验、个人判断、未核验”。','POLICY WATCH')}${platformsBar()}<div class="callout">本页只作为核查入口，不把“敏感词清单”“固定流量池阈值”等未经平台确认的说法当成事实。</div><div class="cards">${shown.map(r=>`<article class="lesson-card">${tag(pf(r.platform))} ${tag(r.status,r.url?'green':'amber')}<h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p><small>核验日期：${esc(r.verifiedAt||'未记录')}</small>${r.url?`<a href="${safeUrl(r.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan);font-size:10px">官方入口 ↗</a>`:''}</article>`).join('')}</div>`;}

function platformSelect(){return `<select name="platform">${platforms.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>`;}
function records(list,render){return list.length?`<div class="table-like">${list.map(x=>`<div class="record">${render(x)}<small>${esc(x.created||'')}</small></div>`).join('')}</div>`:'<div class="empty">暂无记录，从今天的第一条开始。</div>';}

function render(){
  $('#page-label').textContent=nav.find(n=>n[0]===page)?.[2]||'驾驶舱';
  $('#nav').innerHTML=nav.map(([id,ico,label])=>`<button class="nav-btn ${page===id?'active':''}" data-go="${id}"><span class="nav-ico">${ico}</span>${label}</button>`).join('');
  const pages={cockpit,today,topics,scripts,pipeline,benchmarks,reviews,ip,learn,rules:rulesPage};
  $('#page').innerHTML=pages[page]();
}
function go(id){page=id;render();window.scrollTo(0,0);}

document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return;}
  const p=e.target.closest('[data-platform]');if(p){platform=p.dataset.platform;render();return;}
  const ut=e.target.closest('[data-use-topic]');if(ut){const t=starterTopics[Number(ut.dataset.useTopic)];const f=$('#topic-form');if(t&&f){f.elements.title.value=t.title;f.elements.userProblem.value=t.research;f.elements.angle.value='用我的研究过程和判断框架切入';f.scrollIntoView({behavior:'smooth'});}return;}
  const us=e.target.closest('[data-use-script]');if(us){const sc=starterScripts[Number(us.dataset.useScript)];const f=$('#script-form');if(sc&&f){f.elements.title.value=sc.name;f.elements.hook.value=sc.hook;f.elements.point.value=sc.body;f.elements.cta.value=sc.cta;f.scrollIntoView({behavior:'smooth'});}return;}
  const m=e.target.closest('[data-move]');if(m){state=moveContent(state,m.dataset.move,m.dataset.stage);save();render();return;}
  if(e.target.id==='save-day'){
    const n=Math.max(1,Math.min(30,Number($('#day-input').value)||1));
    state={...state,done:{},training:{...state.training,currentDay:n}};save();render();
  }
  if(e.target.id==='advance-day'){state=advanceTrainingDay(state);save();render();}
  if(e.target.id==='export-backup'){
    const blob=new Blob([createBackup(state)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`新媒体运营学院OS-备份-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  if(e.target.id==='import-backup'){$('#backup-file')?.click();}
});
document.addEventListener('change',async e=>{
  if(e.target.matches('[data-task]')){state=toggleTask(state,e.target.dataset.task);save();render();return;}
  if(e.target.id==='backup-file'&&e.target.files?.[0]){const restored=restoreBackup(await e.target.files[0].text());if(restored){state=restored;save();render();alert('备份恢复成功');}else{alert('这个备份文件无法识别，没有覆盖当前数据。');}}
});
document.addEventListener('submit',e=>{
  e.preventDefault();const data=Object.fromEntries(new FormData(e.target));
  if(e.target.id==='topic-form'){const r=createTopicRecord(data);if(r)state=addRecord(state,'topics',r);}
  if(e.target.id==='script-form'){const r=createScriptRecord(data);if(r)state=addRecord(state,'scripts',r);}
  if(e.target.id==='content-form'){const r=createContentRecord(data);if(r)state=addRecord(state,'content',r);}
  if(e.target.id==='review-form'){const r=createReviewRecord(data);if(r)state=addRecord(state,'reviews',r);}
  if(e.target.id==='ip-form'){state={...state,profile:{...state.profile,...data}};}
  save();render();
});
function tick(){const d=new Date();const el=$('#clock');if(el)el.textContent=d.toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});}
setInterval(tick,1000);tick();render();

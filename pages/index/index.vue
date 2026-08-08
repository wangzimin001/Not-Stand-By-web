<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <view class="page">
    <view class="chalk-header">
      <view class="brand-row">
        <view>
          <text class="mini-label">NOT STAND BY</text>
          <text class="brand">不叉手</text>
        </view>
        <view class="couple-chip" @tap="showPairTip"><text class="dot"></text><text>我们俩</text></view>
      </view>
      <view class="chalk-line"></view>
    </view>

    <scroll-view scroll-y class="content">
      <block v-if="activeTab === 'calendar'">
        <view class="hello-row"><view><text class="greeting">早上好，林女士</text><text class="sub-greeting">今天也一起把小事做好</text></view><text class="sun">☼</text></view>
        <view class="week-card doodle-border">
          <view class="week-top"><text class="card-kicker">孕期进度</text><text class="week-date">2026.08.08</text></view>
          <view class="week-number"><text>22</text><text class="week-unit">周</text><text class="week-days">+ 3 天</text></view>
          <view class="progress-track"><view class="progress-value"></view></view>
          <view class="week-foot"><text>距离预产期还有 125 天</text><text>约 55 cm</text></view>
        </view>
        <view class="section-title"><text>宝宝正在发生什么</text><text class="arrow">→</text></view>
        <view class="baby-card">
          <view class="baby-sketch">✦</view>
          <view class="baby-copy"><text class="baby-title">会听见你的声音了</text><text class="baby-desc">宝宝的听力逐渐发育，可以每天和 Ta 说说话。爸爸的声音也很重要。</text></view>
        </view>
        <view class="notice-card"><text class="notice-mark">!</text><view><text class="notice-title">这周要留意</text><text class="notice-body">规律作息，少量多餐。出现持续腹痛或出血请及时就医。</text></view></view>
        <view class="section-title"><text>今天的共同任务</text><text class="see-all" @tap="activeTab = 'tasks'">查看全部</text></view>
        <view v-for="task in todayTasks" :key="task.id" class="task-row" :class="{ done: task.done }" @tap="toggleTask(task)"><text class="check">{{ task.done ? '✓' : '' }}</text><view><text class="task-name">{{ task.name }}</text><text class="task-owner">{{ task.owner }}</text></view><text class="task-time">{{ task.time }}</text></view>
      </block>

      <block v-else-if="activeTab === 'tasks'">
        <view class="page-heading"><text class="heading">任务</text><text class="heading-note">一起准备，不让一个人扛着</text></view>
        <view class="segmented"><text :class="{ selected: taskFilter === 'all' }" @tap="taskFilter = 'all'">全部</text><text :class="{ selected: taskFilter === 'system' }" @tap="taskFilter = 'system'">系统提醒</text><text :class="{ selected: taskFilter === 'couple' }" @tap="taskFilter = 'couple'">夫妻任务</text></view>
        <view class="assign-card" @tap="assignTask"><text class="assign-plus">＋</text><view><text class="assign-title">指派一个任务</text><text class="assign-desc">把想让对方做的事说清楚</text></view><text class="arrow">→</text></view>
        <view v-for="task in filteredTasks" :key="task.id" class="task-card" :class="task.type"><view class="task-card-top"><text class="tag">{{ task.type === 'system' ? '系统提醒' : '夫妻任务' }}</text><text class="task-due">{{ task.due }}</text></view><view class="task-card-main"><text class="check large" :class="{ checked: task.done }" @tap.stop="toggleTask(task)">{{ task.done ? '✓' : '' }}</text><view><text class="task-name big" :class="{ strike: task.done }">{{ task.name }}</text><text class="task-owner">{{ task.owner }}</text></view></view></view>
      </block>

      <block v-else-if="activeTab === 'items'">
        <view class="page-heading"><text class="heading">物品清单</text><text class="heading-note">把准备工作变成共同的进度条</text></view>
        <view class="item-summary"><view><text class="summary-number">18</text><text> 件已准备</text></view><view class="summary-progress"><view class="summary-bar"></view></view><text class="summary-percent">64%</text></view>
        <view class="category-scroll"><text v-for="category in categories" :key="category" :class="{ active: itemCategory === category }" @tap="itemCategory = category">{{ category }}</text></view>
        <view v-for="item in visibleItems" :key="item.name" class="item-card"><view class="item-illustration">{{ item.symbol }}</view><view class="item-info"><text class="item-name">{{ item.name }}</text><text class="item-meta">{{ item.detail }} · {{ item.quantity }}{{ item.unit }}</text><view class="item-status" :class="item.statusClass">{{ item.status }}</view></view><text class="item-more">···</text></view>
        <view class="add-item" @tap="addItem"><text>＋</text><text>添加一件物品</text></view>
      </block>

      <block v-else>
        <view class="page-heading"><text class="heading">我的</text><text class="heading-note">我们一起迎接新成员</text></view>
        <view class="profile-card doodle-border"><view class="avatar">林</view><view><text class="profile-name">林女士</text><text class="profile-role">准妈妈 · 孕 22 周</text></view><text class="arrow">→</text></view>
        <view class="pair-card"><view class="pair-avatars"><text class="pair-avatar mom">林</text><text class="pair-plus">＋</text><text class="pair-avatar dad">周</text></view><view><text class="pair-title">周先生已绑定</text><text class="pair-desc">共同查看任务和物品清单</text></view><text class="bound">已绑定</text></view>
        <view class="settings-list"><view v-for="setting in settings" :key="setting" class="setting-row" @tap="showPairTip"><text>{{ setting }}</text><text class="arrow">→</text></view></view>
      </block>
    </scroll-view>

    <view class="bottom-nav"><view v-for="tab in tabs" :key="tab.key" class="nav-item" :class="{ active: activeTab === tab.key }" @tap="activeTab = tab.key"><text class="nav-icon">{{ tab.icon }}</text><text>{{ tab.label }}</text></view></view>
  </view>
</template>

<script>
export default {
  data() { return { activeTab: 'calendar', taskFilter: 'all', itemCategory: '待产包', tabs: [{ key: 'calendar', label: '日历', icon: '◷' }, { key: 'tasks', label: '任务', icon: '✓' }, { key: 'items', label: '清单', icon: '▤' }, { key: 'mine', label: '我的', icon: '○' }], categories: ['待产包', '衣物', '喂养', '护理'], settings: ['通知与提醒', '孕周设置', '关于不叉手'], settingsData: [{ name: '涂抹妊娠油', owner: '林女士', due: '今天', type: 'system', done: false, id: 1 }, { name: '确认待产包清单', owner: '周先生', due: '周日', type: 'couple', done: false, id: 2 }, { name: '预约下次产检', owner: '林女士', due: '已完成', type: 'system', done: true, id: 3 }], itemsData: [{ name: '连体衣', detail: '59码 · 纯棉', quantity: 3, unit: '件', category: '衣物', symbol: '衣', status: '准备中', statusClass: 'preparing' }, { name: '奶瓶', detail: '宽口径 · 240ml', quantity: 2, unit: '个', category: '喂养', symbol: '瓶', status: '未准备', statusClass: 'waiting' }, { name: '产褥垫', detail: 'XL · 加长款', quantity: 1, unit: '包', category: '待产包', symbol: '垫', status: '准备完成', statusClass: 'ready' }] } },
  computed: { todayTasks() { return this.settingsData.slice(0, 2) }, filteredTasks() { return this.taskFilter === 'all' ? this.settingsData : this.settingsData.filter(item => item.type === this.taskFilter) }, visibleItems() { return this.itemsData.filter(item => item.category === this.itemCategory || this.itemCategory === '待产包' && item.category === '待产包') } },
  methods: { toggleTask(task) { task.done = !task.done }, assignTask() { uni.showModal({ title: '指派夫妻任务', editable: true, placeholderText: '例如：周末一起整理待产包', success: result => { if (result.confirm && result.content) { this.settingsData.unshift({ name: result.content, owner: '周先生', due: '待确认', type: 'couple', done: false, id: Date.now() }); uni.showToast({ title: '任务已发出', icon: 'none' }) } } }) }, addItem() { uni.showToast({ title: '物品添加入口已准备好', icon: 'none' }) }, showPairTip() { uni.showToast({ title: '这是你们共同的空间', icon: 'none' }) } }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f6f1e6; color: #273b33; padding-bottom: 92px; }
.chalk-header { padding: 24px 20px 0; background: #274d42; color: #fffdf3; }
.brand-row, .week-top, .week-foot, .section-title, .task-card-top, .item-summary, .profile-card, .pair-card, .setting-row { display: flex; align-items: center; justify-content: space-between; }
.mini-label, .card-kicker { display: block; font-size: 10px; letter-spacing: 2px; opacity: .7; }
.brand { display: block; font-size: 28px; font-weight: 700; letter-spacing: 5px; margin-top: 4px; }
.couple-chip { display: flex; gap: 7px; align-items: center; border: 1px solid #9cc3aa; border-radius: 20px; padding: 7px 11px; font-size: 12px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #f6cf75; }
.chalk-line { height: 10px; margin-top: 15px; border-top: 1px dashed #a9cbbb; opacity: .75; }
.content { height: calc(100vh - 151px); padding: 20px; }
.hello-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 17px; }.greeting { display: block; font-size: 23px; font-weight: 700; }.sub-greeting { display: block; margin-top: 4px; color: #788b80; font-size: 12px; }.sun { color: #dfa94e; font-size: 36px; }
.week-card { background: #e5bd65; padding: 18px; color: #244136; }.doodle-border { border: 2px dashed #517b69; border-radius: 8px; }.week-date { font-size: 12px; opacity: .7; }.week-number { display: flex; align-items: baseline; margin: 8px 0 11px; }.week-number text:first-child { font-size: 58px; font-weight: 700; line-height: 1; }.week-unit { font-size: 17px; margin-left: 5px; }.week-days { font-size: 14px; margin-left: 11px; }.progress-track, .summary-progress { height: 6px; background: rgba(255,255,255,.45); border-radius: 5px; overflow: hidden; }.progress-value { width: 52%; height: 100%; background: #426e59; }.week-foot { font-size: 11px; margin-top: 9px; }
.section-title { margin: 24px 0 10px; font-size: 16px; font-weight: 700; }.arrow, .see-all { color: #5f8c70; font-size: 12px; }.baby-card, .notice-card, .assign-card, .task-card, .item-card, .pair-card { display: flex; align-items: center; gap: 13px; background: #fffdf7; border: 1px solid #e4ddcf; border-radius: 7px; padding: 15px; }.baby-sketch { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: #d3e5ca; color: #4d8365; font-size: 26px; }.baby-title, .notice-title, .assign-title, .item-name, .pair-title { display: block; font-weight: 700; font-size: 14px; }.baby-desc, .notice-body, .assign-desc, .pair-desc { display: block; margin-top: 5px; color: #7c8c82; font-size: 11px; line-height: 1.55; }.notice-card { margin-top: 10px; align-items: flex-start; background: #f9e9c8; border-color: #eed9ac; }.notice-mark { width: 23px; height: 23px; flex: none; display: grid; place-items: center; border: 1px solid #c38a3d; border-radius: 50%; color: #a66f27; font-weight: 700; }.task-row { display: flex; align-items: center; gap: 11px; padding: 12px 1px; border-bottom: 1px solid #e1d9ca; }.check { width: 22px; height: 22px; display: grid; place-items: center; flex: none; border: 1.5px solid #73917c; border-radius: 50%; color: #fff; font-size: 14px; }.task-row.done .check, .check.checked { background: #6b987a; }.task-name { display: block; font-size: 13px; }.task-owner, .task-time { display: block; margin-top: 3px; color: #89968d; font-size: 10px; }.task-time { margin-left: auto; }.page-heading { margin: 4px 0 18px; }.heading { display: block; font-size: 27px; font-weight: 700; }.heading-note { display: block; margin-top: 4px; color: #7d8d82; font-size: 12px; }.segmented { display: flex; gap: 5px; margin-bottom: 15px; }.segmented text { padding: 7px 13px; border-radius: 15px; color: #76877c; font-size: 12px; }.segmented text.selected { background: #d2e4cf; color: #356148; font-weight: 700; }.assign-card { margin-bottom: 13px; border-style: dashed; }.assign-plus { color: #5f916f; font-size: 25px; }.task-card { display: block; margin-bottom: 10px; }.task-card.system { border-left: 4px solid #e6bd62; }.task-card.couple { border-left: 4px solid #81a9a0; }.tag, .task-due { color: #829188; font-size: 10px; }.task-card-main { display: flex; align-items: center; gap: 11px; margin-top: 9px; }.large { width: 25px; height: 25px; }.big { font-size: 14px; }.strike { text-decoration: line-through; color: #9ca79f; }.item-summary { padding: 15px 0; }.summary-number { font-size: 25px; font-weight: 700; }.summary-progress { width: 45%; background: #dfdacd; }.summary-bar { width: 64%; height: 100%; background: #719b7c; }.summary-percent { color: #6d8073; font-size: 12px; }.category-scroll { display: flex; gap: 19px; margin: 0 0 13px; white-space: nowrap; }.category-scroll text { padding-bottom: 7px; color: #89958b; font-size: 13px; }.category-scroll text.active { border-bottom: 2px solid #4d8565; color: #356148; font-weight: 700; }.item-card { margin-bottom: 10px; }.item-illustration { width: 50px; height: 50px; display: grid; place-items: center; background: #e3ecd9; color: #547d60; font-size: 13px; font-weight: 700; }.item-info { flex: 1; }.item-meta { display: block; margin-top: 4px; color: #86938a; font-size: 11px; }.item-status { display: inline-block; margin-top: 7px; padding: 3px 7px; border-radius: 3px; font-size: 10px; }.preparing { background: #f6e0ad; color: #9a712a; }.waiting { background: #eeeae0; color: #899188; }.ready { background: #d6e8d5; color: #4f8562; }.item-more { color: #829289; letter-spacing: 2px; }.add-item { display: flex; justify-content: center; gap: 7px; padding: 15px; color: #578468; border: 1px dashed #9db7a3; border-radius: 7px; font-size: 13px; }.profile-card { background: #fffdf7; padding: 18px; }.avatar, .pair-avatar { display: grid; place-items: center; border-radius: 50%; }.avatar { width: 48px; height: 48px; margin-right: 12px; background: #e5bd65; font-size: 19px; font-weight: 700; }.profile-card > view:nth-child(2) { flex: 1; }.profile-name { display: block; font-size: 16px; font-weight: 700; }.profile-role { display: block; margin-top: 3px; color: #85938a; font-size: 11px; }.pair-card { margin-top: 12px; }.pair-avatars { display: flex; align-items: center; margin-right: 2px; }.pair-avatar { width: 33px; height: 33px; border: 2px solid #fffdf7; color: #fff; font-size: 12px; }.mom { background: #d18b83; }.dad { background: #6e9b85; margin-left: -8px; }.pair-plus { margin: 0 3px; color: #aab3a8; }.pair-card > view:nth-child(2) { flex: 1; }.bound { padding: 4px 7px; border-radius: 3px; background: #d6e8d5; color: #4f8562; font-size: 10px; }.settings-list { margin-top: 18px; background: #fffdf7; border-radius: 7px; }.setting-row { padding: 16px; border-bottom: 1px solid #eee8dc; font-size: 13px; }.setting-row:last-child { border-bottom: 0; }.bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: flex; justify-content: space-around; padding: 9px 10px 14px; background: #fffdf8; border-top: 1px solid #e5ded0; }.nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 54px; color: #9aa49c; font-size: 10px; }.nav-item.active { color: #376449; font-weight: 700; }.nav-icon { font-size: 21px; line-height: 20px; }
</style>

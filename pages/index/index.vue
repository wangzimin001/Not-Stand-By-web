<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <view class="page">
    <!-- 兼容刘海屏和状态栏的顶部安全区。 -->
    <view class="safe-area"></view>
    <!-- 所有主标签共享的品牌标题和家庭账号入口。 -->
    <view class="topbar">
      <view class="brand-block">
        <text class="eyebrow">NOT STAND BY</text>
        <text class="page-title">{{ activeTab === 'calendar' ? '今天，一起准备' : currentTabLabel }}</text>
      </view>
      <view class="account-chip" @tap="showPairTip">
        <text class="account-dot"></text>
        <text>{{ profileName }}</text>
        <text class="chip-arrow">⌄</text>
      </view>
    </view>

    <!-- 主内容区根据 activeTab 切换日历、任务、物品和个人中心。 -->
    <scroll-view scroll-y class="content">
      <!-- 真实资料加载失败时保留重试入口，不回退展示虚构用户。 -->
      <view v-if="profileError" class="profile-error" @tap="loadProfile"><text>{{ profileError }}</text><text>重试</text></view>
      <!-- 日历首页：孕期指标、今日安排和本周提醒。 -->
      <block v-if="activeTab === 'calendar'">
        <view class="date-line"><text>{{ todayLabel }}</text><text class="sun-mark">☼</text></view>

        <view class="metric-grid">
          <view class="metric-card yellow-card">
            <text class="metric-kicker">{{ pregnancyMetricTitle }}</text>
            <view class="metric-value"><text>{{ pregnancy.available ? pregnancy.weeks : '--' }}</text><text v-if="pregnancy.available" class="metric-unit">周</text><text v-if="pregnancy.available && pregnancy.days" class="metric-extra">+ {{ pregnancy.days }} 天</text></view>
            <view class="metric-foot"><text>{{ dueDateLabel }}</text><text class="eye">◉</text></view>
          </view>
          <view class="metric-card yellow-card">
            <text class="metric-kicker">共同任务</text>
            <view class="metric-value"><text>{{ pendingTaskCount }}</text><text class="metric-unit">项</text></view>
            <view class="metric-foot"><text>今天还有 {{ todayPendingCount }} 项</text><text class="eye">◉</text></view>
          </view>
        </view>

        <view class="section-head"><text>今天的安排</text><text class="section-link" @tap="activeTab = 'tasks'">查看全部 →</text></view>
        <view class="filter-row home-filter">
          <text v-for="filter in homeFilters" :key="filter.key" :class="{ selected: homeFilter === filter.key }" @tap="homeFilter = filter.key">{{ filter.label }}</text>
        </view>
        <view class="agenda-list">
          <view v-for="task in agendaTasks" :key="task.id" class="agenda-card" :class="{ completed: task.done }" @tap="toggleTask(task)">
            <view class="agenda-icon" :class="task.type"><text>{{ task.done ? '✓' : task.type === 'system' ? '◷' : '↗' }}</text></view>
            <view class="agenda-copy"><text class="agenda-name">{{ task.name }}</text><text class="agenda-meta">{{ taskOwnerName(task) }} · {{ task.due }}</text></view>
            <text class="agenda-state">{{ task.done ? '已完成' : task.due === '今天' ? '待完成' : '本周' }}</text>
          </view>
          <view v-if="!agendaTasks.length" class="empty-state"><text>今天没有待处理的安排</text><text>把时间留给彼此和宝宝</text></view>
        </view>

        <view class="reminder-strip"><view class="reminder-icon">!</view><view><text class="reminder-title">本周提醒</text><text class="reminder-copy">{{ pregnancyReminder }}</text></view></view>
      </block>

      <!-- 任务页：筛选系统/夫妻任务，并支持指派和完成确认。 -->
      <block v-else-if="activeTab === 'tasks'">
        <view class="page-heading"><text class="heading">任务</text><text class="heading-note">把要做的事，分给两个人</text></view>
        <view class="filter-row dark-filter"><text :class="{ selected: taskFilter === 'all' }" @tap="taskFilter = 'all'">全部</text><text :class="{ selected: taskFilter === 'system' }" @tap="taskFilter = 'system'">系统提醒</text><text :class="{ selected: taskFilter === 'couple' }" @tap="taskFilter = 'couple'">夫妻任务</text></view>
        <view class="assign-card" @tap="assignTask"><view class="assign-icon">＋</view><view><text class="assign-title">指派一个任务</text><text class="assign-desc">把想让对方做的事说清楚</text></view><text class="assign-arrow">→</text></view>
        <view v-for="task in filteredTasks" :key="task.id" class="task-card" :class="task.type"><view class="task-card-top"><text class="tag">{{ task.type === 'system' ? '系统提醒' : '夫妻任务' }}</text><text class="task-due">{{ task.due }}</text></view><view class="task-card-main"><text class="check large" :class="{ checked: task.done }" @tap.stop="toggleTask(task)">{{ task.done ? '✓' : '' }}</text><view><text class="task-name big" :class="{ strike: task.done }">{{ task.name }}</text><text class="task-owner">{{ taskOwnerName(task) }}</text></view></view></view>
      </block>

      <!-- 物品清单页：按类别查看准备状态。 -->
      <block v-else-if="activeTab === 'items'">
        <view class="page-heading"><text class="heading">物品清单</text><text class="heading-note">一起准备，少一点慌张</text></view>
        <view class="item-summary"><view><text class="summary-number">18</text><text class="summary-label"> 件已准备</text></view><view class="summary-progress"><view class="summary-bar"></view></view><text class="summary-percent">64%</text></view>
        <view class="category-scroll"><text v-for="category in categories" :key="category" :class="{ active: itemCategory === category }" @tap="itemCategory = category">{{ category }}</text></view>
        <view v-for="item in visibleItems" :key="item.name" class="item-card"><view class="item-illustration">{{ item.symbol }}</view><view class="item-info"><text class="item-name">{{ item.name }}</text><text class="item-meta">{{ item.detail }} · {{ item.quantity }}{{ item.unit }}</text><view class="item-status" :class="item.statusClass">{{ item.status }}</view></view><text class="item-more">···</text></view>
        <view class="add-item" @tap="addItem"><text class="add-item-icon">＋</text><text>添加一件物品</text></view>
      </block>

      <!-- 个人中心：用户、伴侣绑定状态和常规设置入口。 -->
      <block v-else>
        <view class="page-heading"><text class="heading">我的</text><text class="heading-note">{{ mineHeadingNote }}</text></view>
        <view class="profile-card"><view class="avatar">{{ profileInitial }}</view><view class="profile-copy"><text class="profile-name">{{ profileName }}</text><text class="profile-role">{{ profileRoleLabel }}</text></view><text class="profile-arrow">→</text></view>
        <view class="pair-card" @tap="showPairTip"><view class="pair-avatars"><text class="pair-avatar" :class="avatarClass(currentUser.role)">{{ profileInitial }}</text><text class="pair-plus">＋</text><text class="pair-avatar" :class="avatarClass(partner && partner.role)">{{ partnerInitial }}</text></view><view class="pair-copy"><text class="pair-title">{{ pairTitle }}</text><text class="pair-desc">{{ pairDescription }}</text></view><text class="bound" :class="{ unbound: !partner }">{{ partner ? '已绑定' : '待加入' }}</text></view>
        <view class="settings-list"><view v-for="setting in settings" :key="setting" class="setting-row" @tap="showPairTip"><text>{{ setting }}</text><text class="setting-arrow">→</text></view></view>
      </block>
    </scroll-view>

    <!-- 悬浮按钮会根据当前标签映射到最常用的新增操作。 -->
    <view class="floating-action" @tap="primaryAction"><text>＋</text></view>
    <!-- 自定义胶囊底部导航。 -->
    <view class="bottom-nav">
      <view v-for="tab in tabs" :key="tab.key" class="nav-item" :class="{ active: activeTab === tab.key }" @tap="activeTab = tab.key">
        <view class="nav-icon-wrap"><text class="nav-icon">{{ tab.icon }}</text></view>
        <text class="nav-label">{{ tab.label }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ensureSessionAndUser } from '../../services/auth'
import { calculatePregnancy, firstCharacter, formatToday } from '../../utils/pregnancy'

/**
 * 首页筛选项。
 * @typedef {Object} DashboardFilter
 * @property {string} key 程序内部使用的稳定筛选键。
 * @property {string} label 展示给用户的中文名称。
 */

/**
 * 底部导航项。
 * @typedef {Object} DashboardTab
 * @property {string} key 标签唯一键，同时用于决定页面分支。
 * @property {string} label 标签中文名称。
 * @property {string} icon 当前原型使用的字符图标。
 */

/**
 * 首页和任务页共用的任务模型。
 * @typedef {Object} DashboardTask
 * @property {number} id 任务唯一标识。
 * @property {string} name 任务标题。
 * @property {'SELF'|'PARTNER'} ownerRole 当前负责人相对登录用户的身份，展示名从真实家庭成员资料解析。
 * @property {string} due 截止时间或完成状态文案。
 * @property {'system'|'couple'} type 系统提醒或夫妻任务。
 * @property {boolean} done 是否已完成。
 */

/**
 * 物品清单原型数据模型。
 * @typedef {Object} ChecklistItem
 * @property {string} name 物品名称。
 * @property {string} detail 尺码、容量或材质等分类属性摘要。
 * @property {number} quantity 计划准备数量。
 * @property {string} unit 与物品匹配的数量单位。
 * @property {string} category 所属清单分类。
 * @property {string} symbol 当前原型使用的示意字符。
 * @property {string} status 用户可读的准备状态。
 * @property {string} statusClass 状态对应的视觉类名。
 */

export default {
  /**
   * 创建首页标签、真实用户资料容器以及尚未接入接口的任务/清单演示数据。
   * @returns {Object} 首页响应式状态和当前登录用户资料。
   */
  data() {
    return {
      // 当前底部导航标签。
      activeTab: 'calendar',
      // 日历首页“今天的安排”筛选条件。
      homeFilter: 'all',
      // 任务页的任务来源筛选条件。
      taskFilter: 'all',
      // 物品清单当前分类。
      itemCategory: '待产包',
      // 当前登录用户及其家庭、成员和宝宝资料，由 GET /api/v1/users/me 填充。
      currentUser: { id: '', nickname: '', gender: '', role: '', family: null },
      // 是否正在读取当前用户资料。
      profileLoading: true,
      // 资料读取失败文案；非空时页面显示点击重试入口。
      profileError: '',
      // 首页当天日期，进入或重新显示页面时刷新。
      todayLabel: formatToday(),
      /** @type {DashboardFilter[]} 日历首页筛选项。 */
      homeFilters: [{ key: 'all', label: '全部' }, { key: 'pending', label: '待完成' }, { key: 'done', label: '已完成' }],
      /** @type {DashboardTab[]} 底部导航定义。 */
      tabs: [{ key: 'calendar', label: '日历', icon: '⌂' }, { key: 'tasks', label: '任务', icon: '✓' }, { key: 'items', label: '清单', icon: '▤' }, { key: 'mine', label: '我的', icon: '●' }],
      // 物品清单支持的分类标签。
      categories: ['待产包', '衣物', '喂养', '护理'],
      // 个人中心的设置入口名称。
      settings: ['通知与提醒', '孕周设置', '关于不叉手'],
      /** @type {DashboardTask[]} 任务内容暂为原型数据，负责人名称会映射为真实用户或伴侣昵称。 */
      settingsData: [{ name: '涂抹妊娠油', ownerRole: 'SELF', due: '今天', type: 'system', done: false, id: 1 }, { name: '确认待产包清单', ownerRole: 'PARTNER', due: '周日', type: 'couple', done: false, id: 2 }, { name: '预约下次产检', ownerRole: 'SELF', due: '已完成', type: 'system', done: true, id: 3 }],
      /** @type {ChecklistItem[]} 当前 UI 原型使用的物品数据，后续由清单接口替换。 */
      itemsData: [{ name: '连体衣', detail: '59码 · 纯棉', quantity: 3, unit: '件', category: '衣物', symbol: '衣', status: '准备中', statusClass: 'preparing' }, { name: '奶瓶', detail: '宽口径 · 240ml', quantity: 2, unit: '个', category: '喂养', symbol: '瓶', status: '未准备', statusClass: 'waiting' }, { name: '产褥垫', detail: 'XL · 加长款', quantity: 1, unit: '包', category: '待产包', symbol: '垫', status: '准备完成', statusClass: 'ready' }]
    }
  },
  /** 页面每次回到前台都重新读取用户资料，确保伴侣加入或资料修改后及时同步。 */
  onShow() {
    this.todayLabel = formatToday()
    this.loadProfile()
  },
  computed: {
    /** @returns {string} 当前底部标签的中文标题。 */
    currentTabLabel() { return this.tabs.find(tab => tab.key === this.activeTab).label },
    /** @returns {string} 当前用户昵称；加载阶段和异常空值使用非虚构占位文案。 */
    profileName() { return this.currentUser.nickname || (this.profileLoading ? '加载中' : '我的家庭') },
    /** @returns {string} 当前用户昵称的首字符头像。 */
    profileInitial() { return firstCharacter(this.currentUser.nickname, '我') },
    /** @returns {Object|null} 当前用户所属家庭的公开资料。 */
    family() { return this.currentUser.family || null },
    /** @returns {Object[]} 当前家庭有效成员列表。 */
    familyMembers() { return this.family && Array.isArray(this.family.members) ? this.family.members : [] },
    /** @returns {Object|null} 当前家庭中除登录用户以外的伴侣资料。 */
    partner() {
      return this.familyMembers.find(member => member.id !== this.currentUser.id) || null
    },
    /** @returns {string} 伴侣昵称的首字符；尚未绑定时展示问号。 */
    partnerInitial() { return firstCharacter(this.partner && this.partner.nickname, '?') },
    /** @returns {Object|null} 当前家庭首个孕育中宝宝，找不到时退回首个宝宝。 */
    primaryBaby() {
      const babies = this.family && Array.isArray(this.family.babies) ? this.family.babies : []
      return babies.find(baby => baby.pregnancyStatus === 'PREGNANT') || babies[0] || null
    },
    /** @returns {{available: boolean, weeks: number, days: number, remainingDays: number|null, overdueDays: number}} 根据真实预产期计算的孕期进度。 */
    pregnancy() {
      if (!this.primaryBaby || (this.primaryBaby.pregnancyStatus && this.primaryBaby.pregnancyStatus !== 'PREGNANT')) return calculatePregnancy('')
      return calculatePregnancy(this.primaryBaby.expectedDate)
    },
    /** @returns {string} 孕期指标标题；宝宝有昵称时优先展示真实昵称。 */
    pregnancyMetricTitle() { return this.primaryBaby && this.primaryBaby.nickname ? `${this.primaryBaby.nickname}的孕期进度` : '孕期进度' },
    /** @returns {string} 根据真实预产期生成倒计时或逾期状态。 */
    dueDateLabel() {
      if (this.profileLoading) return '正在读取宝宝资料'
      if (!this.pregnancy.available) return '暂无有效预产期资料'
      if (this.pregnancy.remainingDays > 0) return `距离预产期 ${this.pregnancy.remainingDays} 天`
      if (this.pregnancy.remainingDays === 0) return '今天是预产期'
      return `已超过预产期 ${this.pregnancy.overdueDays} 天`
    },
    /** @returns {string} 当前用户的家庭身份和实时孕周。 */
    profileRoleLabel() {
      const roleLabel = this.currentUser.role === 'MOTHER' ? '准妈妈' : this.currentUser.role === 'FATHER' ? '准爸爸' : '家庭成员'
      if (!this.pregnancy.available) return roleLabel
      return `${roleLabel} · 孕 ${this.pregnancy.weeks} 周${this.pregnancy.days ? ` ${this.pregnancy.days} 天` : ''}`
    },
    /** @returns {string} “我的”页使用真实家庭名称生成的副标题。 */
    mineHeadingNote() { return this.family && this.family.name ? `${this.family.name} · 一起迎接新成员` : '我们一起迎接新成员' },
    /** @returns {string} 伴侣卡标题，准确反映当前家庭成员绑定状态。 */
    pairTitle() { return this.partner ? `${this.partner.nickname || '伴侣'}已绑定` : '等待伴侣加入家庭' },
    /** @returns {string} 伴侣卡的状态说明。 */
    pairDescription() { return this.partner ? '共同查看任务和物品清单' : '通过家庭码邀请宝爸或宝妈加入' },
    /** @returns {string} 根据真实宝宝和孕期数据生成的首页提醒。 */
    pregnancyReminder() {
      if (!this.primaryBaby) return '完成宝宝资料后，这里会同步显示孕期提醒。'
      const babyName = this.primaryBaby.nickname || '宝宝'
      if (!this.pregnancy.available) return `${babyName}的预产期资料尚未完善。`
      if (this.pregnancy.remainingDays < 0) return `${babyName}已到预产期，请留意身体变化并按计划沟通产检安排。`
      return `${babyName}现在是孕 ${this.pregnancy.weeks} 周${this.pregnancy.days ? ` ${this.pregnancy.days} 天` : ''}，距离预产期还有 ${this.pregnancy.remainingDays} 天。`
    },
    /** @returns {number} 全部任务中尚未完成的数量。 */
    pendingTaskCount() { return this.settingsData.filter(task => !task.done).length },
    /** @returns {number} 今天到期且尚未完成的任务数量。 */
    todayPendingCount() { return this.settingsData.filter(task => !task.done && task.due === '今天').length },
    /** @returns {DashboardTask[]} 日历原型中展示的今日任务子集。 */
    todayTasks() { return this.settingsData.slice(0, 2) },
    /** @returns {DashboardTask[]} 应用首页筛选后的今日安排。 */
    agendaTasks() {
      if (this.homeFilter === 'pending') return this.todayTasks.filter(task => !task.done)
      if (this.homeFilter === 'done') return this.todayTasks.filter(task => task.done)
      return this.todayTasks
    },
    /** @returns {DashboardTask[]} 任务页按来源筛选后的列表。 */
    filteredTasks() { return this.taskFilter === 'all' ? this.settingsData : this.settingsData.filter(item => item.type === this.taskFilter) },
    /** @returns {ChecklistItem[]} 当前物品分类下需要展示的清单。 */
    visibleItems() { return this.itemsData.filter(item => item.category === this.itemCategory || (this.itemCategory === '待产包' && item.category === '待产包')) }
  },
  methods: {
    /**
     * 建立匿名会话并通过 GET /api/v1/users/me 加载真实用户、家庭成员和宝宝资料。
     * 未完成首次资料补充的账号会回到引导页，网络错误则保留当前真实缓存并展示重试入口。
     *
     * @returns {Promise<void>} 资料加载完成后结束。
     */
    async loadProfile() {
      this.profileLoading = true
      this.profileError = ''
      try {
        const user = await ensureSessionAndUser()
        if (!user || !user.onboardingCompleted) {
          uni.reLaunch({ url: '/pages/onboarding/index' })
          return
        }
        const family = user.family || null
        this.currentUser = { ...user, role: user.role || (family && family.currentUserRole) || '', family }
        // 已完成引导的账号必然属于家庭；缺失时视为接口数据不完整，禁止回退到模拟孕期资料。
        if (!family) throw new Error('家庭资料加载不完整')
      } catch (error) {
        this.profileError = `${error.message || '用户资料加载失败'}，点击重试`
      } finally {
        this.profileLoading = false
      }
    },
    /**
     * 把家庭身份映射为头像配色类名。
     * @param {string} role MOTHER、FATHER 或空值。
     * @returns {'mom'|'dad'|'empty'} 对应的头像样式类。
     */
    avatarClass(role) { return role === 'MOTHER' ? 'mom' : role === 'FATHER' ? 'dad' : 'empty' },
    /**
     * 把任务的相对负责人身份映射为当前家庭里的真实昵称。
     * @param {DashboardTask} task 任务原型数据。
     * @returns {string} 当前用户、已绑定伴侣或通用伴侣称呼。
     */
    taskOwnerName(task) {
      if (task.ownerRole === 'SELF') return this.profileName
      if (task.ownerRole === 'PARTNER') return this.partner && this.partner.nickname ? this.partner.nickname : '伴侣'
      return '家庭成员'
    },
    /**
     * 切换任务完成状态；当前原型只更新本地响应式数据。
     * @param {DashboardTask} task 被点击的任务。
     * @returns {void}
     */
    toggleTask(task) { task.done = !task.done },
    /**
     * 根据当前页面分发悬浮按钮操作：任务页指派任务，清单页添加物品，其余页面显示鼓励提示。
     * @returns {void}
     */
    primaryAction() {
      if (this.activeTab === 'tasks') return this.assignTask()
      if (this.activeTab === 'items') return this.addItem()
      uni.showToast({ title: '每天完成一件小事就很好', icon: 'none' })
    },
    /**
     * 打开可输入的任务指派弹窗，并把确认后的夫妻任务插入列表顶部。
     * 后续接入后端时，应在接口成功后再更新本地列表。
     *
     * @returns {void}
     */
    assignTask() {
      uni.showModal({ title: '指派夫妻任务', editable: true, placeholderText: '例如：周末一起整理待产包', success: result => { if (result.confirm && result.content) { this.settingsData.unshift({ name: result.content, ownerRole: 'PARTNER', due: '待确认', type: 'couple', done: false, id: Date.now() }); uni.showToast({ title: '任务已发出', icon: 'none' }) } } })
    },
    /** @returns {void} 显示物品添加功能的当前占位反馈。 */
    addItem() { uni.showToast({ title: '物品添加入口已准备好', icon: 'none' }) },
    /** @returns {void} 根据真实伴侣绑定状态显示家庭空间反馈。 */
    showPairTip() { uni.showToast({ title: this.partner ? `已与${this.partner.nickname || '伴侣'}共享家庭` : '等待伴侣通过家庭码加入', icon: 'none' }) }
  }
}
</script>

<style scoped>
/* 登录后的主界面统一采用明亮米白看板风格。 */
page { background: #f8f7ef; }
.page { width: 100%; height: 100vh; min-height: 100vh; box-sizing: border-box; overflow: hidden; padding-bottom: calc(104px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; background: #f8f7ef; color: #0b0c0b; font-family: "Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif; }
.safe-area { height: env(safe-area-inset-top); flex: none; }
.topbar, .content { width: 100%; max-width: 560px; margin-left: auto; margin-right: auto; box-sizing: border-box; }
.topbar { display: flex; justify-content: space-between; align-items: center; flex: none; padding: 23px 22px 10px; }
.brand-block { min-width: 0; flex: 1; padding-right: 10px; }
.eyebrow { display: block; color: #8c8e84; font-size: 10px; font-weight: 700; letter-spacing: 2px; }
.page-title { display: block; max-width: 100%; margin-top: 8px; color: #0b0c0b; font-size: 27px; font-weight: 900; line-height: 1.15; white-space: nowrap; }
.account-chip { display: flex; align-items: center; gap: 7px; flex: none; max-width: 128px; padding: 10px 11px; border-radius: 24px; background: #efefe9; color: #151616; font-size: 12px; font-weight: 700; white-space: nowrap; }
.account-chip > text:nth-child(2) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.account-dot { width: 10px; height: 10px; flex: none; border-radius: 50%; background: #0cc98a; }
.chip-arrow { color: #7e817c; font-size: 17px; margin-left: 2px; }
.content { flex: 1; min-height: 0; height: auto; padding: 9px 22px 26px; }
.profile-error { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding: 10px 12px; border: 1px solid #efad9c; border-radius: 10px; background: #fff2ed; color: #a34e39; font-size: 11px; line-height: 1.5; }.profile-error text:first-child { min-width: 0; overflow-wrap: anywhere; }.profile-error text:last-child { flex: none; color: #111212; font-weight: 800; }
.date-line { display: flex; justify-content: space-between; align-items: center; color: #8c8e84; font-size: 12px; }
.sun-mark { color: #b7b8a5; font-size: 24px; }
.metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
.metric-card { min-height: 144px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 18px 16px 15px; border-radius: 22px; }
.yellow-card { background: #eaff3f; }
.metric-kicker { overflow: hidden; color: #555c28; font-size: 11px; font-weight: 700; letter-spacing: .5px; text-overflow: ellipsis; white-space: nowrap; }
.metric-value { display: flex; align-items: baseline; color: #080908; white-space: nowrap; }
.metric-value > text:first-child { font-size: 43px; font-weight: 900; line-height: 1; }
.metric-unit { margin-left: 5px; font-size: 17px; font-weight: 800; }
.metric-extra { margin-left: 7px; color: #44491f; font-size: 12px; font-weight: 700; }
.metric-foot { display: flex; justify-content: space-between; align-items: center; color: #69712b; font-size: 11px; }
.eye { font-size: 14px; color: #707836; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-top: 27px; color: #111211; font-size: 18px; font-weight: 900; }
.section-link { color: #7e817a; font-size: 11px; font-weight: 700; }
.filter-row { display: flex; align-items: center; gap: 8px; overflow-x: auto; white-space: nowrap; }
.home-filter { margin: 14px 0 11px; }
.filter-row text { padding: 10px 15px; border-radius: 22px; background: #eeeee9; color: #9a9c96; font-size: 13px; font-weight: 700; }
.filter-row text.selected { background: #050606; color: #eaff3f; }
.agenda-list { display: flex; flex-direction: column; gap: 10px; }
.agenda-card { display: flex; align-items: center; min-height: 72px; box-sizing: border-box; gap: 12px; padding: 13px 14px; border-radius: 16px; background: #fff; box-shadow: 0 7px 18px rgba(40, 40, 25, .06); }
.agenda-card.completed { opacity: .56; }
.agenda-icon { width: 43px; height: 43px; flex: none; display: grid; place-items: center; border-radius: 50%; background: #f2f2ee; color: #161817; font-size: 21px; font-weight: 700; }
.agenda-icon.system { background: #f2f4bc; color: #6c711e; }.agenda-icon.couple { background: #d8f3e7; color: #16876b; }
.agenda-copy { min-width: 0; flex: 1; }.agenda-name { display: block; overflow: hidden; color: #101110; font-size: 15px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }.agenda-meta { display: block; margin-top: 5px; color: #a1a39e; font-size: 11px; }.agenda-state { padding: 6px 8px; border-radius: 8px; background: #f1f1ed; color: #858781; font-size: 10px; font-weight: 700; }.agenda-card:not(.completed) .agenda-state { background: #fff1a4; color: #575b16; }
.empty-state { padding: 24px 15px; text-align: center; border-radius: 15px; background: #fff; color: #8c8e84; font-size: 13px; line-height: 1.8; }.empty-state text:last-child { display: block; color: #b4b5ae; font-size: 11px; }
.reminder-strip { display: flex; align-items: flex-start; gap: 10px; margin-top: 19px; padding: 13px 14px; border-radius: 14px; background: #fff8ce; }.reminder-icon { width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: 50%; background: #111212; color: #eaff3f; font-size: 13px; font-weight: 900; }.reminder-title { display: block; color: #1c1d13; font-size: 12px; font-weight: 900; }.reminder-copy { display: block; margin-top: 4px; color: #77764d; font-size: 11px; line-height: 1.5; }
.page-heading { margin: 9px 0 18px; }.heading { display: block; font-size: 32px; font-weight: 900; }.heading-note { display: block; margin-top: 6px; color: #8c8e84; font-size: 12px; }
.dark-filter { margin-bottom: 15px; }.assign-card { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 15px; border-radius: 15px; border: 1px dashed #b2b4ac; background: transparent; }.assign-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: #111212; color: #eaff3f; font-size: 23px; }.assign-title { display: block; font-size: 14px; font-weight: 900; }.assign-desc { display: block; margin-top: 4px; color: #9a9c96; font-size: 11px; }.assign-arrow { margin-left: auto; color: #8c8e84; font-size: 19px; }
.task-card { display: block; margin-bottom: 10px; padding: 15px; border-radius: 15px; background: #fff; box-shadow: 0 7px 18px rgba(40, 40, 25, .05); }.task-card.system { border-top: 4px solid #eaff3f; }.task-card.couple { border-top: 4px solid #bdebdc; }.task-card-top { display: flex; justify-content: space-between; color: #959791; font-size: 10px; }.task-card-main { display: flex; align-items: center; gap: 11px; margin-top: 11px; }.check { width: 24px; height: 24px; flex: none; display: grid; place-items: center; border: 1.5px solid #9ca099; border-radius: 50%; color: #fff; font-size: 14px; }.check.checked { border-color: #111212; background: #111212; }.task-name { display: block; color: #161716; font-size: 13px; }.big { font-size: 15px; font-weight: 800; }.task-owner { display: block; margin-top: 4px; color: #a1a39e; font-size: 10px; }.strike { color: #a7a9a3; text-decoration: line-through; }
.item-summary { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 19px; }.summary-number { color: #111212; font-size: 30px; font-weight: 900; }.summary-label { color: #8c8e84; font-size: 12px; }.summary-progress { width: 39%; height: 7px; overflow: hidden; border-radius: 8px; background: #e6e6de; }.summary-bar { width: 64%; height: 100%; background: #111212; }.summary-percent { color: #777a73; font-size: 12px; font-weight: 700; }.category-scroll { display: flex; gap: 17px; margin-bottom: 13px; white-space: nowrap; }.category-scroll text { padding-bottom: 7px; color: #a0a29b; font-size: 12px; font-weight: 700; }.category-scroll text.active { border-bottom: 2px solid #111212; color: #111212; }
.item-card { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 13px; border-radius: 15px; background: #fff; box-shadow: 0 7px 18px rgba(40, 40, 25, .05); }.item-illustration { width: 48px; height: 48px; display: grid; place-items: center; flex: none; border-radius: 50%; background: #f1f1ed; color: #222322; font-size: 12px; font-weight: 900; }.item-info { flex: 1; min-width: 0; }.item-name { display: block; color: #151615; font-size: 15px; font-weight: 900; }.item-meta { display: block; margin-top: 4px; color: #a1a39e; font-size: 11px; }.item-status { display: inline-block; margin-top: 7px; padding: 4px 8px; border-radius: 7px; font-size: 10px; font-weight: 700; }.preparing { background: #fff1a4; color: #6e681e; }.waiting { background: #efefeb; color: #858781; }.ready { background: #d7f5cf; color: #39803b; }.item-more { color: #969891; letter-spacing: 2px; }.add-item { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 15px; border: 1px dashed #afb1a9; border-radius: 15px; color: #555851; font-size: 13px; font-weight: 700; }.add-item-icon { color: #111212; font-size: 22px; }
.profile-card { display: flex; align-items: center; padding: 16px; border-radius: 16px; background: #fff; box-shadow: 0 7px 18px rgba(40, 40, 25, .05); }.avatar, .pair-avatar { display: grid; place-items: center; border-radius: 50%; }.avatar { width: 50px; height: 50px; margin-right: 12px; background: #eaff3f; color: #111212; font-size: 20px; font-weight: 900; }.profile-copy { flex: 1; min-width: 0; }.profile-name { display: block; overflow: hidden; font-size: 17px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }.profile-role { display: block; margin-top: 4px; color: #94968f; font-size: 11px; }.profile-arrow, .setting-arrow { color: #858781; font-size: 18px; }.pair-card { display: flex; align-items: center; gap: 12px; margin-top: 11px; padding: 15px; border-radius: 16px; background: #111212; color: #fff; }.pair-avatars { display: flex; align-items: center; flex: none; }.pair-avatar { width: 34px; height: 34px; border: 2px solid #111212; color: #111212; font-size: 12px; font-weight: 900; }.mom { background: #ffc8b8; }.dad { background: #bdebdc; }.empty { background: #eeeee9; color: #858781; }.pair-plus { margin: 0 3px; color: #93958e; }.pair-copy { flex: 1; min-width: 0; }.pair-title, .pair-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.pair-title { color: #fff; font-size: 13px; }.pair-desc { display: block; margin-top: 4px; color: #a5a7a1; font-size: 10px; }.bound { flex: none; padding: 5px 8px; border-radius: 7px; background: #eaff3f; color: #131414; font-size: 10px; font-weight: 900; }.bound.unbound { background: #eeeee9; color: #666962; }.settings-list { margin-top: 17px; overflow: hidden; border-radius: 15px; background: #fff; }.setting-row { display: flex; justify-content: space-between; align-items: center; padding: 17px 16px; border-bottom: 1px solid #f0efe9; color: #1d1e1d; font-size: 13px; }.setting-row:last-child { border-bottom: 0; }
.floating-action { position: fixed; right: 24px; bottom: calc(92px + env(safe-area-inset-bottom)); z-index: 12; width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; background: #111212; color: #fff; box-shadow: 0 9px 18px rgba(20, 20, 18, .2); }.floating-action text { margin-top: -4px; font-size: 45px; font-weight: 300; line-height: 1; }
.bottom-nav { position: fixed; left: 50%; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 10; width: calc(100% - 44px); max-width: 516px; transform: translateX(-50%); display: flex; justify-content: space-around; align-items: center; height: 73px; padding: 0 8px; border-radius: 38px; background: #050606; }.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-width: 55px; color: #fff; }.nav-icon-wrap { width: 47px; height: 47px; display: grid; place-items: center; border-radius: 50%; }.nav-item.active .nav-icon-wrap { background: #eaff3f; color: #080908; }.nav-icon { font-size: 25px; font-weight: 900; line-height: 1; }.nav-label { color: #a8aaa5; font-size: 9px; }.nav-item.active .nav-label { color: #eaff3f; font-weight: 800; }

/* 约 320dp 的窄屏手机压缩边距与指标卡字号，防止顶部、双列卡片和底栏拥挤。 */
@media screen and (max-width: 350px) {
  .topbar { padding: 19px 16px 8px; }
  .page-title { max-width: 100%; font-size: 24px; }
  .account-chip { max-width: 104px; gap: 4px; padding: 8px 9px; font-size: 10px; }
  .account-dot { width: 8px; height: 8px; }
  .content { padding-left: 16px; padding-right: 16px; }
  .metric-grid { gap: 8px; }
  .metric-card { min-height: 132px; padding: 15px 12px 13px; border-radius: 18px; }
  .metric-value > text:first-child { font-size: 36px; }
  .metric-unit { margin-left: 3px; font-size: 14px; }
  .metric-extra { margin-left: 4px; font-size: 10px; }
  .metric-foot { font-size: 10px; }
  .bottom-nav { width: calc(100% - 24px); height: 68px; }
  .nav-item { min-width: 48px; }
  .nav-icon-wrap { width: 43px; height: 43px; }
  .floating-action { right: 16px; width: 56px; height: 56px; }
}

/* 平板或桌面预览保持手机信息密度，内容和悬浮操作统一围绕中间列排布。 */
@media screen and (min-width: 600px) {
  .floating-action { right: calc((100vw - 560px) / 2 + 24px); }
}
</style>

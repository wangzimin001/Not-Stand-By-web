<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <view class="page">
    <!-- 兼容刘海屏和状态栏的顶部安全区。 -->
    <view class="safe-area"></view>
    <!-- 主内容区根据 activeTab 切换日历、任务、物品和个人中心。 -->
    <scroll-view scroll-y class="content">
      <!-- 真实资料加载失败时保留重试入口，不回退展示虚构用户。 -->
      <view v-if="profileError" class="profile-error" @tap="loadProfile"><text>{{ profileError }}</text><text>重试</text></view>
      <!-- 日历首页先展示今天、当前用户和见面倒计时，再进入今日时间轴。 -->
      <block v-if="activeTab === 'calendar'">
        <view class="focus-header">
          <view class="focus-copy"><text class="focus-kicker">{{ todayLabel }}</text><text class="focus-title">早上好，{{ profileName }}</text></view>
          <view class="account-chip" @tap="showPairTip"><text class="account-dot"></text><text>{{ familyDisplayName }}</text><text class="chip-arrow">⌄</text></view>
        </view>

        <view class="pregnancy-card yellow-card">
          <view class="pregnancy-card-top"><text class="metric-kicker">{{ babyDisplayName }} · 今天也在好好长大</text><text class="metric-spark">✦</text></view>
          <view class="meeting-metric"><text class="meeting-number">{{ pregnancyHeroValue }}</text><text class="meeting-unit">{{ pregnancyHeroUnit }}</text></view>
          <view class="metric-foot">
            <text class="pregnancy-week">{{ pregnancyWeekLabel }}</text>
            <view class="due-copy"><text>{{ expectedDateLabel }}</text><text>{{ dueDateLabel }}</text></view>
          </view>
        </view>

        <view class="section-head"><text>今天的安排</text><text class="section-link" @tap="activeTab = 'tasks'">{{ todayCompletedCount }} / {{ todayTasks.length }} 件完成 →</text></view>
        <view class="agenda-list">
          <view v-for="task in todayTasks" :key="task.id" class="agenda-row" :class="{ completed: task.done }" @tap="toggleTask(task)">
            <view class="agenda-time"><text>{{ task.time }}</text><text class="timeline-dot"></text></view>
            <view class="agenda-card">
              <view class="agenda-copy"><text class="agenda-name">{{ task.name }}</text><text class="agenda-meta">{{ task.type === 'system' ? '系统提醒' : '夫妻任务' }} · {{ taskOwnerName(task) }}</text></view>
              <text class="check agenda-check" :class="{ checked: task.done }">{{ task.done ? '✓' : '' }}</text>
            </view>
          </view>
          <view v-if="!todayTasks.length" class="empty-state"><text>今天没有待处理的安排</text><text>把时间留给彼此和宝宝</text></view>
        </view>

        <view class="reminder-strip"><view class="reminder-icon">!</view><view><text class="reminder-title">本周提醒</text><text class="reminder-copy">{{ pregnancyReminder }}</text></view></view>
      </block>

      <!-- 任务页首屏直接展示待完成数量，再提供筛选、指派和完成确认。 -->
      <block v-else-if="activeTab === 'tasks'">
        <view class="focus-header">
          <view class="focus-copy"><text class="focus-kicker">今天 · {{ todayLabel }}</text><text class="focus-title">还有 {{ pendingTaskCount }} 件要做</text></view>
          <view class="account-chip" @tap="showPairTip"><text class="account-dot"></text><text>{{ profileName }}</text><text class="chip-arrow">⌄</text></view>
        </view>
        <view class="task-overview"><text class="overview-number">{{ pendingTaskCount }}</text><text class="overview-unit">件待完成</text><text class="overview-divider">/</text><text class="overview-complete">{{ completedTaskCount }} 件已完成</text></view>
        <view class="filter-row dark-filter"><text :class="{ selected: taskFilter === 'all' }" @tap="taskFilter = 'all'">全部</text><text :class="{ selected: taskFilter === 'system' }" @tap="taskFilter = 'system'">系统提醒</text><text :class="{ selected: taskFilter === 'couple' }" @tap="taskFilter = 'couple'">夫妻任务</text></view>
        <view class="assign-card" @tap="assignTask"><view class="assign-icon">＋</view><view><text class="assign-title">指派一个任务</text><text class="assign-desc">把想让对方做的事说清楚</text></view><text class="assign-arrow">→</text></view>
        <view v-for="task in filteredTasks" :key="task.id" class="task-card" :class="task.type"><view class="task-card-top"><text class="tag">{{ task.type === 'system' ? '系统提醒' : '夫妻任务' }}</text><text class="task-due">{{ task.due }}</text></view><view class="task-card-main"><text class="check large" :class="{ checked: task.done }" @tap.stop="toggleTask(task)">{{ task.done ? '✓' : '' }}</text><view><text class="task-name big" :class="{ strike: task.done }">{{ task.name }}</text><text class="task-owner">{{ taskOwnerName(task) }}</text></view></view></view>
      </block>

      <!-- 物品清单页首屏直接展示剩余数量和准备进度。 -->
      <block v-else-if="activeTab === 'items'">
        <view class="focus-header">
          <view class="focus-copy"><text class="focus-kicker">待产包</text><text class="focus-title">还差 {{ checklistRemainingCount }} 件准备好</text></view>
          <view class="account-chip" @tap="showPairTip"><text class="account-dot"></text><text>{{ profileName }}</text><text class="chip-arrow">⌄</text></view>
        </view>
        <view class="item-progress-card yellow-card"><view class="item-progress-top"><text>准备进度</text><text class="summary-percent">{{ checklistProgress }}%</text></view><view class="summary-progress"><view class="summary-bar" :style="{ width: `${checklistProgress}%` }"></view></view><view class="item-progress-foot"><text>已准备 {{ checklistStats.ready }} 件</text><text>共 {{ checklistStats.total }} 件</text></view></view>
        <view class="category-scroll"><text v-for="category in categories" :key="category" :class="{ active: itemCategory === category }" @tap="itemCategory = category">{{ category }}</text></view>
        <view v-for="item in visibleItems" :key="item.name" class="item-card"><view class="item-illustration">{{ item.symbol }}</view><view class="item-info"><text class="item-name">{{ item.name }}</text><text class="item-meta">{{ item.detail }} · {{ item.quantity }}{{ item.unit }}</text></view><text class="item-status" :class="item.statusClass">{{ item.status }}</text></view>
        <view class="add-item" @tap="addItem"><text class="add-item-icon">＋</text><view class="add-item-copy"><text>添加物品</text><text>按分类选择，再补充数量和状态</text></view><text class="add-item-arrow">→</text></view>
      </block>

      <!-- 个人中心不再重复显示“我的”，直接从真实用户和家庭资料开始。 -->
      <block v-else>
        <view class="profile-card profile-focus">
          <view class="profile-main"><view class="avatar">{{ profileInitial }}</view><view class="profile-copy"><text class="profile-name">{{ profileName }}</text><text class="profile-role">{{ profileRoleLabel }}</text></view><text class="profile-arrow">→</text></view>
          <view class="profile-tags"><text>{{ expectedDateLabel }}</text><text>{{ babyDisplayName }}</text><text>{{ partner ? '家庭已绑定' : '等待绑定' }}</text></view>
        </view>
        <view class="family-overview"><text class="family-kicker">当前家庭</text><view class="family-title-row"><text class="family-title">{{ familyDisplayName }}</text><text class="family-heart">♡</text></view><view class="family-meta"><text>宝宝 {{ familyBabyCount }}</text><text>成员 {{ familyMemberCount }} / 2</text><text>已准备 {{ checklistStats.ready }} 件</text></view></view>
        <view class="pair-card" :class="{ 'pending-pair': !partner }" @tap="showPairTip"><view class="pair-avatars"><text class="pair-avatar" :class="avatarClass(currentUser.role)">{{ profileInitial }}</text><text class="pair-plus">＋</text><text class="pair-avatar" :class="avatarClass(partner && partner.role)">{{ partnerInitial }}</text></view><view class="pair-copy"><text class="pair-title">{{ pairTitle }}</text><text class="pair-desc">{{ pairDescription }}</text></view><text class="bound" :class="{ 'pending-status': !partner }">{{ partner ? '已绑定' : '邀请' }}</text></view>
        <view class="settings-head"><text>常用设置</text><text>资料随时可修改</text></view>
        <view class="settings-list"><view v-for="setting in settings" :key="setting" class="setting-row" @tap="showPairTip"><text>{{ setting }}</text><text class="setting-arrow">→</text></view></view>
      </block>
    </scroll-view>

    <!-- 只有任务和清单标签显示悬浮新增按钮，避免无关操作遮挡页面重点。 -->
    <view v-if="activeTab === 'tasks' || activeTab === 'items'" class="floating-action" @tap="primaryAction"><text>＋</text></view>
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
import { calculatePregnancy, firstCharacter, formatToday, parseDateOnly } from '../../utils/pregnancy'

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
 * @property {string} time 日历时间轴展示的计划时间。
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
      /** @type {DashboardTab[]} 底部导航定义。 */
      tabs: [{ key: 'calendar', label: '日历', icon: '⌂' }, { key: 'tasks', label: '任务', icon: '✓' }, { key: 'items', label: '清单', icon: '▤' }, { key: 'mine', label: '我的', icon: '●' }],
      // 物品清单支持的分类标签。
      categories: ['待产包', '衣物', '喂养', '护理'],
      // 清单接口尚未实现前使用的汇总原型：ready 为已准备数量，total 为计划总数。
      checklistStats: { ready: 18, total: 25 },
      // 个人中心的设置入口名称。
      settings: ['通知与提醒', '孕周设置', '关于不叉手'],
      /** @type {DashboardTask[]} 任务内容暂为原型数据，负责人名称会映射为真实用户或伴侣昵称。 */
      settingsData: [{ name: '涂抹妊娠油', ownerRole: 'SELF', due: '今天', time: '09:00', type: 'system', done: false, id: 1 }, { name: '整理待产包', ownerRole: 'PARTNER', due: '今天', time: '20:30', type: 'couple', done: false, id: 2 }, { name: '预约下次产检', ownerRole: 'SELF', due: '已完成', time: '14:00', type: 'system', done: true, id: 3 }],
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
    /** @returns {string} 当前用户昵称；加载阶段和异常空值使用非虚构占位文案。 */
    profileName() { return this.currentUser.nickname || (this.profileLoading ? '加载中' : '我的家庭') },
    /** @returns {string} 当前用户昵称的首字符头像。 */
    profileInitial() { return firstCharacter(this.currentUser.nickname, '我') },
    /** @returns {Object|null} 当前用户所属家庭的公开资料。 */
    family() { return this.currentUser.family || null },
    /** @returns {string} 当前家庭名称；资料尚未加载时使用通用称呼。 */
    familyDisplayName() { return this.family && this.family.name ? this.family.name : '我的家庭' },
    /** @returns {Object[]} 当前家庭有效成员列表。 */
    familyMembers() { return this.family && Array.isArray(this.family.members) ? this.family.members : [] },
    /** @returns {number} 当前家庭有效成员数量。 */
    familyMemberCount() { return this.familyMembers.length },
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
    /** @returns {number} 当前家庭有效宝宝数量。 */
    familyBabyCount() { return this.family && Array.isArray(this.family.babies) ? this.family.babies.length : 0 },
    /** @returns {string} 当前首个宝宝昵称，未填写时使用“宝宝”。 */
    babyDisplayName() { return this.primaryBaby && this.primaryBaby.nickname ? this.primaryBaby.nickname : '宝宝' },
    /** @returns {{available: boolean, weeks: number, days: number, remainingDays: number|null, overdueDays: number}} 根据真实预产期计算的孕期进度。 */
    pregnancy() {
      if (!this.primaryBaby || (this.primaryBaby.pregnancyStatus && this.primaryBaby.pregnancyStatus !== 'PREGNANT')) return calculatePregnancy('')
      return calculatePregnancy(this.primaryBaby.expectedDate)
    },
    /** @returns {number|string} 首页孕期主卡中的见面倒计时；资料缺失时展示占位符，过期后收敛为 0。 */
    pregnancyHeroValue() {
      if (!this.pregnancy.available) return '--'
      return Math.max(0, this.pregnancy.remainingDays)
    },
    /** @returns {string} 与见面倒计时配套的状态单位。 */
    pregnancyHeroUnit() {
      if (!this.pregnancy.available) return '等待宝宝资料'
      if (this.pregnancy.remainingDays > 0) return '天后见面'
      if (this.pregnancy.remainingDays === 0) return '今天是预产期'
      return '已经到预产期'
    },
    /** @returns {string} 首页孕期主卡左下角展示的实时孕周。 */
    pregnancyWeekLabel() {
      if (!this.pregnancy.available) return '孕周待完善'
      return `孕 ${this.pregnancy.weeks} 周${this.pregnancy.days ? ` + ${this.pregnancy.days} 天` : ''}`
    },
    /** @returns {string} 使用本地自然日解析后的预产期，避免直接解析 YYYY-MM-DD 产生时区偏移。 */
    expectedDateLabel() {
      const dueDate = parseDateOnly(this.primaryBaby && this.primaryBaby.expectedDate)
      if (!dueDate) return '预产期待完善'
      const year = dueDate.getFullYear()
      const month = String(dueDate.getMonth() + 1).padStart(2, '0')
      const day = String(dueDate.getDate()).padStart(2, '0')
      return `预产期 ${year}.${month}.${day}`
    },
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
    /** @returns {number} 全部任务中已经完成的数量。 */
    completedTaskCount() { return this.settingsData.filter(task => task.done).length },
    /** @returns {DashboardTask[]} 日历时间轴中展示的今日任务。 */
    todayTasks() { return this.settingsData.filter(task => task.due === '今天') },
    /** @returns {number} 今日时间轴中已经完成的任务数量。 */
    todayCompletedCount() { return this.todayTasks.filter(task => task.done).length },
    /** @returns {DashboardTask[]} 任务页按来源筛选后的列表。 */
    filteredTasks() { return this.taskFilter === 'all' ? this.settingsData : this.settingsData.filter(item => item.type === this.taskFilter) },
    /** @returns {number} 物品清单中尚未准备完成的原型数量。 */
    checklistRemainingCount() { return Math.max(0, this.checklistStats.total - this.checklistStats.ready) },
    /** @returns {number} 物品清单准备完成百分比，限制为 0～100。 */
    checklistProgress() {
      if (!this.checklistStats.total) return 0
      return Math.max(0, Math.min(100, Math.round((this.checklistStats.ready / this.checklistStats.total) * 100)))
    },
    /** @returns {ChecklistItem[]} “待产包”总览展示全部物品，其他标签只展示对应分类。 */
    visibleItems() { return this.itemCategory === '待产包' ? this.itemsData : this.itemsData.filter(item => item.category === this.itemCategory) }
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
     * 根据当前页面分发悬浮按钮操作：任务页指派任务，清单页添加物品。
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
      uni.showModal({ title: '指派夫妻任务', editable: true, placeholderText: '例如：周末一起整理待产包', success: result => { if (result.confirm && result.content) { this.settingsData.unshift({ name: result.content, ownerRole: 'PARTNER', due: '待确认', time: '--:--', type: 'couple', done: false, id: Date.now() }); uni.showToast({ title: '任务已发出', icon: 'none' }) } } })
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
.page { width: 100%; height: 100vh; min-height: 100vh; box-sizing: border-box; overflow: hidden; padding-bottom: calc(96px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; background: #f8f7ef; color: #0b0c0b; font-family: "Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif; }
.safe-area { height: calc(11px + env(safe-area-inset-top)); flex: none; }
.content { width: 100%; max-width: 560px; margin-left: auto; margin-right: auto; box-sizing: border-box; flex: 1; min-height: 0; height: auto; padding: 6px 18px 28px; }
.focus-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 12px; row-gap: 5px; margin-bottom: 18px; }
.focus-copy { display: contents; }
.focus-kicker { display: block; grid-column: 1; grid-row: 1; color: #8c8e84; font-size: 11px; line-height: 1.4; }
.focus-title { display: block; grid-column: 1 / -1; grid-row: 2; overflow-wrap: anywhere; color: #0b0c0b; font-size: 25px; font-weight: 900; line-height: 1.2; }
.account-chip { display: flex; grid-column: 2; grid-row: 1; align-items: center; gap: 7px; max-width: 132px; padding: 9px 11px; border: 1px solid #deded7; border-radius: 22px; background: #fff; color: #151616; font-size: 11px; font-weight: 700; white-space: nowrap; }
.account-chip > text:nth-child(2) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.account-dot { width: 10px; height: 10px; flex: none; border-radius: 50%; background: #0cc98a; }
.chip-arrow { color: #7e817c; font-size: 17px; margin-left: 2px; }
.profile-error { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding: 10px 12px; border: 1px solid #efad9c; border-radius: 10px; background: #fff2ed; color: #a34e39; font-size: 11px; line-height: 1.5; }.profile-error text:first-child { min-width: 0; overflow-wrap: anywhere; }.profile-error text:last-child { flex: none; color: #111212; font-weight: 800; }
.pregnancy-card { min-height: 170px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 18px; border-radius: 20px; box-shadow: 0 8px 20px rgba(40, 40, 25, .06); }
.yellow-card { background: #eaff3f; }
.pregnancy-card-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.metric-kicker { min-width: 0; overflow: hidden; color: #555c28; font-size: 11px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.metric-spark { flex: none; color: #111212; font-size: 21px; line-height: 1; }
.meeting-metric { display: flex; align-items: baseline; color: #080908; white-space: nowrap; }
.meeting-number { font-size: 58px; font-weight: 900; line-height: .95; }
.meeting-unit { margin-left: 7px; font-size: 15px; font-weight: 800; }
.metric-foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; color: #69712b; font-size: 10px; }
.pregnancy-week { flex: none; padding: 6px 9px; border: 1px solid rgba(17,18,18,.45); border-radius: 8px; color: #303512; font-weight: 800; }
.due-copy { min-width: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; overflow: hidden; text-align: right; }
.due-copy text { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.due-copy text:first-child { color: #303512; font-weight: 800; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; color: #111211; font-size: 18px; font-weight: 900; }
.section-link { color: #7e817a; font-size: 11px; font-weight: 700; }
.filter-row { display: flex; align-items: center; gap: 8px; overflow-x: auto; white-space: nowrap; }
.filter-row text { padding: 10px 15px; border-radius: 22px; background: #eeeee9; color: #9a9c96; font-size: 13px; font-weight: 700; }
.filter-row text.selected { background: #050606; color: #eaff3f; }
.agenda-list { display: flex; flex-direction: column; margin-top: 10px; }
.agenda-row { display: flex; align-items: stretch; min-height: 80px; }
.agenda-row.completed { opacity: .56; }
.agenda-time { position: relative; width: 55px; flex: none; align-self: stretch; padding-top: 22px; border-right: 1px dashed #c6c7bf; color: #252724; font-size: 11px; font-weight: 800; }
.timeline-dot { position: absolute; top: 27px; right: -5px; width: 8px; height: 8px; border: 1px solid #111212; border-radius: 50%; background: #eaff3f; }
.agenda-card { min-width: 0; flex: 1; display: flex; align-items: center; gap: 12px; min-height: 68px; box-sizing: border-box; margin: 0 0 10px 11px; padding: 12px 13px; border: 1px solid #deded7; border-radius: 14px; background: #fff; box-shadow: 0 5px 14px rgba(40, 40, 25, .04); }
.agenda-copy { min-width: 0; flex: 1; }.agenda-name { display: block; overflow: hidden; color: #101110; font-size: 14px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }.agenda-meta { display: block; margin-top: 5px; color: #989b94; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.agenda-check { width: 25px; height: 25px; }
.empty-state { padding: 24px 15px; text-align: center; border-radius: 15px; background: #fff; color: #8c8e84; font-size: 13px; line-height: 1.8; }.empty-state text:last-child { display: block; color: #b4b5ae; font-size: 11px; }
.reminder-strip { display: flex; align-items: flex-start; gap: 10px; margin-top: 19px; padding: 13px 14px; border-radius: 14px; background: #fff8ce; }.reminder-icon { width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: 50%; background: #111212; color: #eaff3f; font-size: 13px; font-weight: 900; }.reminder-title { display: block; color: #1c1d13; font-size: 12px; font-weight: 900; }.reminder-copy { display: block; margin-top: 4px; color: #77764d; font-size: 11px; line-height: 1.5; }
.task-overview { display: flex; align-items: baseline; margin: -2px 0 16px; white-space: nowrap; }.overview-number { color: #111212; font-size: 48px; font-weight: 900; line-height: 1; }.overview-unit { margin-left: 7px; color: #5f635d; font-size: 13px; font-weight: 700; }.overview-divider { margin: 0 7px; color: #c0c2bb; font-size: 16px; }.overview-complete { color: #8c8e84; font-size: 11px; }
.dark-filter { margin-bottom: 15px; }.assign-card { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 15px; border-radius: 15px; border: 1px dashed #b2b4ac; background: transparent; }.assign-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: #111212; color: #eaff3f; font-size: 23px; }.assign-title { display: block; font-size: 14px; font-weight: 900; }.assign-desc { display: block; margin-top: 4px; color: #9a9c96; font-size: 11px; }.assign-arrow { margin-left: auto; color: #8c8e84; font-size: 19px; }
.task-card { display: block; margin-bottom: 10px; padding: 15px; border-radius: 15px; background: #fff; box-shadow: 0 7px 18px rgba(40, 40, 25, .05); }.task-card.system { border-top: 4px solid #eaff3f; }.task-card.couple { border-top: 4px solid #bdebdc; }.task-card-top { display: flex; justify-content: space-between; color: #959791; font-size: 10px; }.task-card-main { display: flex; align-items: center; gap: 11px; margin-top: 11px; }.check { width: 24px; height: 24px; flex: none; display: grid; place-items: center; border: 1.5px solid #9ca099; border-radius: 50%; color: #fff; font-size: 14px; }.check.checked { border-color: #111212; background: #111212; }.task-name { display: block; color: #161716; font-size: 13px; }.big { font-size: 15px; font-weight: 800; }.task-owner { display: block; margin-top: 4px; color: #a1a39e; font-size: 10px; }.strike { color: #a7a9a3; text-decoration: line-through; }
.item-progress-card { min-height: 132px; box-sizing: border-box; margin-bottom: 18px; padding: 17px; border-radius: 18px; box-shadow: 0 7px 18px rgba(40, 40, 25, .05); }.item-progress-top, .item-progress-foot { display: flex; justify-content: space-between; align-items: center; }.item-progress-top > text:first-child { color: #555c28; font-size: 12px; font-weight: 800; }.summary-percent { color: #111212; font-size: 35px; font-weight: 900; line-height: 1; }.summary-progress { width: 100%; height: 7px; overflow: hidden; margin-top: 15px; border-radius: 8px; background: rgba(17,18,18,.14); }.summary-bar { height: 100%; border-radius: 8px; background: #111212; }.item-progress-foot { margin-top: 9px; color: #69712b; font-size: 10px; }.category-scroll { display: flex; gap: 17px; margin-bottom: 10px; overflow-x: auto; white-space: nowrap; }.category-scroll text { padding: 0 0 7px; color: #a0a29b; font-size: 12px; font-weight: 700; }.category-scroll text.active { border-bottom: 2px solid #111212; color: #111212; }
.item-card { display: flex; align-items: center; gap: 11px; min-height: 70px; box-sizing: border-box; margin-bottom: 8px; padding: 10px 11px; border: 1px solid #ecebe5; border-radius: 14px; background: #fff; box-shadow: 0 5px 14px rgba(40, 40, 25, .04); }.item-illustration { width: 43px; height: 43px; display: grid; place-items: center; flex: none; border-radius: 50%; background: #f1f1ed; color: #222322; font-size: 12px; font-weight: 900; }.item-info { flex: 1; min-width: 0; }.item-name { display: block; overflow: hidden; color: #151615; font-size: 14px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }.item-meta { display: block; overflow: hidden; margin-top: 4px; color: #a1a39e; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.item-status { flex: none; padding: 5px 8px; border-radius: 7px; font-size: 9px; font-weight: 800; }.preparing { background: #fff1a4; color: #6e681e; }.waiting { background: #efefeb; color: #858781; }.ready { background: #d7f5cf; color: #39803b; }.add-item { display: flex; align-items: center; gap: 11px; min-height: 65px; box-sizing: border-box; margin-top: 10px; padding: 11px 13px; border: 1px dashed #afb1a9; border-radius: 14px; color: #555851; }.add-item-icon { width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 50%; background: #111212; color: #eaff3f; font-size: 23px; }.add-item-copy { min-width: 0; flex: 1; }.add-item-copy text:first-child { display: block; color: #161716; font-size: 13px; font-weight: 900; }.add-item-copy text:last-child { display: block; overflow: hidden; margin-top: 3px; color: #9a9c96; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.add-item-arrow { flex: none; color: #8c8e84; font-size: 18px; }
.profile-card { padding: 17px; border-radius: 18px; background: #fff; box-shadow: 0 7px 18px rgba(40, 40, 25, .05); }.profile-focus { min-height: 132px; box-sizing: border-box; }.profile-main { display: flex; align-items: center; }.avatar, .pair-avatar { display: grid; place-items: center; border-radius: 50%; }.avatar { width: 52px; height: 52px; margin-right: 12px; background: #eaff3f; color: #111212; font-size: 20px; font-weight: 900; }.profile-copy { flex: 1; min-width: 0; }.profile-name { display: block; overflow: hidden; font-size: 18px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }.profile-role { display: block; margin-top: 4px; color: #94968f; font-size: 11px; }.profile-arrow, .setting-arrow { color: #858781; font-size: 18px; }.profile-tags { display: flex; gap: 7px; margin-top: 14px; overflow-x: auto; white-space: nowrap; }.profile-tags text { padding: 5px 8px; border: 1px solid #deded7; border-radius: 7px; color: #686b65; font-size: 9px; font-weight: 700; }
.family-overview { margin-top: 11px; padding: 16px; border-radius: 16px; background: #fff; border-left: 5px solid #bdebdc; }.family-kicker { color: #999c95; font-size: 10px; }.family-title-row { display: flex; justify-content: space-between; align-items: center; margin-top: 7px; }.family-title { overflow: hidden; color: #111212; font-size: 18px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }.family-heart { color: #ff9c99; font-size: 25px; }.family-meta { display: flex; gap: 16px; margin-top: 10px; color: #858981; font-size: 10px; white-space: nowrap; }
.pair-card { display: flex; align-items: center; gap: 12px; margin-top: 11px; padding: 14px; border-radius: 16px; background: #111212; color: #fff; }.pair-card.pending-pair { border: 1px dashed #afb1a9; background: #fff; color: #111212; }.pair-avatars { display: flex; align-items: center; flex: none; }.pair-avatar { width: 34px; height: 34px; border: 2px solid #111212; color: #111212; font-size: 12px; font-weight: 900; }.mom { background: #ffc8b8; }.dad { background: #bdebdc; }.empty { background: #eeeee9; color: #858781; }.pair-plus { margin: 0 3px; color: #93958e; }.pair-copy { flex: 1; min-width: 0; }.pair-title, .pair-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.pair-title { color: #fff; font-size: 13px; font-weight: 800; }.pair-card.pending-pair .pair-title { color: #111212; }.pair-desc { display: block; margin-top: 4px; color: #a5a7a1; font-size: 10px; }.pair-card.pending-pair .pair-desc { color: #8d9089; }.bound { flex: none; padding: 5px 8px; border-radius: 7px; background: #eaff3f; color: #131414; font-size: 10px; font-weight: 900; }.bound.pending-status { color: #111212; }
.settings-head { display: flex; justify-content: space-between; align-items: center; margin: 22px 1px 10px; }.settings-head text:first-child { color: #111212; font-size: 17px; font-weight: 900; }.settings-head text:last-child { color: #989b94; font-size: 10px; }.settings-list { overflow: hidden; border-radius: 15px; background: #fff; }.setting-row { display: flex; justify-content: space-between; align-items: center; padding: 17px 16px; border-bottom: 1px solid #f0efe9; color: #1d1e1d; font-size: 13px; }.setting-row:last-child { border-bottom: 0; }
.floating-action { position: fixed; right: 22px; bottom: calc(83px + env(safe-area-inset-bottom)); z-index: 12; width: 58px; height: 58px; display: grid; place-items: center; border-radius: 50%; background: #111212; color: #fff; box-shadow: 0 9px 18px rgba(20, 20, 18, .2); }.floating-action text { margin-top: -4px; font-size: 41px; font-weight: 300; line-height: 1; }
.bottom-nav { position: fixed; left: 50%; bottom: calc(10px + env(safe-area-inset-bottom)); z-index: 10; width: calc(100% - 36px); max-width: 524px; transform: translateX(-50%); display: flex; justify-content: space-around; align-items: center; height: 68px; padding: 0 8px; border-radius: 34px; background: #050606; }.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; min-width: 53px; color: #fff; }.nav-icon-wrap { width: 43px; height: 43px; display: grid; place-items: center; border-radius: 50%; }.nav-item.active .nav-icon-wrap { background: #eaff3f; color: #080908; }.nav-icon { font-size: 23px; font-weight: 900; line-height: 1; }.nav-label { color: #a8aaa5; font-size: 9px; }.nav-item.active .nav-label { color: #eaff3f; font-weight: 800; }

/* 约 320dp 的窄屏手机压缩标题、概览卡和底栏，保证核心信息仍在首屏完整显示。 */
@media screen and (max-width: 350px) {
  .focus-header { gap: 8px; margin-bottom: 16px; }
  .focus-title { font-size: 24px; }
  .account-chip { max-width: 104px; gap: 4px; padding: 8px 9px; font-size: 10px; }
  .account-dot { width: 8px; height: 8px; }
  .content { padding-left: 16px; padding-right: 16px; }
  .pregnancy-card { min-height: 156px; padding: 16px 14px; border-radius: 18px; }
  .meeting-number { font-size: 50px; }
  .meeting-unit { margin-left: 5px; font-size: 13px; }
  .metric-foot { font-size: 10px; }
  .overview-number { font-size: 42px; }
  .summary-percent { font-size: 31px; }
  .family-meta { gap: 9px; font-size: 9px; }
  .due-copy { font-size: 9px; }
  .profile-tags { gap: 5px; }
  .profile-tags text { padding-left: 6px; padding-right: 6px; font-size: 8px; }
  .bottom-nav { width: calc(100% - 24px); height: 66px; }
  .nav-item { min-width: 48px; }
  .nav-icon-wrap { width: 43px; height: 43px; }
  .floating-action { right: 16px; width: 54px; height: 54px; }
}

/* 矮屏设备压缩非核心留白，内容仍可通过主滚动区完整访问。 */
@media screen and (max-height: 680px) {
  .safe-area { height: calc(7px + env(safe-area-inset-top)); }
  .focus-header { margin-bottom: 14px; }
  .pregnancy-card { min-height: 154px; }
  .section-head { margin-top: 20px; }
  .item-progress-card { min-height: 122px; margin-bottom: 14px; }
}

/* 平板或桌面预览保持手机信息密度，内容和悬浮操作统一围绕中间列排布。 */
@media screen and (min-width: 600px) {
  .floating-action { right: calc((100vw - 560px) / 2 + 24px); }
}
</style>

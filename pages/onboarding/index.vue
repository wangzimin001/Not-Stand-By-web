<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <view class="onboarding-page">
    <!-- 总步骤进度始终固定在页面顶部。 -->
    <view class="topbar">
      <text class="step-count" v-if="!loading">{{ stepLabel }}</text>
    </view>

    <!-- 匿名会话和用户状态尚未准备好时显示轻量加载说明。 -->
    <view v-if="loading" class="state-panel">
      <text class="state-title">正在准备你的空间</text>
      <text class="state-copy">只需要几步，我们就能一起把迎接宝宝的事情理清楚。</text>
    </view>

    <!-- QuestionStage 根据 step 切换问题，并统一处理渐隐、渐显动画。 -->
    <view v-else class="content">
      <QuestionStage ref="questionStage" :title="questionTitle" :subtitle="questionSubtitle">
        <!-- 网络或后端校验错误保留在当前问题内，避免丢失已填写草稿。 -->
        <view v-if="errorMessage" class="error-box">
          <text>{{ errorMessage }}</text>
          <text class="error-action" @tap="retry">重试</text>
        </view>

        <!-- 身份决定后续文案以及后端 gender 字段。 -->
        <view v-if="step === 'role'" class="choices">
          <ChoiceButton label="宝妈" hint="我是正在经历孕期的妈妈" :selected="draft.role === 'MOTHER'" @tap="chooseRole('MOTHER')" />
          <ChoiceButton label="宝爸" hint="我是一起准备迎接宝宝的爸爸" :selected="draft.role === 'FATHER'" @tap="chooseRole('FATHER')" />
        </view>

        <view v-else-if="step === 'nickname'" class="form-block">
          <input v-model.trim="draft.nickname" class="chalk-input" maxlength="20" placeholder="输入你希望被称呼的名字" confirm-type="done" @confirm="nextFromNickname" />
          <text class="field-note">2～20 个字即可，之后也可以在“我的”里修改。</text>
        </view>

        <!-- 新建家庭和加入家庭从这里进入两条不同的问题分支。 -->
        <view v-else-if="step === 'family-action'" class="choices">
          <ChoiceButton label="新建家庭" hint="和伴侣一起开始准备" :selected="draft.familyAction === 'CREATE'" @tap="chooseFamilyAction('CREATE')" />
          <ChoiceButton label="加入家庭" hint="输入家庭码或扫描邀请二维码" :selected="draft.familyAction === 'JOIN'" @tap="chooseFamilyAction('JOIN')" />
        </view>

        <view v-else-if="step === 'due-date'" class="form-block">
          <picker mode="date" :value="draft.expectedDate" :start="today" @change="onDueDateChange">
            <view class="date-picker"><text>{{ draft.expectedDate || '选择预产期' }}</text><text class="date-arrow">→</text></view>
          </picker>
          <text class="field-note">预产期只属于家庭，加入家庭后会自动同步给你。</text>
        </view>

        <view v-else-if="step === 'baby-nickname'" class="form-block">
          <input v-model.trim="draft.babyNickname" class="chalk-input" maxlength="20" placeholder="例如：小豆丁、团团" confirm-type="done" @confirm="submit" />
          <text class="field-note">可以先跳过，以后慢慢想。</text>
        </view>

        <view v-else-if="step === 'join-method'" class="choices">
          <ChoiceButton label="扫描二维码" hint="使用伴侣分享的邀请二维码" @tap="scanInvite" />
          <ChoiceButton label="输入家庭码" hint="家庭码通常是 6～12 位字母或数字" @tap="nextStep('join-code')" />
        </view>

        <view v-else-if="step === 'join-code'" class="form-block">
          <input v-model.trim="draft.familyCode" class="chalk-input code-input" maxlength="16" placeholder="输入家庭码" confirm-type="done" @confirm="previewInvite" />
          <text class="field-note">家庭码区分大小写，请向伴侣确认后再提交。</text>
        </view>

        <!-- 真正加入前仅展示安全的家庭摘要，让用户再次确认目标家庭。 -->
        <view v-else-if="step === 'join-preview'" class="preview-box">
          <text class="preview-kicker">邀请确认</text>
          <text class="preview-title">{{ familyPreview.name || '一个待迎接宝宝的家庭' }}</text>
          <text class="preview-copy">确认加入后，你将和伴侣共同维护孕期日历、任务与物品清单。</text>
          <view class="preview-meta"><text>家庭码</text><text>{{ draft.familyCode }}</text></view>
        </view>

        <!-- 操作区根据当前步骤决定返回、跳过和主按钮是否出现。 -->
        <view class="actions">
          <button v-if="canGoBack" class="ghost-button" @tap="goBack">返回</button>
          <button v-if="step === 'baby-nickname'" class="ghost-button" @tap="skipBabyNickname">稍后再说</button>
          <button v-if="showPrimary" class="primary-button" :disabled="busy" @tap="handlePrimary">{{ busy ? '正在保存…' : primaryLabel }}</button>
        </view>
      </QuestionStage>
    </view>
  </view>
</template>

<script>
import QuestionStage from '../../components/onboarding/QuestionStage.vue'
import ChoiceButton from '../../components/onboarding/ChoiceButton.vue'
import { ensureSessionAndUser } from '../../services/auth'
import { completeOnboarding, previewFamilyInvite } from '../../services/onboarding'
import { getOnboardingDraft, saveOnboardingDraft, clearOnboardingDraft } from '../../utils/session'

export default {
  // QuestionStage 负责换题动画，ChoiceButton 负责统一选项视觉。
  components: { QuestionStage, ChoiceButton },
  /**
   * 创建首次资料补充页面状态。
   * @returns {Object} 页面加载态、步骤状态、家庭预览和用户草稿。
   */
  data() {
    return {
      // 是否仍在创建匿名会话并读取当前用户。
      loading: true,
      // 是否正在预览邀请或提交资料，用于阻止重复请求。
      busy: false,
      // 当前需要展示给用户的网络或业务错误。
      errorMessage: '',
      // 当前问题键，同时驱动页面内容、进度和换题动画。
      step: 'role',
      // 家庭码预览接口返回的安全家庭摘要。
      familyPreview: {},
      // 首次资料补充草稿；每次关键修改都会同步到本地存储。
      draft: {
        // MOTHER 或 FATHER，用于确定性别和家庭成员身份。
        role: '',
        // 用户希望在家庭空间内显示的称呼。
        nickname: '',
        // CREATE 表示新建家庭，JOIN 表示加入已有家庭。
        familyAction: '',
        // 新建家庭时必填的预产期，格式为 YYYY-MM-DD。
        expectedDate: '',
        // 可跳过的宝宝小名。
        babyNickname: '',
        // 加入家庭时由输入或扫码得到的邀请码。
        familyCode: ''
      }
    }
  },
  computed: {
    /** @returns {string} 日期选择器允许选择的最早日期。 */
    today() {
      const date = new Date()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${date.getFullYear()}-${month}-${day}`
    },
    /** @returns {string} 当前问题对应的“序号 / 总数”文案。 */
    stepLabel() {
      const position = { role: 1, nickname: 2, 'family-action': 3, 'due-date': 4, 'baby-nickname': 5, 'join-method': 4, 'join-code': 5, 'join-preview': 5 }[this.step]
      return `${position || 1} / 5`
    },
    /** @returns {string} 根据身份和步骤生成的问题标题。 */
    questionTitle() {
      const roleName = this.draft.role === 'FATHER' ? '宝爸' : '宝妈'
      return {
        role: '您是宝爸还是宝妈？',
        nickname: `${roleName}您好，怎么称呼您？`,
        'family-action': '您希望新建一个家庭，还是加入已有家庭？',
        'due-date': this.draft.role === 'FATHER' ? '宝妈的预产期是哪一天？' : '您的预产期是哪一天？',
        'baby-nickname': '你们想怎么称呼宝宝？',
        'join-method': '请用哪种方式加入家庭？',
        'join-code': '请输入家庭码',
        'join-preview': '确认加入这个家庭吗？'
      }[this.step]
    },
    /** @returns {string} 当前问题的辅助解释。 */
    questionSubtitle() {
      return {
        role: '选一个最符合你现在身份的选项。',
        nickname: '一个简单的称呼，就能让协作更有温度。',
        'family-action': '新建家庭需要填写预产期，加入家庭则不需要重复填写。',
        'due-date': '这是家庭日历的起点，之后可以随时调整。',
        'baby-nickname': '这是宝宝的小名，可以先跳过，以后慢慢想。',
        'join-method': '伴侣可以在家庭设置里生成邀请。',
        'join-code': '家庭码只用于找到正确的家庭。',
        'join-preview': ''
      }[this.step]
    },
    /** @returns {string} 当前主按钮文案。 */
    primaryLabel() {
      return { role: '继续', nickname: '继续', 'family-action': this.draft.familyAction === 'JOIN' ? '下一步' : '继续', 'due-date': '继续', 'baby-nickname': '完成设置', 'join-code': '查找家庭', 'join-preview': '确认加入' }[this.step] || '继续'
    },
    /** @returns {boolean} 当前步骤是否需要显示主按钮。 */
    showPrimary() { return ['role', 'nickname', 'family-action', 'due-date', 'baby-nickname', 'join-code', 'join-preview'].includes(this.step) },
    /** @returns {boolean} 当前是否允许返回上一题。 */
    canGoBack() { return this.step !== 'role' && !this.busy }
  },
  /** 页面加载后立即准备匿名会话并判断是否需要继续引导。 */
  onLoad() { this.bootstrap() },
  methods: {
    /**
     * 恢复本地草稿、建立匿名会话并读取后端用户状态。
     * 已完成资料补充的用户直接重启到首页，未完成用户留在当前引导页。
     *
     * @returns {Promise<void>}
     */
    async bootstrap() {
      this.loading = true
      this.errorMessage = ''
      this.draft = { ...this.draft, ...getOnboardingDraft() }
      try {
        const user = await ensureSessionAndUser()
        if (user && (user.onboardingCompleted || user.onboardingStatus === 'COMPLETED' || user.profileComplete === true || (user.onboarding && user.onboarding.status === 'COMPLETED'))) {
          uni.reLaunch({ url: '/pages/index/index' })
          return
        }
      } catch (error) {
        this.errorMessage = error.message || '暂时无法连接服务，请确认电脑和手机在同一网络。'
      } finally {
        this.loading = false
      }
    },
    /** @returns {void} 在错误提示中重新执行页面初始化。 */
    retry() { this.bootstrap() },
    /** @returns {void} 把当前草稿保存到本地，防止退出页面后内容丢失。 */
    persist() { saveOnboardingDraft(this.draft) },
    /** @param {'MOTHER'|'FATHER'} role 选择的家庭身份。 @returns {void} */
    chooseRole(role) { this.draft.role = role; this.persist(); this.nextStep('nickname') },
    /** @param {'CREATE'|'JOIN'} action 家庭操作。 @returns {void} */
    chooseFamilyAction(action) { this.draft.familyAction = action; this.persist(); this.nextStep(action === 'CREATE' ? 'due-date' : 'join-method') },
    /** @returns {void} 昵称合法时进入家庭方式问题。 */
    nextFromNickname() { if (this.validNickname()) this.nextStep('family-action') },
    /**
     * 校验昵称的最小长度并在页面上反馈。
     * @returns {boolean} 昵称是否满足当前前端规则。
     */
    validNickname() {
      if ((this.draft.nickname || '').length < 2) { uni.showToast({ title: '请至少输入 2 个字', icon: 'none' }); return false }
      return true
    },
    /** @param {Object} event uni picker 的 change 事件。 @returns {void} */
    onDueDateChange(event) { this.draft.expectedDate = event.detail.value; this.persist() },
    /**
     * 通过 QuestionStage 的两阶段动画切换问题，确保旧内容完全离场后才更新步骤。
     * @param {string} step 目标问题键。
     * @returns {void}
     */
    nextStep(step) {
      const applyStep = () => { this.errorMessage = ''; this.step = step; this.persist() }
      const stage = this.$refs.questionStage
      if (!stage || typeof stage.swapQuestion !== 'function') { applyStep(); return }
      stage.swapQuestion(applyStep)
    },
    /**
     * 根据当前分支回到逻辑上的上一题，而不是依赖浏览器历史。
     * @returns {void}
     */
    goBack() {
      const previous = { nickname: 'role', 'family-action': 'nickname', 'due-date': 'family-action', 'baby-nickname': 'due-date', 'join-method': 'family-action', 'join-code': 'join-method', 'join-preview': 'join-code' }[this.step]
      if (previous) this.nextStep(previous)
    },
    /**
     * 统一处理主按钮：先校验当前问题，再决定换题、预览家庭或提交资料。
     * @returns {void|Promise<void>}
     */
    handlePrimary() {
      if (this.step === 'role') return this.draft.role ? this.nextStep('nickname') : uni.showToast({ title: '请选择宝爸或宝妈', icon: 'none' })
      if (this.step === 'nickname') return this.nextFromNickname()
      if (this.step === 'family-action') return this.draft.familyAction ? this.nextStep(this.draft.familyAction === 'CREATE' ? 'due-date' : 'join-method') : uni.showToast({ title: '请选择家庭方式', icon: 'none' })
      if (this.step === 'due-date') return this.draft.expectedDate ? this.nextStep('baby-nickname') : uni.showToast({ title: '请选择预产期', icon: 'none' })
      if (this.step === 'baby-nickname') return this.submit()
      if (this.step === 'join-code') return this.previewInvite()
      if (this.step === 'join-preview') return this.submit()
    },
    /**
     * 调用家庭邀请预览接口，成功后进入确认页，失败时保留家庭码供用户修改。
     * @returns {Promise<void>}
     */
    async previewInvite() {
      if (!this.draft.familyCode) { uni.showToast({ title: '请输入家庭码', icon: 'none' }); return }
      this.busy = true; this.errorMessage = ''
      try { this.familyPreview = await previewFamilyInvite(this.draft.familyCode); this.nextStep('join-preview') }
      catch (error) { this.errorMessage = error.message || '家庭码无效或已过期' }
      finally { this.busy = false }
    },
    /**
     * 调用系统扫码能力，从二维码参数或纯文本中提取家庭码并立即预览。
     * @returns {void}
     */
    scanInvite() {
      uni.scanCode({ onlyFromCamera: false, success: result => {
        const raw = String(result.result || '')
        const match = raw.match(/(?:familyCode|code)=([A-Za-z0-9_-]+)/i)
        this.draft.familyCode = match ? match[1] : raw.trim()
        this.persist(); this.previewInvite()
      }, fail: () => uni.showToast({ title: '没有读取到家庭码', icon: 'none' }) })
    },
    /** @returns {void} 清空宝宝小名后按正常流程提交。 */
    skipBabyNickname() { this.draft.babyNickname = ''; this.submit() },
    /**
     * 完成最终必填校验并把整份草稿提交给后端统一引导接口。
     * 成功后删除本地草稿并重启到首页；失败时保留草稿和当前步骤。
     *
     * @returns {Promise<void>}
     */
    async submit() {
      if (this.busy) return
      if (!this.draft.nickname || !this.draft.role || !this.draft.familyAction) { uni.showToast({ title: '请先完成前面的信息', icon: 'none' }); return }
      if (this.draft.familyAction === 'CREATE' && !this.draft.expectedDate) { uni.showToast({ title: '请选择预产期', icon: 'none' }); return }
      if (this.draft.familyAction === 'JOIN' && !this.draft.familyCode) { uni.showToast({ title: '请输入家庭码', icon: 'none' }); return }
      this.busy = true; this.errorMessage = ''; this.persist()
      try {
        await completeOnboarding({ ...this.draft, babyNickname: this.draft.babyNickname || null })
        clearOnboardingDraft()
        uni.showToast({ title: '家庭已准备好', icon: 'success' })
        setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 450)
      } catch (error) { this.errorMessage = error.message || '保存失败，请稍后重试' }
      finally { this.busy = false }
    }
  }
}
</script>

<style scoped>
/* 首次引导沿用主看板的暖米白、黑色与荧光黄，保持轻快统一的视觉语气。 */
page { background: #f8f7ef; }
.onboarding-page { width: 100%; min-height: 100vh; box-sizing: border-box; overflow-x: hidden; padding: calc(28px + env(safe-area-inset-top)) 24px calc(18px + env(safe-area-inset-bottom)); background: radial-gradient(circle at 88% 8%, rgba(234, 255, 63, .24), transparent 31%), #f8f7ef; color: #111212; display: flex; flex-direction: column; }
.topbar, .content, .state-panel { width: 100%; max-width: 480px; margin-left: auto; margin-right: auto; box-sizing: border-box; }
.topbar { display: flex; justify-content: flex-end; align-items: flex-start; flex: none; }
.step-count { color: #777b74; font-size: 12px; padding-top: 5px; }
.content { flex: 1; min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 28px 0 20px; }
.state-panel { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 10px; }
.state-title { color: #111212; font-size: 24px; font-weight: 800; }
.state-copy { color: #777b74; font-size: 14px; line-height: 1.7; margin-top: 12px; }
.choices, .form-block { width: 100%; }
.chalk-input { width: 100%; height: 55px; box-sizing: border-box; border-bottom: 1px solid #aeb1aa; color: #111212; font-size: 20px; padding: 0 2px; }
.chalk-input::placeholder { color: #a3a69f; }
.code-input { text-transform: uppercase; letter-spacing: 3px; }
.field-note { display: block; color: #858980; font-size: 12px; line-height: 1.6; margin-top: 14px; }
.date-picker { height: 61px; border: 1px solid #d4d6cf; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: #fff; color: #111212; font-size: 17px; }
.date-arrow { color: #111212; font-size: 21px; }
.preview-box { width: 100%; border: 1px solid #a9b238; border-radius: 12px; padding: 21px 18px; box-sizing: border-box; background: #f4ffbf; }
.preview-kicker { color: #6c731c; font-size: 12px; letter-spacing: 2px; }
.preview-title { display: block; color: #111212; font-size: 22px; font-weight: 800; margin-top: 13px; }
.preview-copy { display: block; color: #65695f; font-size: 14px; line-height: 1.65; margin-top: 10px; }
.preview-meta { display: flex; justify-content: space-between; color: #596014; font-size: 12px; margin-top: 20px; }
.actions { margin-top: 30px; display: flex; gap: 10px; }
button { margin: 0; }
/* App 端 button 默认使用 ::after 绘制半像素边框，必须关闭，否则会与自定义圆角叠成错位拐角。 */
button::after { border: none; }
.primary-button, .ghost-button { flex: 1; min-width: 0; height: 49px; line-height: 49px; padding: 0 8px; box-sizing: border-box; overflow: hidden; border: 1px solid transparent; border-radius: 10px; font-size: 16px; white-space: nowrap; }
.primary-button { color: #111212; background: #eaff3f; }
.primary-button[disabled] { opacity: .55; }
.ghost-button { color: #555951; border: 1px solid #c9cbc4; background: rgba(255, 255, 255, .72); }
.error-box { display: flex; align-items: center; justify-content: space-between; color: #a34e39; font-size: 12px; line-height: 1.5; padding: 10px 12px; border: 1px solid #efad9c; border-radius: 10px; margin-bottom: 16px; background: #fff2ed; overflow-wrap: anywhere; }
.error-action { color: #111212; margin-left: 12px; font-weight: 700; }
/* 窄屏手机减少水平留白，保证三个操作按钮和长标题仍有足够空间。 */
@media screen and (max-width: 350px) {
  .onboarding-page { padding-left: 18px; padding-right: 18px; }
  .content { padding-top: 24px; padding-bottom: 18px; }
  .actions { gap: 6px; margin-top: 23px; }
  .primary-button, .ghost-button { height: 45px; line-height: 45px; padding: 0 5px; font-size: 14px; }
}

/* 矮屏手机让内容自然向下流动并允许页面滚动，避免垂直居中造成上下裁切。 */
@media screen and (max-height: 680px) {
  .onboarding-page { padding-top: calc(20px + env(safe-area-inset-top)); }
  .content { flex: none; align-items: flex-start; padding-top: 22px; padding-bottom: 12px; }
}
</style>

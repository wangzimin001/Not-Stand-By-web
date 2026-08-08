<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <view class="onboarding-page">
    <view class="topbar">
      <view class="brand-mark"><text>不叉手</text><text class="brand-sub">NOT STAND BY</text></view>
      <text class="step-count" v-if="!loading">{{ stepLabel }}</text>
    </view>

    <view v-if="loading" class="state-panel">
      <text class="state-title">正在准备你的空间</text>
      <text class="state-copy">只需要几步，我们就能一起把迎接宝宝的事情理清楚。</text>
    </view>

    <view v-else class="content">
      <QuestionStage :question-key="step" :eyebrow="eyebrow" :title="questionTitle" :subtitle="questionSubtitle">
        <view v-if="errorMessage" class="error-box">
          <text>{{ errorMessage }}</text>
          <text class="error-action" @tap="retry">重试</text>
        </view>

        <view v-if="step === 'role'" class="choices">
          <ChoiceButton label="宝妈" hint="我是正在经历孕期的妈妈" :selected="draft.role === 'MOTHER'" @tap="chooseRole('MOTHER')" />
          <ChoiceButton label="宝爸" hint="我是一起准备迎接宝宝的爸爸" :selected="draft.role === 'FATHER'" @tap="chooseRole('FATHER')" />
        </view>

        <view v-else-if="step === 'nickname'" class="form-block">
          <input v-model.trim="draft.nickname" class="chalk-input" maxlength="20" placeholder="输入你希望被称呼的名字" confirm-type="done" @confirm="nextFromNickname" />
          <text class="field-note">2～20 个字即可，之后也可以在“我的”里修改。</text>
        </view>

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
          <ChoiceButton label="输入家庭码" hint="家庭码通常是 6～12 位字母或数字" @tap="step = 'join-code'" />
        </view>

        <view v-else-if="step === 'join-code'" class="form-block">
          <input v-model.trim="draft.familyCode" class="chalk-input code-input" maxlength="16" placeholder="输入家庭码" confirm-type="done" @confirm="previewInvite" />
          <text class="field-note">家庭码区分大小写，请向伴侣确认后再提交。</text>
        </view>

        <view v-else-if="step === 'join-preview'" class="preview-box">
          <text class="preview-kicker">邀请确认</text>
          <text class="preview-title">{{ familyPreview.name || '一个待迎接宝宝的家庭' }}</text>
          <text class="preview-copy">确认加入后，你将和伴侣共同维护孕期日历、任务与物品清单。</text>
          <view class="preview-meta"><text>家庭码</text><text>{{ draft.familyCode }}</text></view>
        </view>

        <view class="actions">
          <button v-if="canGoBack" class="ghost-button" @tap="goBack">返回</button>
          <button v-if="step === 'baby-nickname'" class="ghost-button" @tap="skipBabyNickname">稍后再说</button>
          <button v-if="showPrimary" class="primary-button" :disabled="busy" @tap="handlePrimary">{{ busy ? '正在保存…' : primaryLabel }}</button>
        </view>
      </QuestionStage>
    </view>
    <view class="footer-note"><text>你的信息只用于家庭协作</text><text class="footer-dot">·</text><text>随时可以修改</text></view>
  </view>
</template>

<script>
import QuestionStage from '../../components/onboarding/QuestionStage.vue'
import ChoiceButton from '../../components/onboarding/ChoiceButton.vue'
import { ensureSessionAndUser } from '../../services/auth'
import { completeOnboarding, previewFamilyInvite } from '../../services/onboarding'
import { getOnboardingDraft, saveOnboardingDraft, clearOnboardingDraft } from '../../utils/session'

export default {
  components: { QuestionStage, ChoiceButton },
  data() {
    return {
      loading: true,
      busy: false,
      errorMessage: '',
      step: 'role',
      familyPreview: {},
      draft: { role: '', nickname: '', familyAction: '', expectedDate: '', babyNickname: '', familyCode: '' }
    }
  },
  computed: {
    today() {
      const date = new Date()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${date.getFullYear()}-${month}-${day}`
    },
    stepLabel() {
      const position = { role: 1, nickname: 2, 'family-action': 3, 'due-date': 4, 'baby-nickname': 5, 'join-method': 4, 'join-code': 5, 'join-preview': 5 }[this.step]
      return `${position || 1} / 5`
    },
    eyebrow() { return this.step === 'join-preview' ? '一起准备' : 'WELCOME TO NOT STAND BY' },
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
    primaryLabel() {
      return { role: '继续', nickname: '继续', 'family-action': this.draft.familyAction === 'JOIN' ? '下一步' : '继续', 'due-date': '继续', 'baby-nickname': '完成设置', 'join-code': '查找家庭', 'join-preview': '确认加入' }[this.step] || '继续'
    },
    showPrimary() { return ['role', 'nickname', 'family-action', 'due-date', 'baby-nickname', 'join-code', 'join-preview'].includes(this.step) },
    canGoBack() { return this.step !== 'role' && !this.busy }
  },
  onLoad() { this.bootstrap() },
  methods: {
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
    retry() { this.bootstrap() },
    persist() { saveOnboardingDraft(this.draft) },
    chooseRole(role) { this.draft.role = role; this.persist(); this.nextStep('nickname') },
    chooseFamilyAction(action) { this.draft.familyAction = action; this.persist(); this.nextStep(action === 'CREATE' ? 'due-date' : 'join-method') },
    nextFromNickname() { if (this.validNickname()) this.nextStep('family-action') },
    validNickname() {
      if ((this.draft.nickname || '').length < 2) { uni.showToast({ title: '请至少输入 2 个字', icon: 'none' }); return false }
      return true
    },
    onDueDateChange(event) { this.draft.expectedDate = event.detail.value; this.persist() },
    nextStep(step) { this.errorMessage = ''; this.step = step; this.persist() },
    goBack() {
      const previous = { nickname: 'role', 'family-action': 'nickname', 'due-date': 'family-action', 'baby-nickname': 'due-date', 'join-method': 'family-action', 'join-code': 'join-method', 'join-preview': 'join-code' }[this.step]
      if (previous) this.step = previous
    },
    handlePrimary() {
      if (this.step === 'role') return this.draft.role ? this.nextStep('nickname') : uni.showToast({ title: '请选择宝爸或宝妈', icon: 'none' })
      if (this.step === 'nickname') return this.nextFromNickname()
      if (this.step === 'family-action') return this.draft.familyAction ? this.nextStep(this.draft.familyAction === 'CREATE' ? 'due-date' : 'join-method') : uni.showToast({ title: '请选择家庭方式', icon: 'none' })
      if (this.step === 'due-date') return this.draft.expectedDate ? this.nextStep('baby-nickname') : uni.showToast({ title: '请选择预产期', icon: 'none' })
      if (this.step === 'baby-nickname') return this.submit()
      if (this.step === 'join-code') return this.previewInvite()
      if (this.step === 'join-preview') return this.submit()
    },
    async previewInvite() {
      if (!this.draft.familyCode) { uni.showToast({ title: '请输入家庭码', icon: 'none' }); return }
      this.busy = true; this.errorMessage = ''
      try { this.familyPreview = await previewFamilyInvite(this.draft.familyCode); this.nextStep('join-preview') }
      catch (error) { this.errorMessage = error.message || '家庭码无效或已过期' }
      finally { this.busy = false }
    },
    scanInvite() {
      uni.scanCode({ onlyFromCamera: false, success: result => {
        const raw = String(result.result || '')
        const match = raw.match(/(?:familyCode|code)=([A-Za-z0-9_-]+)/i)
        this.draft.familyCode = match ? match[1] : raw.trim()
        this.persist(); this.previewInvite()
      }, fail: () => uni.showToast({ title: '没有读取到家庭码', icon: 'none' }) })
    },
    skipBabyNickname() { this.draft.babyNickname = ''; this.submit() },
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
page { background: #17251f; }
.onboarding-page { min-height: 100vh; box-sizing: border-box; padding: 48px 24px 26px; background: #17251f; color: #fffdf3; display: flex; flex-direction: column; }
.topbar { display: flex; justify-content: space-between; align-items: flex-start; }
.brand-mark { display: flex; flex-direction: column; color: #e5bd65; font-size: 18px; font-weight: 700; letter-spacing: 2px; }
.brand-sub { color: #b8d0bf; font-size: 9px; letter-spacing: 2px; margin-top: 5px; }
.step-count { color: #b8d0bf; font-size: 12px; padding-top: 5px; }
.content { flex: 1; display: flex; align-items: center; padding: 62px 0 28px; }
.state-panel { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 10px; }
.state-title { color: #fffdf3; font-size: 24px; font-weight: 700; }
.state-copy { color: #b8d0bf; font-size: 14px; line-height: 1.7; margin-top: 12px; }
.choices, .form-block { width: 100%; }
.chalk-input { width: 100%; height: 55px; box-sizing: border-box; border-bottom: 1px solid #b8d0bf; color: #fffdf3; font-size: 20px; padding: 0 2px; }
.chalk-input::placeholder { color: #769081; }
.code-input { text-transform: uppercase; letter-spacing: 3px; }
.field-note { display: block; color: #8eaa99; font-size: 12px; line-height: 1.6; margin-top: 14px; }
.date-picker { height: 61px; border: 1px solid rgba(184, 208, 191, .66); border-radius: 7px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; color: #fffdf3; font-size: 17px; }
.date-arrow { color: #e5bd65; font-size: 21px; }
.preview-box { width: 100%; border: 1px solid #e5bd65; border-radius: 7px; padding: 21px 18px; box-sizing: border-box; background: rgba(229, 189, 101, .1); }
.preview-kicker { color: #e5bd65; font-size: 12px; letter-spacing: 2px; }
.preview-title { display: block; color: #fffdf3; font-size: 22px; font-weight: 700; margin-top: 13px; }
.preview-copy { display: block; color: #b8d0bf; font-size: 14px; line-height: 1.65; margin-top: 10px; }
.preview-meta { display: flex; justify-content: space-between; color: #e5bd65; font-size: 12px; margin-top: 20px; }
.actions { margin-top: 30px; display: flex; gap: 10px; }
button { margin: 0; }
.primary-button, .ghost-button { flex: 1; height: 49px; line-height: 49px; border-radius: 6px; font-size: 16px; }
.primary-button { color: #17251f; background: #e5bd65; }
.primary-button[disabled] { opacity: .55; }
.ghost-button { color: #b8d0bf; border: 1px solid rgba(184, 208, 191, .48); background: transparent; }
.error-box { display: flex; align-items: center; justify-content: space-between; color: #f3a995; font-size: 12px; line-height: 1.5; padding: 10px 12px; border: 1px solid rgba(243, 169, 149, .52); border-radius: 6px; margin-bottom: 16px; }
.error-action { color: #e5bd65; margin-left: 12px; }
.footer-note { text-align: center; color: #769081; font-size: 11px; }
.footer-dot { padding: 0 7px; color: #e5bd65; }
</style>

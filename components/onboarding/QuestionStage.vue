<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <!-- phase 由组件方法驱动，避免使用 App 端不支持的 Vue Transition 内置组件。 -->
  <view class="stage" :class="`stage-${phase}`">
    <text class="question">{{ title }}</text>
    <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
    <view class="stage-content">
      <slot />
    </view>
  </view>
</template>

<script>
export default {
  name: 'QuestionStage',
  props: {
    // 当前步骤的问题标题。
    title: { type: String, default: '' },
    // 标题下方的补充说明。
    subtitle: { type: String, default: '' }
  },
  // 新问题完成渐显时通知父页面，预留埋点或自动聚焦能力。
  emits: ['transition-end'],
  /**
   * 创建跨 App/H5 都可用的手动动画状态。
   * @returns {{phase: 'idle'|'leaving'|'enter-pending'|'entering', leaveTimer: ReturnType<typeof setTimeout>|null, enterTimer: ReturnType<typeof setTimeout>|null, finishTimer: ReturnType<typeof setTimeout>|null}} 动画阶段和计时器。
   */
  data() {
    return { phase: 'idle', leaveTimer: null, enterTimer: null, finishTimer: null }
  },
  /** 组件销毁前清除动画计时器，防止离开页面后继续更新状态。 */
  beforeUnmount() {
    this.clearAnimationTimers()
  },
  methods: {
    /** @returns {void} 清除当前换题动画创建的全部计时器。 */
    clearAnimationTimers() {
      if (this.leaveTimer) clearTimeout(this.leaveTimer)
      if (this.enterTimer) clearTimeout(this.enterTimer)
      if (this.finishTimer) clearTimeout(this.finishTimer)
      this.leaveTimer = this.enterTimer = this.finishTimer = null
    },
    /**
     * 先让旧问题向上渐隐，隐藏完成后执行内容替换，再让新问题从下方渐显。
     * @param {Function} updateContent 由父页面传入的步骤替换函数。
     * @returns {boolean} 是否成功启动动画；动画进行中会拒绝重复触发。
     */
    swapQuestion(updateContent) {
      if (this.phase !== 'idle' || typeof updateContent !== 'function') return false
      this.clearAnimationTimers()
      this.phase = 'leaving'
      this.leaveTimer = setTimeout(() => {
        // 在完全透明时切换问题，避免新文案抢先闪现。
        this.phase = 'enter-pending'
        updateContent()
        this.$nextTick(() => {
          // 留出一帧让浏览器提交初始位移，下一帧再开始渐显过渡。
          this.enterTimer = setTimeout(() => {
            this.phase = 'entering'
            this.finishTimer = setTimeout(() => {
              this.phase = 'idle'
              this.$emit('transition-end')
              this.clearAnimationTimers()
            }, 480)
          }, 24)
        })
      }, 420)
      return true
    }
  }
}
</script>

<style scoped>
/* 占满手机内容区；在平板等宽屏设备上限制最大宽度，避免作为 Flex 子项按文字宽度收缩。 */
.stage { width: 100%; max-width: 480px; min-width: 0; box-sizing: border-box; opacity: 1; transform: translateY(0); }
/* 离场时间比原版更长，负向位移确保旧问题明确向上渐隐。 */
.stage-leaving { opacity: 0; transform: translateY(-18px); transition: opacity .42s ease, transform .42s cubic-bezier(.4, 0, .2, 1); }
/* 新问题从下方回到原位，和旧问题的向上离场组成连贯的换题方向。 */
.stage-enter-pending { opacity: 0; transform: translateY(18px); transition: none; }
.stage-entering { opacity: 1; transform: translateY(0); transition: opacity .48s ease, transform .48s cubic-bezier(.2, .7, .2, 1); }
.question { display: block; color: #111212; font-size: 27px; font-weight: 800; line-height: 1.35; letter-spacing: 1px; overflow-wrap: anywhere; }
.subtitle { display: block; color: #777b74; font-size: 14px; line-height: 1.65; margin-top: 11px; }
.stage-content { margin-top: 29px; }

/* 兼容约 320dp 的窄屏手机，避免长问题标题和操作区相互挤压。 */
@media screen and (max-width: 350px) {
  .question { font-size: 24px; line-height: 1.3; }
  .subtitle { margin-top: 9px; font-size: 13px; }
  .stage-content { margin-top: 22px; }
}
</style>

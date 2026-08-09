<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <!-- visible 切换时通过透明度和位移实现问题的渐隐、渐显。 -->
  <view class="stage" :class="{ 'stage-hidden': !visible }">
    <view v-if="eyebrow" class="eyebrow">{{ eyebrow }}</view>
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
    subtitle: { type: String, default: '' },
    // 标题上方的小型阶段标识。
    eyebrow: { type: String, default: '' },
    // 父页面的步骤标识；值变化时触发换题动画。
    questionKey: { type: [String, Number], default: '' }
  },
  // 新问题完成渐显时通知父页面，预留埋点或自动聚焦能力。
  emits: ['transition-end'],
  /**
   * 创建动画状态。
   * @returns {{visible: boolean, timer: ReturnType<typeof setTimeout>|null}} 组件内部状态。
   */
  data() {
    return { visible: true, timer: null }
  },
  watch: {
    /** 监听步骤键变化，开始一次完整的换题动画。 */
    questionKey() {
      this.swapQuestion()
    }
  },
  /** 组件销毁前取消计时器，避免销毁后继续修改状态。 */
  beforeUnmount() {
    if (this.timer) clearTimeout(this.timer)
  },
  methods: {
    /**
     * 先隐藏旧问题，等待 CSS 渐隐后再显示新问题并发送完成事件。
     * @returns {void}
     */
    swapQuestion() {
      if (this.timer) clearTimeout(this.timer)
      this.visible = false
      this.timer = setTimeout(() => {
        this.visible = true
        this.$emit('transition-end')
      }, 230)
    }
  }
}
</script>

<style scoped>
.stage { opacity: 1; transform: translateY(0); transition: opacity .23s ease, transform .23s ease; }
.stage-hidden { opacity: 0; transform: translateY(8px); }
.eyebrow { color: #e5bd65; font-size: 12px; letter-spacing: 2px; margin-bottom: 18px; text-transform: uppercase; }
.question { display: block; color: #fffdf3; font-size: 29px; font-weight: 700; line-height: 1.35; letter-spacing: 1px; }
.subtitle { display: block; color: #b8d0bf; font-size: 14px; line-height: 1.65; margin-top: 11px; }
.stage-content { margin-top: 29px; }
</style>

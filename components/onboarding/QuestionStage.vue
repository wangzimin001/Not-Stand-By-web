<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
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
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    eyebrow: { type: String, default: '' },
    questionKey: { type: [String, Number], default: '' }
  },
  emits: ['transition-end'],
  data() {
    return { visible: true, timer: null }
  },
  watch: {
    questionKey() {
      this.swapQuestion()
    }
  },
  beforeUnmount() {
    if (this.timer) clearTimeout(this.timer)
  },
  methods: {
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

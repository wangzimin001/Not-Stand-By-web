<!-- 中文编码标记：本项目源文件统一使用 UTF-8。 -->
<template>
  <!-- 整个卡片都是点击区域；选中态和紧凑态由父页面控制。 -->
  <view class="choice" :class="{ selected, compact }" @tap="$emit('tap')">
    <view class="choice-copy">
      <text class="choice-label">{{ label }}</text>
      <text v-if="hint" class="choice-hint">{{ hint }}</text>
    </view>
    <text class="choice-mark">{{ selected ? '✓' : '→' }}</text>
  </view>
</template>

<script>
export default {
  name: 'ChoiceButton',
  props: {
    // 选项主文案，例如“宝妈”或“新建家庭”。
    label: { type: String, required: true },
    // 可选的解释文案，帮助用户理解选择结果。
    hint: { type: String, default: '' },
    // 当前选项是否已被父页面选中。
    selected: { type: Boolean, default: false },
    // 是否使用较矮的卡片尺寸。
    compact: { type: Boolean, default: false }
  },
  // tap 只表达用户意图，具体字段更新和页面跳转由父页面负责。
  emits: ['tap']
}
</script>

<style scoped>
.choice { min-height: 68px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(184, 208, 191, .66); border-radius: 7px; padding: 13px 16px; margin-bottom: 12px; background: rgba(255, 253, 243, .05); transition: background .18s ease, border-color .18s ease, transform .18s ease; }
.choice:active { transform: scale(.985); }
.choice.selected { border-color: #e5bd65; background: rgba(229, 189, 101, .16); }
.choice.compact { min-height: 56px; }
.choice-copy { display: flex; flex-direction: column; min-width: 0; }
.choice-label { color: #fffdf3; font-size: 17px; font-weight: 600; }
.choice-hint { color: #b8d0bf; font-size: 12px; line-height: 1.45; margin-top: 4px; }
.choice-mark { color: #e5bd65; font-size: 21px; width: 24px; text-align: right; }
</style>

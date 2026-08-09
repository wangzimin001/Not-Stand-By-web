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
.choice { width: 100%; min-width: 0; min-height: 68px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; border: 1px solid #d4d6cf; border-radius: 12px; padding: 13px 16px; margin-bottom: 12px; background: rgba(255, 255, 255, .86); box-shadow: 0 8px 22px rgba(34, 36, 29, .045); transition: background .2s ease, border-color .2s ease, transform .2s ease; }
.choice:active { transform: scale(.985); }
.choice.selected { border-color: #111212; background: #f2ff9c; }
.choice.compact { min-height: 56px; }
.choice-copy { display: flex; flex-direction: column; min-width: 0; }
.choice-label { color: #111212; font-size: 17px; font-weight: 700; }
.choice-hint { color: #7d8179; font-size: 12px; line-height: 1.45; margin-top: 4px; overflow-wrap: anywhere; }
.choice-mark { color: #111212; font-size: 21px; width: 24px; text-align: right; }

@media screen and (max-width: 350px) {
  .choice { min-height: 62px; padding: 11px 13px; margin-bottom: 10px; }
  .choice-label { font-size: 16px; }
  .choice-hint { font-size: 11px; }
}
</style>

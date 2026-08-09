// 中文编码标记：本项目源文件统一使用 UTF-8。
/** 完整孕期按 40 周计算，共 280 个自然日。 */
const FULL_TERM_DAYS = 280
/** 一周包含的自然日数量。 */
const DAYS_PER_WEEK = 7
/** 中文星期名称，索引与 Date.getDay() 保持一致。 */
const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 把本地日期转换为 UTC 日历时间戳，只比较年月日，避免时分秒和夏令时影响天数差。
 * @param {Date} date 需要转换的有效日期。
 * @returns {number} 对应自然日的 UTC 毫秒时间戳。
 */
function calendarStamp(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * 解析后端返回的 YYYY-MM-DD 日期，不使用浏览器的 UTC 字符串解析规则。
 * @param {string} value 后端日期字段。
 * @returns {Date|null} 有效的本地日期；格式或日期非法时返回 null。
 */
export function parseDateOnly(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const result = new Date(year, month - 1, day)
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null
  return result
}

/**
 * 根据宝宝预产期计算当前孕周、周内天数和距离预产期的自然日数量。
 * 孕周限制在 0～40 周内；超过预产期后 remainingDays 为负数，供页面展示逾期状态。
 *
 * @param {string} expectedDate 后端返回的预产期，格式为 YYYY-MM-DD。
 * @param {Date} [now=new Date()] 当前时间；参数可在测试中固定。
 * @returns {{available: boolean, weeks: number, days: number, remainingDays: number|null, overdueDays: number}} 孕期进度。
 */
export function calculatePregnancy(expectedDate, now = new Date()) {
  const dueDate = parseDateOnly(expectedDate)
  if (!dueDate || Number.isNaN(now.getTime())) {
    return { available: false, weeks: 0, days: 0, remainingDays: null, overdueDays: 0 }
  }
  const remainingDays = Math.round((calendarStamp(dueDate) - calendarStamp(now)) / 86400000)
  const gestationalDays = Math.max(0, Math.min(FULL_TERM_DAYS, FULL_TERM_DAYS - remainingDays))
  return {
    available: true,
    weeks: Math.floor(gestationalDays / DAYS_PER_WEEK),
    days: gestationalDays % DAYS_PER_WEEK,
    remainingDays,
    overdueDays: Math.max(0, -remainingDays)
  }
}

/**
 * 格式化首页当天日期。
 * @param {Date} [date=new Date()] 当前本地日期。
 * @returns {string} 例如“2026 年 8 月 9 日 · 周日”。
 */
export function formatToday(date = new Date()) {
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${WEEKDAY_NAMES[date.getDay()]}`
}

/**
 * 取得昵称的首个 Unicode 字符作为头像文字，避免中文和 emoji 被拆成半个字符。
 * @param {string} value 用户昵称。
 * @param {string} [fallback='我'] 昵称为空时的占位文字。
 * @returns {string} 单个头像字符。
 */
export function firstCharacter(value, fallback = '我') {
  const characters = Array.from(String(value || '').trim())
  return characters[0] || fallback
}

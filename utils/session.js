// 中文编码标记：本项目源文件统一使用 UTF-8。
// 匿名设备凭证与访问令牌的本地存储键。
const SESSION_KEY = 'nsb_session'
// 首次资料补充未提交草稿的本地存储键。
const DRAFT_KEY = 'nsb_onboarding_draft'

/**
 * 安全读取 uni-app 本地存储；运行环境不支持或读取失败时返回 null。
 * @param {string} key 存储键。
 * @returns {*} 已保存的值，未找到时为 null。
 */
function read(key) {
  try { return uni.getStorageSync(key) || null } catch (error) { return null }
}

/**
 * 安全写入 uni-app 本地存储。
 * @param {string} key 存储键。
 * @param {*} value 需要保存的值。
 * @returns {boolean} 是否写入成功。
 */
function write(key, value) {
  try { uni.setStorageSync(key, value); return true } catch (error) { return false }
}

/** @returns {Object|null} 当前匿名会话与设备凭证。 */
export function getSession() { return read(SESSION_KEY) }

/** @param {Object} value 会话对象。 @returns {boolean} 是否保存成功。 */
export function saveSession(value) { return write(SESSION_KEY, value) }

/**
 * 清除失效的访问令牌，但尽量保留 installationId 和 installationSecret。
 * 保留设备凭证后，下一次匿名登录仍可由后端识别为同一安装实例。
 *
 * @returns {void}
 */
export function clearSession() {
  const current = read(SESSION_KEY) || {}
  const installation = current.installationId && current.installationSecret
    ? { installationId: current.installationId, installationSecret: current.installationSecret }
    : null
  try {
    if (installation) uni.setStorageSync(SESSION_KEY, installation)
    else uni.removeStorageSync(SESSION_KEY)
  } catch (error) {}
}

/** @returns {Object} 首次资料补充草稿；没有草稿时返回空对象。 */
export function getOnboardingDraft() { return read(DRAFT_KEY) || {} }

/** @param {Object} value 首次资料补充草稿。 @returns {boolean} 是否保存成功。 */
export function saveOnboardingDraft(value) { return write(DRAFT_KEY, value) }

/** @returns {void} 删除已提交或不再需要的首次资料补充草稿。 */
export function clearOnboardingDraft() { try { uni.removeStorageSync(DRAFT_KEY) } catch (error) {} }
export { SESSION_KEY, DRAFT_KEY }

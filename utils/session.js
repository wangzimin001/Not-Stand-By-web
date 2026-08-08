// 中文编码标记：本项目源文件统一使用 UTF-8。
const SESSION_KEY = 'nsb_session'
const DRAFT_KEY = 'nsb_onboarding_draft'

function read(key) {
  try { return uni.getStorageSync(key) || null } catch (error) { return null }
}

function write(key, value) {
  try { uni.setStorageSync(key, value); return true } catch (error) { return false }
}

export function getSession() { return read(SESSION_KEY) }
export function saveSession(value) { return write(SESSION_KEY, value) }
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
export function getOnboardingDraft() { return read(DRAFT_KEY) || {} }
export function saveOnboardingDraft(value) { return write(DRAFT_KEY, value) }
export function clearOnboardingDraft() { try { uni.removeStorageSync(DRAFT_KEY) } catch (error) {} }
export { SESSION_KEY, DRAFT_KEY }

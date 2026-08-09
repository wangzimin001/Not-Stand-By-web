// 中文编码标记：本项目源文件统一使用 UTF-8。
import { get, post } from './http'

/**
 * 调用 `GET /api/v1/family-invites/{code}/preview` 预览家庭邀请。
 *
 * @param {string} code 用户输入或扫码得到的家庭码。
 * @returns {Promise<Object>} 可安全展示的家庭名称、宝宝小名等摘要。
 */
export function previewFamilyInvite(code) {
  return get(`/api/v1/family-invites/${encodeURIComponent(String(code || '').trim())}/preview`)
}

/**
 * 调用 `POST /api/v1/onboarding/create-family` 创建家庭并完成首次资料补充。
 *
 * @param {Object} payload 昵称、角色、预产期和可选宝宝小名。
 * @returns {Promise<Object>} 创建后的用户、家庭和孕期资料。
 */
export function createFamily(payload) {
  return post('/api/v1/onboarding/create-family', payload)
}

/**
 * 调用 `POST /api/v1/onboarding/join-family` 加入已有家庭并完成首次资料补充。
 *
 * @param {Object} payload 昵称、角色和家庭码。
 * @returns {Promise<Object>} 加入后的用户、家庭和孕期资料。
 */
export function joinFamily(payload) {
  return post('/api/v1/onboarding/join-family', payload)
}

/**
 * 调用统一入口 `POST /api/v1/onboarding/complete`，由后端根据 familyAction 创建或加入家庭。
 *
 * @param {Object} payload 完整的首次资料补充草稿。
 * @returns {Promise<Object>} 完成后的用户、家庭和孕期资料。
 */
export function completeOnboarding(payload) {
  return post('/api/v1/onboarding/complete', payload)
}

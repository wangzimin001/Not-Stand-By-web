// 中文编码标记：本项目源文件统一使用 UTF-8。
import { get, post } from './http'
import { getSession, saveSession, clearSession } from '../utils/session'

/**
 * 生成带业务前缀的高随机标识，用于本地安装实例和安装密钥。
 * 支持 Web Crypto 的环境使用加密级随机数，旧运行环境退化为 Math.random。
 *
 * @param {string} prefix 标识用途前缀，例如 `install` 或 `secret`。
 * @returns {string} 包含时间片和 16 字节随机值的标识。
 */
function makeId(prefix) {
  const values = new Uint8Array(16)
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(values)
  } else {
    for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256)
  }
  const random = Array.from(values).map(value => value.toString(16).padStart(2, '0')).join('')
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

/**
 * 读取或创建当前 App 安装实例的设备凭证。
 *
 * installationId 用来定位匿名账号，installationSecret 用来证明当前设备仍是原安装实例。
 * 两者都会随会话写入本地存储，普通 accessToken 失效时仍会保留。
 *
 * @returns {{installationId: string, installationSecret: string}} 匿名设备凭证。
 */
function installation() {
  const current = getSession() || {}
  return {
    installationId: current.installationId || makeId('install'),
    installationSecret: current.installationSecret || makeId('secret')
  }
}

/**
 * 确保当前设备拥有可用的匿名后端会话。
 *
 * 已有 accessToken 时直接复用；否则调用 `POST /api/v1/auth/anonymous` 换取新令牌并持久化。
 *
 * @returns {Promise<Object>} 包含设备凭证、accessToken、过期时间和用户摘要的会话对象。
 */
export async function bootstrapAnonymous() {
  const existing = getSession()
  if (existing && existing.accessToken) return existing
  const device = installation()
  const result = await post('/api/v1/auth/anonymous', device, { auth: false })
  const session = { ...device, ...(result || {}) }
  if (!session.accessToken) throw new Error('匿名会话创建失败，请稍后重试')
  saveSession(session)
  return session
}

/**
 * 调用 `GET /api/v1/users/me` 获取当前匿名账号、家庭成员和宝宝资料。
 *
 * @returns {Promise<Object>} 当前用户公开资料；完成引导后包含 role 和 family 聚合数据。
 */
export async function getCurrentUser() {
  return get('/api/v1/users/me')
}

/**
 * 建立匿名会话并读取当前用户、家庭和宝宝资料；遇到 401 时自动重建一次会话。
 *
 * 401 重试只执行一次，避免凭证异常时形成无限请求循环。
 *
 * @returns {Promise<Object>} 当前用户及其家庭空间公开资料。
 */
export async function ensureSessionAndUser() {
  await bootstrapAnonymous()
  try {
    return await getCurrentUser()
  } catch (error) {
    if (error.statusCode === 401) {
      clearSession()
      await bootstrapAnonymous()
      return getCurrentUser()
    }
    throw error
  }
}

/**
 * 清除当前 accessToken，同时保留安装实例凭证供后续重新登录。
 * @returns {void}
 */
export function resetSession() { clearSession() }

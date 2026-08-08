// 中文编码标记：本项目源文件统一使用 UTF-8。
import { get, post } from './http'
import { getSession, saveSession, clearSession } from '../utils/session'

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

function installation() {
  const current = getSession() || {}
  return {
    installationId: current.installationId || makeId('install'),
    installationSecret: current.installationSecret || makeId('secret')
  }
}

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

export async function getCurrentUser() {
  return get('/api/v1/users/me')
}

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

export function resetSession() { clearSession() }

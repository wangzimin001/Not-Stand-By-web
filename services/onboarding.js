// 中文编码标记：本项目源文件统一使用 UTF-8。
import { get, post } from './http'

export function previewFamilyInvite(code) {
  return get(`/api/v1/family-invites/${encodeURIComponent(String(code || '').trim())}/preview`)
}

export function createFamily(payload) {
  return post('/api/v1/onboarding/create-family', payload)
}

export function joinFamily(payload) {
  return post('/api/v1/onboarding/join-family', payload)
}

export function completeOnboarding(payload) {
  return post('/api/v1/onboarding/complete', payload)
}

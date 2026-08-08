// 中文编码标记：本项目源文件统一使用 UTF-8。
import { getSession, clearSession } from '../utils/session'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8080'

function getApiBaseUrl() {
  let configured = ''
  try { configured = uni.getStorageSync('nsb_api_base_url') || '' } catch (error) {}
  if (!configured && typeof process !== 'undefined' && process.env) {
    configured = process.env.VUE_APP_API_BASE_URL || process.env.UNI_API_BASE_URL || ''
  }
  return String(configured || DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

function unwrap(payload) {
  if (!payload || typeof payload !== 'object') return payload
  if (Object.prototype.hasOwnProperty.call(payload, 'data') && (
    Object.prototype.hasOwnProperty.call(payload, 'code') ||
    Object.prototype.hasOwnProperty.call(payload, 'success') ||
    Object.prototype.hasOwnProperty.call(payload, 'message')
  )) return payload.data
  return payload
}

export function request(path, options = {}) {
  const method = options.method || 'GET'
  const session = getSession()
  const headers = { 'Content-Type': 'application/json', ...(options.header || {}) }
  if (options.auth !== false && session && session.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${getApiBaseUrl()}${path}`,
      method,
      data: options.data,
      timeout: options.timeout || 12000,
      header: headers,
      success: response => {
        const status = Number(response.statusCode || 0)
        const body = response.data
        if (status >= 200 && status < 300) {
          resolve(unwrap(body))
          return
        }
        if (status === 401) clearSession()
        const message = (body && (body.message || body.error)) || `请求失败（${status || '网络'}）`
        const error = new Error(message)
        error.statusCode = status
        error.body = body
        reject(error)
      },
      fail: error => reject(new Error(error.errMsg || '网络暂时不可用'))
    })
  })
}

export function get(path, options = {}) { return request(path, { ...options, method: 'GET' }) }
export function post(path, data, options = {}) { return request(path, { ...options, method: 'POST', data }) }
export function put(path, data, options = {}) { return request(path, { ...options, method: 'PUT', data }) }
export function setApiBaseUrl(url) {
  try { uni.setStorageSync('nsb_api_base_url', String(url || '').replace(/\/$/, '')) } catch (error) {}
}
export { getApiBaseUrl }

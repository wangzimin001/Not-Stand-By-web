// 中文编码标记：本项目源文件统一使用 UTF-8。
import { getSession, clearSession } from '../utils/session'

// 未进行任何运行时配置时使用的本地后端地址；真机调试时需要覆盖为电脑的局域网地址。
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8080'

/**
 * 获取当前请求应使用的后端根地址。
 *
 * 优先级依次为：App 本地存储、构建环境变量、默认本机地址。末尾斜杠会被移除，
 * 这样调用方传入以 `/` 开头的接口路径时不会产生双斜杠。
 *
 * @returns {string} 不带末尾斜杠的 API 根地址。
 */
function getApiBaseUrl() {
  let configured = ''
  // 本地存储允许真机调试时动态切换电脑 IP，无需重新构建安装包。
  try { configured = uni.getStorageSync('nsb_api_base_url') || '' } catch (error) {}
  // 构建变量适合测试、预发布和生产环境在打包时注入固定地址。
  if (!configured && typeof process !== 'undefined' && process.env) {
    configured = process.env.VUE_APP_API_BASE_URL || process.env.UNI_API_BASE_URL || ''
  }
  return String(configured || DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

/**
 * 兼容带统一响应外壳和直接返回业务对象的两种后端响应格式。
 *
 * 当响应同时包含 `data` 与 `code`、`success` 或 `message` 之一时，认为它是统一外壳，
 * 只把 `data` 交给页面；其他对象保持原样。
 *
 * @param {*} payload 后端返回的原始响应体。
 * @returns {*} 页面真正需要消费的业务数据。
 */
function unwrap(payload) {
  if (!payload || typeof payload !== 'object') return payload
  if (Object.prototype.hasOwnProperty.call(payload, 'data') && (
    Object.prototype.hasOwnProperty.call(payload, 'code') ||
    Object.prototype.hasOwnProperty.call(payload, 'success') ||
    Object.prototype.hasOwnProperty.call(payload, 'message')
  )) return payload.data
  return payload
}

/**
 * 发起统一的后端请求，并集中处理鉴权、超时与错误格式。
 *
 * @param {string} path 以 `/` 开头的后端接口路径。
 * @param {Object} [options] 请求选项。
 * @param {string} [options.method='GET'] HTTP 方法。
 * @param {*} [options.data] 需要发送的请求体或查询数据。
 * @param {Object} [options.header] 追加或覆盖的请求头。
 * @param {number} [options.timeout=12000] 请求超时时间，单位为毫秒。
 * @param {boolean} [options.auth=true] 是否自动携带匿名会话令牌。
 * @returns {Promise<*>} 解析后的业务响应。
 */
export function request(path, options = {}) {
  const method = options.method || 'GET'
  const session = getSession()
  const headers = { 'Content-Type': 'application/json', ...(options.header || {}) }
  // 除匿名登录等显式公开接口外，统一附加 Bearer 会话令牌。
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
        // 令牌失效后仅清理 accessToken，保留设备凭证以便重新建立同一匿名账号的会话。
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

/**
 * 发起 GET 请求。
 * @param {string} path 接口路径。
 * @param {Object} [options] 通用请求选项。
 * @returns {Promise<*>} 接口业务数据。
 */
export function get(path, options = {}) { return request(path, { ...options, method: 'GET' }) }

/**
 * 发起 POST 请求。
 * @param {string} path 接口路径。
 * @param {*} data 请求体。
 * @param {Object} [options] 通用请求选项。
 * @returns {Promise<*>} 接口业务数据。
 */
export function post(path, data, options = {}) { return request(path, { ...options, method: 'POST', data }) }

/**
 * 发起 PUT 请求。
 * @param {string} path 接口路径。
 * @param {*} data 请求体。
 * @param {Object} [options] 通用请求选项。
 * @returns {Promise<*>} 接口业务数据。
 */
export function put(path, data, options = {}) { return request(path, { ...options, method: 'PUT', data }) }

/**
 * 保存运行时 API 根地址，主要用于把真机请求指向当前电脑的局域网地址。
 *
 * @param {string} url 新的后端根地址；传入空值可恢复为构建变量或默认地址。
 * @returns {void}
 */
export function setApiBaseUrl(url) {
  try { uni.setStorageSync('nsb_api_base_url', String(url || '').replace(/\/$/, '')) } catch (error) {}
}
export { getApiBaseUrl }

export function promisify(fn) {
  return (...args) => new Promise((resolve, reject) => fn({ ...args[0], success: resolve, fail: reject }))
}

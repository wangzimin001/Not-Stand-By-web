// 将部分 uni-app API 的 `[error, data]` Promise 返回值转换为标准的 resolve/reject 形式。
uni.addInterceptor({
  /**
   * 只适配 Promise 返回值；同步值保持原样，避免改变普通 uni API 的行为。
   * @param {*} res 被拦截 API 的原始返回值。
   * @returns {*} 原值或符合标准语义的新 Promise。
   */
  returnValue (res) {
    if (!(!!res && (typeof res === "object" || typeof res === "function") && typeof res.then === "function")) {
      return res
    }
    return new Promise((resolve, reject) => {
      res.then((res) => {
        if (!res) return resolve(res)
        // uni-app 旧式 Promise 的第 0 项是错误，第 1 项是成功数据。
        return res[0] ? reject(res[0]) : resolve(res[1])
      })
    })
  }
})

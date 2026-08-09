<script>
export default {
  /** App 进程首次创建时触发，用于后续放置全局初始化逻辑。 */
  onLaunch: function() { console.log('App Launch') },
  /** App 从后台进入前台时触发，用于后续刷新用户态或未读数据。 */
  onShow: function() { console.log('App Show') },
  /** App 进入后台时触发，用于后续保存临时状态或暂停任务。 */
  onHide: function() { console.log('App Hide') }
}
</script>

<style>
/* 所有页面共享的基础背景、文字颜色、盒模型和中文字体回退。 */
page { width: 100%; min-height: 100%; overflow-x: hidden; background: #f5f3ee; color: #18241f; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
view, scroll-view, button, input { box-sizing: border-box; }
</style>

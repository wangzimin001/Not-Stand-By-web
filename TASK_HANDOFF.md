# 不叉手（Not Stand By）前端任务交接

## 项目配对

- 前端本地目录：`C:\编程\Not-Stand-By-web`
- 前端仓库：<https://github.com/wangzimin001/Not-Stand-By-web>
- 后端本地目录：`C:\编程\Not-Stand-By-server`
- 后端仓库：<https://github.com/wangzimin001/Not-Stand-By-server>
- 前端默认分支：`master`

切换电脑时必须同时检查前端和后端两个仓库。后端自己的状态、数据库表和启动方式记录在 `Not-Stand-By-server/TASK_HANDOFF.md` 与 `README.md`。

## 当前状态

前端是 uni-app Vue 3 项目，已经完成第一版孕期协作首页和首次资料补充流程。`pages/onboarding/index.vue` 是当前首屏；完成资料的用户会进入 `pages/index/index.vue`。

首页已按参考的轻量看板风格完成一版视觉重构：浅米白背景、黑色粗体标题、荧光黄孕期/任务指标卡、胶囊筛选、白色安排卡、黑色悬浮新增按钮和黑色胶囊底部导航。原有日历、任务、清单、我的四个入口，以及任务勾选、任务指派和物品分类交互均保留。

首次引导按单个问题渐隐、渐显：

1. 选择宝爸或宝妈；
2. 填写昵称；
3. 新建家庭或加入家庭；
4. 新建家庭填写预产期，加入家庭扫码或输入家庭码；
5. 新建家庭可填写“宝宝小名”，也可选择“稍后再说”。

首次引导已改为与主看板一致的暖米白背景、黑色正文、白色选项卡和荧光黄主操作色。页面已按产品确认移除左上角品牌中英文、问题上方英文引导语和底部隐私说明，仅保留右上角步骤进度。操作按钮已关闭 uni-app App 端默认的 `button::after` 描边，并由按钮自身统一绘制边框和圆角，避免默认半像素描边与自定义圆角叠加后出现拐角错位。换题时旧问题用约 `420ms` 向上渐隐，新问题再用约 `480ms` 从下方渐显。uni-app 的 Vue 页面在 App 端不支持内置 `<transition>`，因此 `QuestionStage.swapQuestion` 使用明确的 `leaving → enter-pending → entering` CSS 阶段，并在旧内容完全隐藏后才更新父页面步骤；后续不要替换回 App 端不兼容的 Vue Transition。

新增请求与会话层：`services/http.js`、`services/auth.js`、`services/onboarding.js`、`utils/session.js`。未提交草稿保存在本地，完成状态以后端 `GET /api/v1/users/me` 为准。

前端自有 Vue/JavaScript 已补齐说明性注释：数据字段和模型使用行内说明或 JSDoc，方法写明参数、返回值和职责，所有后端接口调用都标注了 HTTP 路径，模板中的关键页面分支和数据流也有说明。以后新增字段、方法、接口封装或关键业务分支时应同步补充同等粒度的注释；JSON 配置文件不支持注释，其用途记录在本交接文档。

默认接口地址是 `http://127.0.0.1:8080`。真机不能用电脑的 `127.0.0.1`，应将存储项 `nsb_api_base_url` 或构建变量 `VUE_APP_API_BASE_URL` 设置为电脑局域网地址，例如 `http://192.168.1.10:8080`，并保证手机和电脑在同一网络。

MuMu 本地调试继续使用默认地址，但模拟器连接后必须通过 HBuilderX 自带的 ADB 执行 `adb reverse tcp:8080 tcp:8080`，把模拟器的 `127.0.0.1:8080` 转发到电脑后端。该映射只在当前 ADB 连接期间有效，重启模拟器或重连 ADB 后需要重新执行；以后执行“启动项目”时应把连接模拟器、锁定竖屏、建立 `8080` 反向映射和启动前端视为同一套步骤。后端仍由开发者在 IDEA 内以 Run/Debug 方式启动。

后端数据库明确采用无外键策略，跨表 ID 只作逻辑关联；当前只保留最终 `V1__init.sql`，不再保留过渡迁移。宝宝资料位于 `baby_info`，宝宝与家庭的多对一关系位于 `baby_family_relation`；新接口应优先读取响应中的 `babies` 列表。完整结构和本地数据库重建说明见后端 `TASK_HANDOFF.md` 与 `README.md`。

HBuilderX 曾把 `pages/index/index.vue` 误判为 GBK。根目录 `.editorconfig` 固定 `utf-8-bom`，中文源码保留首行编码标记；不要删除这些标记。产品正式名称只能使用“不叉手”。

App 端按手机竖屏设计：`manifest.json` 的 `app-plus.screenOrientation` 只允许 `portrait-primary`，`pages.json` 的全局 `pageOrientation` 也固定为 `portrait`。当前 MuMu 使用 `900×1600`、`400 DPI`，对应约 `360dp` 的常见手机视口；若恢复成原来的 `240 DPI`，系统会把屏幕识别成 `600dp` 宽的平板视口，字体和控件会明显偏小。首次引导和主看板均已覆盖约 `320dp` 窄屏、常见 `360～430dp` 手机、矮屏安全滚动以及 `600dp` 以上宽屏居中；页面必须占满可用宽度，Flex 文本项必须允许收缩，固定底栏必须叠加安全区。以后新增页面或组件也应遵守这套断点与安全区规则。

## 交接规则

每次提交前端代码时，必须在同一次提交中同步更新本文件，记录当前状态、已完成内容、未完成事项和下一步。

## 恢复工作

```powershell
git clone https://github.com/wangzimin001/Not-Stand-By-web.git
cd Not-Stand-By-web
git status --short --branch
```

随后在 HBuilderX 中打开该目录。后端需要单独克隆和启动。

## 下一步

1. 在 HBuilderX 真机预览这版看板布局，重点检查底部安全区、刘海屏和小屏文字换行。
2. 启动 MySQL 与 `Not-Stand-By-server`，在真机验证完整新建/加入家庭流程。
3. 在“我的”页面显示当前昵称、角色、家庭码和伴侣绑定状态。
4. 开始实现任务模块，并以家庭成员身份作为任务指派依据。

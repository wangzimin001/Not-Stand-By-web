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

新增请求与会话层：`services/http.js`、`services/auth.js`、`services/onboarding.js`、`utils/session.js`。未提交草稿保存在本地，完成状态以后端 `GET /api/v1/users/me` 为准。

前端自有 Vue/JavaScript 已补齐说明性注释：数据字段和模型使用行内说明或 JSDoc，方法写明参数、返回值和职责，所有后端接口调用都标注了 HTTP 路径，模板中的关键页面分支和数据流也有说明。以后新增字段、方法、接口封装或关键业务分支时应同步补充同等粒度的注释；JSON 配置文件不支持注释，其用途记录在本交接文档。

默认接口地址是 `http://127.0.0.1:8080`。真机不能用电脑的 `127.0.0.1`，应将存储项 `nsb_api_base_url` 或构建变量 `VUE_APP_API_BASE_URL` 设置为电脑局域网地址，例如 `http://192.168.1.10:8080`，并保证手机和电脑在同一网络。

后端数据库明确采用无外键策略，跨表 ID 只作逻辑关联；当前只保留最终 `V1__init.sql`，不再保留过渡迁移。宝宝资料位于 `baby_info`，宝宝与家庭的多对一关系位于 `baby_family_relation`；新接口应优先读取响应中的 `babies` 列表。完整结构和本地数据库重建说明见后端 `TASK_HANDOFF.md` 与 `README.md`。

HBuilderX 曾把 `pages/index/index.vue` 误判为 GBK。根目录 `.editorconfig` 固定 `utf-8-bom`，中文源码保留首行编码标记；不要删除这些标记。产品正式名称只能使用“不叉手”。

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

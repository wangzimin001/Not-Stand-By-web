# 不叉手（Not Stand By）任务交接

## 当前状态

本目录已初始化为 Git 仓库和 uni-app（Vue 3）项目。当前已完成第一版孕期协作 APP 交互原型，入口为 `pages/index/index.vue`。

当前原型包含日历孕周看板、宝宝变化与注意事项、系统/夫妻任务、物品分类清单、夫妻绑定和个人设置四个主模块，底部导航可切换页面。任务勾选、任务筛选和夫妻任务指派已有本地交互；数据尚未持久化。

HBuilderX 曾把 UTF-8 的 `pages/index/index.vue` 误判为 GBK。项目根目录已加入 `.editorconfig` 固定 `utf-8-bom`，首页源码带 UTF-8 BOM 并保留中文编码注释，帮助 HBuilderX 正确识别；不要删除该标记。`manifest.json` 已明确配置 Vue 3，并保留 HBuilderX 标准模板文件。

远程仓库：`https://github.com/wangzimin001/Not-Stand-By.git`

## 交接规则

每次提交代码时，必须在同一次提交中同步更新本文件，记录当前状态、已完成内容、未完成事项和明确的下一步，确保切换电脑后可以直接继续工作。

## 在另一台电脑继续工作

```bash
git clone https://github.com/wangzimin001/Not-Stand-By.git
cd Not-Stand-By
```

后续开发完成后：

```bash
git add .
git commit -m "描述本次改动"
git push origin master
```

## 下一步

1. 在真机上确认第一版黑板涂鸦风格、信息密度和导航结构。
2. 根据反馈确定产品名称统一使用“不叉手”还是“不插手”。
3. 把单页原型拆分为独立页面和可复用组件。
4. 设计用户、夫妻绑定、孕期日历、任务和物品清单的数据模型。
5. 接入本地持久化，再规划账号与后端同步。

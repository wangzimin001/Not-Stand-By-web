# 不叉手（Not Stand By）任务交接

## 当前状态

本目录已初始化为 Git 仓库和 uni-app（Vue 3）项目。使用 HBuilderX 运行后，启动页 `pages/index/index.vue` 展示“不插手”。尚未加入其他 APP 业务功能。

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

从产品需求和页面结构继续设计“不叉手”APP；当前仅有最小 uni-app 首页，避免过早预设后续业务实现。

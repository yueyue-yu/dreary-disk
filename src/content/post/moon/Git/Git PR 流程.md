---
title: Git PR 流程
description: ""
publishDate:  2025-09-15
tags:
  - Git
draft: false
---



## 一、 初始设置 (每个项目只需一次)

1.  **Fork 仓库**
    * 在 GitHub/GitLab 上，打开原始项目页面，点击右上角的 **Fork** 按钮。

2.  **Clone 你的 Fork**
    * 将你**自己账户下**的仓库克隆到本地。

    ```bash
    git clone https://github.com/Your-Account/project.git
    cd project
    ```

3.  **添加上游 (Upstream)**
    * 将原始项目仓库添加为一个名为 `upstream` 的远程源。

    ```bash
    git remote add upstream https://github.com/Original-Owner/project.git
    ```

4.  **验证远程源**
    * 确认 `origin` 指向你的 Fork，`upstream` 指向原始仓库。

    ```bash
    git remote -v
    # origin    https://github.com/Your-Account/project.git (fetch)
    # origin    https://github.com/Your-Account/project.git (push)
    # upstream  https://github.com/Original-Owner/project.git (fetch)
    # upstream  https://github.com/Original-Owner/project.git (push)
    ```

---

## 二、 开发流程 (每次开发新功能或修复 Bug)

### **第 1 步：同步上游**

在开始任何新工作前，确保你的 `main` 分支与官方 `upstream` 保持同步。

```bash
# 1. 切换到本地 main 分支
git checkout main

# 2. 从 upstream 拉取最新变更
git fetch upstream

# 3. 将本地 main 分支变基到 upstream/main 的最新版本
git rebase upstream/main

# 4. (可选但推荐) 将同步好的 main 分支推送到你自己的 Fork (origin)
git push origin main --force-with-lease 
```

> **注意**: 仅在同步 `main` 分支时可安全使用 `--force-with-lease`，因为它只是在追赶 `upstream`。

### **第 2 步：创建特性分支**

从最新的 `main` 分支创建你的工作分支。

```bash
git checkout -b new-feature-name
```

### **第 3 步：开发与提交**

进行代码修改，并分阶段提交。

```bash
# ... 编写代码 ...

# 添加变更到暂存区
git add .

# 提交变更
git commit -m "feat: Add a new feature"
```

### **第 4 步：推送至你的 Fork**

将你的新分支推送到你自己的远程仓库 (`origin`)。

```bash
git push -u origin new-feature-name
```

> `-u` 会将本地分支与远程分支关联，之后可以直接使用 `git push`。

### **第 5 步：创建 Pull Request (PR)**

1.  打开你在 GitHub/GitLab 上的 Fork 仓库页面。
2.  页面上会自动出现一个 "Compare & pull request" 的提示，点击它。
3.  确认基准分支是原始仓库的 `main`，对比分支是你刚刚推送的 `new-feature-name`。
4.  填写清晰的标题和描述。
5.  点击 "Create pull request"。

---

## 三、 后续与清理 (PR 合并后)

1.  **同步 `main` 分支**
    *   PR 被合并后，你的 `main` 分支又落后了。重复**开发流程的第 1 步**来同步。

2.  **清理已合并的分支**
    * 同步完 `main` 分支后，可以安全地删除已完成任务的分支。

    ```bash
    # 删除本地分支
    git branch -d new-feature-name

    # 删除远程 origin 上的分支
    git push origin --delete new-feature-name
    ```

---
title: Git Worktree
description: ""
publishDate: 2026-01-02
tags:
  - Git
draft: false
---

## **Git Worktree 的本质**

- **Worktree**：允许你在同一个仓库下，同时 checkout 多个分支到**不同的目录**
- **核心价值**：无需 `stash` 或 `commit` 当前工作，就能切换到另一个分支进行开发

---

## **为什么需要 Worktree？**

| 传统方式 | 问题 | Worktree 解决方案 |
| :--- | :--- | :--- |
| `git stash` 后切换分支 | 容易忘记 `stash pop`，stash 列表混乱 | 每个分支独立目录，互不干扰 |
| `git clone` 多个副本 | 占用磁盘空间，`.git` 重复存储 | 共享同一个 `.git`，节省空间 |
| 频繁 `checkout` 切换 | 需要重新安装依赖、重新构建 | 各目录保持独立的 `node_modules` 和构建产物 |

---

## **Worktree 常用命令**

### **查看所有 Worktree**

```bash
git worktree list
```

输出示例：
```
/Users/z/project           abc1234 [main]
/Users/z/project-feature   def5678 [feature/login]
/Users/z/project-hotfix    789abcd [hotfix/bug-123]
```

---

### **添加 Worktree**

- git worktree add \<path\> \<branch\>

    在指定路径创建一个新的工作目录，checkout 指定分支

```bash
# 为已存在的分支创建 worktree
git worktree add ../project-feature feature/login

# 创建新分支并创建 worktree（-b 参数）
git worktree add -b hotfix/bug-123 ../project-hotfix main
```

**目录结构变化**：
```
~/
├── project/                # 主工作目录 (main 分支)
│   ├── .git/               # 完整的 Git 仓库
│   └── src/
├── project-feature/        # worktree (feature/login 分支)
│   ├── .git                # 只是一个文件，指向主仓库
│   └── src/
└── project-hotfix/         # worktree (hotfix/bug-123 分支)
    ├── .git
    └── src/
```

---

### **删除 Worktree**

```bash
# 方式一：先删除目录，再清理记录
rm -rf ../project-feature
git worktree prune

# 方式二：直接移除（推荐）
git worktree remove ../project-feature

# 强制删除（有未提交的更改时）
git worktree remove --force ../project-feature
```

---

### **移动 Worktree**

```bash
git worktree move ../project-feature ../new-location
```

---

## **使用场景**

### **场景一：紧急修复 Bug**

你正在 `feature` 分支开发新功能，突然需要修复线上 Bug。

**传统方式**：
```bash
git stash                    # 保存当前工作
git checkout main
git checkout -b hotfix/xxx
# ... 修复 Bug ...
git checkout feature
git stash pop                # 恢复工作
```

**使用 Worktree**：
```bash
# 创建一个新目录处理 hotfix
git worktree add -b hotfix/xxx ../project-hotfix main

# 在新目录修复 Bug
cd ../project-hotfix
# ... 修复、提交、推送 ...

# 回到原目录继续开发，无需任何额外操作
cd ../project
```

---

### **场景二：同时对比多个分支**

需要同时查看 `main` 和 `develop` 分支的代码差异。

```bash
git worktree add ../project-main main
git worktree add ../project-develop develop

# 用 IDE 同时打开两个目录，方便对比
```

---

### **场景三：运行长时间任务**

在一个分支运行测试或构建，同时在另一个分支继续开发。

```bash
# 在 worktree 中运行测试
cd ../project-test
npm test  # 长时间运行

# 同时在主目录继续开发
cd ../project
# 继续写代码...
```

---

## **注意事项**

1. **同一分支不能被多个 worktree checkout**
   ```bash
   git worktree add ../another main
   # fatal: 'main' is already checked out at '/Users/z/project'
   ```

2. **worktree 目录中的 `.git` 是文件不是目录**
   - 内容类似：`gitdir: /Users/z/project/.git/worktrees/project-feature`
   - 所有 worktree 共享同一个 `.git` 仓库

3. **删除 worktree 后记得清理**
   - 如果手动删除目录，需要运行 `git worktree prune` 清理残留记录

4. **worktree 中的分支删除**
   - 删除一个正在被 worktree 使用的分支会失败
   - 需要先 `git worktree remove` 再删除分支

5. **Node.js 项目建议**
   - 每个 worktree 需要独立运行 `npm install`
   - 好处：依赖版本可以不同，互不影响

---

## **Worktree vs 其他方案对比**

| 方案 | 优点 | 缺点 |
| :--- | :--- | :--- |
| **git stash** | 简单快速 | 容易遗忘，stash 堆积 |
| **git clone 多份** | 完全隔离 | 占用双倍空间，`.git` 重复 |
| **git worktree** | 共享仓库，节省空间，分支独立 | 需要管理多个目录 |

---

## **常用工作流总结**

```bash
# 1. 查看当前所有 worktree
git worktree list

# 2. 快速创建 hotfix 分支并开始工作
git worktree add -b hotfix/issue-123 ../hotfix main
cd ../hotfix

# 3. 完成后清理
cd ../project
git worktree remove ../hotfix
git branch -d hotfix/issue-123
```


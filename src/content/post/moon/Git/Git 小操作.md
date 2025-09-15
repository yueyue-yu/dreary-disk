---
title: Git 小操作
description: ""
publishDate: 2025-09-15
tags:
  - Git
draft: false
---

---

## **Git Stash **

|**场景**|**命令**|**说明**|
|---|---|---|
|保存当前修改|git stash|保存已跟踪文件的修改|
|保存修改 + 未跟踪文件|git stash -u|包含新建但未跟踪的文件|
|查看保存记录|git stash list|列出所有 stash|
|恢复并删除最近一次|git stash pop|应用 stash 并移除|
|恢复但保留记录|git stash apply|应用 stash，但 stash 仍保留|
|删除指定记录|git stash drop stash@{0}|删除编号 0 的 stash|
|清空所有记录|git stash clear|删除所有 stash|

---

⚡ 最常用组合：

- 切分支前：git stash
    
- 回来后：git stash pop
    

  

## Git Cherry-pick



### **1. 基本作用**



git cherry-pick 用于 **把某些提交（commit）从一个分支复制到另一个分支**。

⚡ 不会合并整个分支，只挑选指定的提交。

---

### **2. 常用命令**

|**场景**|**命令**|**说明**|
|---|---|---|
|挑选单个提交|git cherry-pick <commit>|把 <commit> 应用到当前分支|
|挑选多个提交|git cherry-pick <c1> <c2>|一次性挑选多个提交|
|挑选一段提交|git cherry-pick <c1>^..<c2>|应用 <c1> 到 <c2> 的所有提交|
|遇到冲突后继续|git cherry-pick --continue|解决冲突后继续操作|
|放弃操作|git cherry-pick --abort|回到 cherry-pick 前的状态|
|跳过当前提交|git cherry-pick --skip|遇到问题跳过此提交|

---

### **3. 使用场景**

1. **修复 bug**
    
    - 在 main 修了一个 bug
        
    - 想把这个修复同步到 release 分支
        
    - 用：git cherry-pick <bugfix-commit>
        
    
2. **补充遗漏的功能**
    
    - 在功能分支写了一个好用的工具函数
        
    - 想把它带到另一个分支里用
        
    - 用：git cherry-pick <commit>
        
    
3. **挑选热修复**
    
    - 上线后在 hotfix 分支修了问题
        
    - 需要把修复同步回 main
        
    - 用：git cherry-pick <hotfix-commit>
        
    
4. **只要部分提交，不要整个分支**
    
    - 某分支有很多提交，但只想拿其中的 1~2 个
        
    - 用：git cherry-pick <commit1> <commit2>

---

### **4. 注意事项**

- **容易引发冲突**：如果两个分支改动了相同的代码，需要手动解决。
    
- **不要滥用**：如果需要整个分支的历史，应该用 git merge 或 git rebase，不要用 cherry-pick。
    
- **会复制提交**：被挑选的提交在目标分支会生成新的 commit（不同的哈希）。

---

## ** Git Tag 使用指南**



### **1. 基本概念**

- **Tag（标签）** 就是给某个提交（commit）贴一个名字。
    
- 常用于 **版本管理**（例如 v1.0.0、release-2025-09）。
    
- 有两类标签：
    
    1. **轻量标签（lightweight tag）** → 只是一个指向 commit 的别名。
        
    2. **附注标签（annotated tag）** → 包含作者、日期、说明信息，更适合发布版本。

---

### **2. 常用命令**

|**操作**|**命令**|**说明**|
|---|---|---|
|创建轻量标签|git tag v1.0.0|给当前 commit 打标签|
|创建附注标签|git tag -a v1.0.0 -m " 版本说明 "|推荐，带说明信息|
|查看标签|git tag|列出所有标签|
|查看详细信息|git show v1.0.0|显示标签对应 commit 信息|
|给指定 commit 打标签|git tag v1.0.0 <commit>|不一定要给最新提交打|
|删除本地标签|git tag -d v1.0.0|删除本地标签|
|推送单个标签|git push origin v1.0.0|把标签推送到远程|
|推送所有标签|git push origin --tags|一次性推送所有标签|
|删除远程标签|git push origin :refs/tags/v1.0.0|删除远程上的标签|

---

### **3. 使用场景**

1. **版本发布**
    
    - 开发完成后，在发布 commit 上打 v1.0.0 标签。
        
    - 推送到远程，CI/CD 或部署脚本就能根据标签构建。
        
    
2. **回溯历史版本**
    
    - 想回到 v1.0.0：

```
git checkout v1.0.0
```

2. - 
        
    - 如果想继续开发，可以基于它新建分支：

```
git checkout -b hotfix-1.0.0 v1.0.0
```

2. 
    
3. **标记里程碑**
    
    - 在项目重要节点（第一次上线、完成大功能）打 tag，方便以后查找。

---

### **4. 小提示**

- 轻量标签适合 **临时标记**，附注标签适合 **正式版本发布**。
    
- 标签本身不会变动，适合用来记录 **稳定节点**。
    
- 和分支的区别：
    
    - **分支** 会随开发推进而移动
        
    - **标签** 永远固定指向某个提交

---

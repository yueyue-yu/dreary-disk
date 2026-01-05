---
title: Git 分支
description: ""
publishDate:  2025-09-14
tags:
  - Git
draft: false
---

## **Git 分支的本质**

- **分支**：本质是指向某个 **Commit 对象** 的**可变指针**
    
- **HEAD 指针**：指向当前分支的引用
    

  

### **分支操作的机制**

- **切换分支**：HEAD 指针指向新的分支
    
- **提交代码**：分支指针向前移动，指向最新的 commit
    
- **新的 commit**：会记录对上一次 commit 的引用（链式结构）

---

## **Git 分支操作常用命令**



### **查看分支**

- git branch

    列出所有 **本地** 分支
    
- git branch -a

    列出所有 **本地** + **远程** 分支

---

### **切换 / 创建分支**

- git switch <branch-name>

    切换到已存在的分支
    
- git switch -c <branch-name>

    创建并切换到新分支
    
- git checkout -b <branch-name>

    创建并切换到新分支（旧写法）

---

### **合并 / 变基**

- git merge <branch-name>

    将 <branch-name> 合并到**当前分支**
    
- git rebase <base-branch>

    将**当前分支**的提交“嫁接”到 <base-branch>

---

### **推送分支**

- git push -u origin <branch-name>

    推送新分支到远程并建立跟踪

---

### **删除分支**

- git branch -d <branch-name>

    删除一个**已合并**的本地分支
    
- git branch -D <branch-name>

    强制删除一个本地分支
    
- git push origin --delete <branch-name>

    删除一个远程分支

---

## Git Merge 和 Git rebase


### Merge 的流程
git 的提交记录如下

```
A---B---C   <-- main
	 \
	  D---E   <-- dev

```

在 main 分支下 merge dev 分支

1. Git 找到 main 和 dev 的共同祖先：B。
    
2. 计算 **B→C 的修改** 和 **B→E 的修改**。
    
3. 在 C 的内容基础上，应用 **B→E 的修改**（整合两个分支的差异）。
    
4. 生成一个新的合并提交 M1，父节点是 C 和 E。
    
5. main 移动到 M1。

```
A---B---C---------M1   <-- main
     \           /
      D---E -----    <-- dev


```


---

### **Rebase 的流程**

```
A---B---C   <-- main
     \
      D---E   <-- dev
```

现在我们在 **dev 分支**上执行：

```
git checkout dev
git rebase main
```

1. **找到 dev 分支和 main 分支的共同祖先**
    
    - 共同祖先是 B。
        
    - 这一步和 merge 一样。
        
    
2. **计算 B→D, B→E 的修改集**
    
    - Git 会把 dev 分支上 **相对 B 的提交（D, E）** 提取出来，形成补丁。
        
    
3. **切换到 main 分支最新提交 C**
    
    - rebase 的目标是让 dev “接到” main 上，所以新的基础是 C。
        
    
4. **依次把 D, E 的修改补丁应用到 C 上**
    
    - 先在 C 上应用 D → 得到一个新的提交 D'。
        
    - 再在 D' 上应用 E → 得到一个新的提交 E'。
        
    
5. **dev 指针移动到新的 E’**
    
    - 原来的 D, E 会被“丢弃”（实际上还在 reflog 里）。
        
    - 结果是 dev 变成了 C---D'---E'，看起来像是一直在 main 后面开发。

---

**Rebase 之后的提交图**

```
A---B---C   <-- main
         \
          D'---E'   <-- dev
```
以另一条分支最新提交为基础，逐步应用这条分支上的提交记录
原来的 D 和 E 变成了悬空提交 
---

### **总结对比**

- **merge**：保留分支历史，产生一个合并提交 M1。
    
- **rebase**：重写 dev 的历史（不改变 main 分支的历史），把 dev 的提交挪到 main 后面，形成一条直线历史。
    

- **不要对已经 push 到远程、别人可能基于它开发的分支 rebase！**

    因为 rebase 会改写历史，别人那边会出现冲突、混乱。
    
- **merge** 永远是安全的（不会改写历史），**rebase** 适合在自己本地分支上使用。

---


## **Cherry-pick 的流程**

`git cherry-pick <commit-hash>` 是一种选择性合并命令，允许将**特定提交**应用到当前分支，而不是合并整个分支。

### **Cherry-pick 的工作流程**

假设有以下提交图：
```
A---B---C---D   <-- main
         \
          E---F---G   <-- feature
```

**场景**：只想将 `feature` 分支的提交 `F` 应用到 `main` 分支。

**操作**：
```bash
# 1. 切换到 main 分支
git checkout main

# 2. 将 feature 分支的提交 F 应用到当前分支
git cherry-pick <F的哈希值>
```

**结果**：
```
A---B---C---D---F'   <-- main
         \
          E---F---G   <-- feature
```

### **Cherry-pick 的特点**

1. **选择性应用**：只应用指定的提交，而不是整个分支。
2. **创建新提交**：`F'` 是 `F` 的一个**新副本**（哈希值不同，但内容相同）。
3. **不改变原分支**：`feature` 分支保持不变。
4. **可能产生冲突**：如果当前分支与要应用的提交有冲突，需要手动解决。

### **常用选项**
```bash
# 应用提交但不自动提交（允许修改后手动提交）
git cherry-pick -n <commit-hash>

# 编辑提交信息
git cherry-pick -e <commit-hash>

# 应用多个连续提交
git cherry-pick <start-commit>..<end-commit>

# 应用多个不连续提交
git cherry-pick <commit1> <commit2> <commit3>
```

### **适用场景**
- **选择性引入修复**：只合并某个 bug 修复提交，而不是整个特性分支。
- **代码复用**：将其他分支的某个有用功能应用到当前分支。
- **跨分支同步**：在不同分支间同步特定的更改。

### **注意事项**
- **依赖关系**：如果提交依赖于之前的提交，单独 `cherry-pick` 可能导致代码不完整。
- **历史混乱**：过度使用会使提交历史变得混乱，难以追踪完整的变更脉络。
- **谨慎使用**：在大多数情况下，完整的 `merge` 或 `rebase` 更能保持历史的清晰。

---

## **Squash Merge 的流程**

`git merge --squash dev` 是一种特殊的合并方式，行为与普通 merge 不同：

1. **不创建合并提交**：Git 会将 dev 分支的所有更改应用到当前分支（main），但**不会**生成合并提交 M1。
2. **不保留分支历史**：dev 分支的提交记录（D, E）**不会**被保留在当前分支的历史中。
3. **需要手动提交**：所有更改会被**暂存**（staged），但不会自动提交。你需要执行 `git commit` 来创建一个新的提交 S。
4. **提交图变化**：结果是一个新的提交 S，它包含了 dev 分支的所有修改，但 dev 分支本身不会出现在 main 的历史中。

```
A---B---C---S   <-- main
     \
      D---E     <-- dev
```

**与普通 merge 的区别**：
- 普通 merge 会保留 dev 的历史并创建合并提交 M1（父节点包括 C 和 E）。
- squash merge 将 dev 的多个提交“压缩”成一个提交 S，使历史更简洁。

**与 rebase 的区别**：
- rebase 会重写 dev 分支的历史，将 D、E 变成 D'、E' 并接到 main 之后。
- squash merge 不改变 dev 分支，只在 main 上创建一个包含所有更改的新提交。

**适用场景**：
- 希望将特性分支的多个提交合并成一个整洁的提交到主分支。
- 不希望保留特性分支的详细历史（例如，修复多个 typo 的中间提交）。

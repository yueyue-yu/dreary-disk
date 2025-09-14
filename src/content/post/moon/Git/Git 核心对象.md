---
title: Git 对象
description: ""
publishDate: 2025-09-13
tags:
  - Git
draft: false
---


# Git 对象
![](./assets/Git%20核心对象/Git%20分支-1757773221373.webp)




| Attribute          | Commit Object                                                                         | Tree Object                                                                                               | Blob Object                  |
| :----------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- | :--------------------------- |
| **Stored Content** | Top-level tree hash<br>Parent commit hash(es)<br>Author & Committer<br>Commit message | A list of entries, each with:<br>• Mode (permissions)<br>• Type (blob/tree)<br>• SHA-1 Hash<br>• Filename | Raw file content             |
| **Points To**      | A Tree object<br>Parent Commit(s)                                                     | Blob(s)<br>Other Tree(s)                                                                                  | Nothing                      |
| **Key Purpose**    | Records a project snapshot and links it to version history                            | Represents a directory's content                                                                          | Stores the content of a file |

## Commit 对象
**每一次 commit 都创建一个 commit 对象**，存放
1.Author & Committer Commit message
2.指向上一次 commit 对象的指针
3.指向根目录的 tree 对象的指针



## Tree 对象

存放**指针**指向根目录下的**文件**以及**子目录**
每一个目录都有**Tree**对象
内容发生了变化的目录 创建新的 `tree` 对象。
目录及其所有子目录内容都没有任何改变，新提交会直接指向旧的 `tree` 对象

以根目录为例

```shell

$ git ls-tree -l HEAD
100644 blob 29a082782f3c4424359998270562e847761001a1    12   README.md
040000 tree 7c2a715a31f7957f8273f68481a7983ea4e514a6    -    src


```

| `模式 (mode)` | `类型 (type)` | `哈希值 (SHA-1 hash)` | `大小 (size)` | `路径 (path)` |
| :---------- | :---------- | :----------------- | :---------- | :---------- |
| `100644`    | `blob`      | `29a0827...`       | `12`        | `README.md` |
| `040000`    | `tree`      | `7c2a715...`       | `-`         | `src`       |



## Blob 对象

Binary Large Object 只存放**文件的原始数据**，即二进制文件

`blob` 对象的哈希值 (SHA-1) 是由其内容计算得到
只要两个文件的内容完全相同，无论它们在项目中的哪个位置，叫什么名字，它们都会指向**同一个 `blob` 对象**。





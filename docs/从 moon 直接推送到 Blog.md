# 从 moon 直接推送到 Blog（推荐方案）

目的：当你的 Obsidian 笔记库 `yueyue-yu/moon` 里新增/更新文章时，自动把指定目录的内容推送到博客仓库 `yueyue-yu/dreary-disk`。这样博客仓库无需任何同步工作流。

你将完成的事情（一次性设置）
1) 创建一个 GitHub 个人访问令牌（PAT），授予对 `yueyue-yu/dreary-disk` 的写权限。
2) 把该令牌保存到 `yueyue-yu/moon` 的 Actions Secrets。
3) 在 `yueyue-yu/moon` 新增一个工作流文件，负责把 `moon/blog/` 的内容同步到博客仓库。

准备工作（超详细）
- 确认你对两个仓库都有权限（至少 moon 可写、dreary-disk 可写）。
- 确认博客默认分支名（通常是 `main`）。
- 决定在 moon 中哪个目录存放要发布的文章（默认用 `blog/`，可自行改名）。

步骤 1：在 GitHub 创建 Fine-grained PAT
1) 打开 GitHub 右上角头像 → Settings → Developer settings → Personal access tokens → Fine-grained tokens。
2) 选择 Generate new token。
3) Repository access 选择 Only select repositories，并勾选 `yueyue-yu/dreary-disk`。
4) Permissions → Repository permissions：将 Contents 设置为 Read and write（其余保持默认）。
5) 设定到期时间（建议 90 天或更长，后续需续期），创建后复制令牌值（只显示一次）。

重要：不要把 PAT 值粘贴到任何仓库文件、提交信息或日志中！请仅将其保存到 GitHub Actions Secrets 中。
在文档或笔记中请使用占位符展示，例如：<YOUR_FINE_GRAINED_PAT>。
步骤 2：把 PAT 存到 moon 仓库的 Secrets
1) 打开 `yueyue-yu/moon` → Settings → Secrets and variables → Actions。
2) New repository secret，Name 填：`DREARY_DISK_PAT`，Secret 填上一步复制的 PAT，保存。

步骤 3：在 moon 中新增工作流文件
方法 A（网页创建）：
- 打开 `yueyue-yu/moon` → Add file → Create new file。
- 文件名填：`.github/workflows/push-to-dreary-disk.yml`
- 粘贴下面完整内容，直接 Commit 到默认分支：

```yaml
name: Push posts to dreary-disk
on:
  push:
    paths:
      - 'blog/**'               # moon 仓库中用于发布的目录；改用其它目录需同步修改
  workflow_dispatch:
    inputs:
      blog_dir:
        default: 'blog'
      target_ref:
        default: 'main'

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout moon
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Checkout dreary-disk
        uses: actions/checkout@v4
        with:
          repository: yueyue-yu/dreary-disk
          token: ${{ secrets.DREARY_DISK_PAT }}
          path: dreary-disk
          fetch-depth: 0
          ref: ${{ inputs.target_ref || 'main' }}

      - name: Sync posts and assets
        env:
          BLOG_DIR: ${{ inputs.blog_dir || 'blog' }}
        run: |
          set -euxo pipefail
          SRC_DIR="${BLOG_DIR}"
          DEST="dreary-disk/src/content/post/moon"
          test -d "$SRC_DIR" || { echo "Not found: $SRC_DIR"; exit 1; }
          mkdir -p "$DEST"
          rsync -av --delete \
            --include='*/' \
            --include='*.md' --include='*.mdx' \
            --include='*.png' --include='*.jpg' --include='*.jpeg' --include='*.gif' --include='*.svg' --include='*.webp' \
            --exclude='*' \
            "$SRC_DIR/" "$DEST/"

      - name: Commit and push
        run: |
          set -euxo pipefail
          cd dreary-disk
          git config user.name "moon-sync[bot]"
          git config user.email "moon-sync@users.noreply.github.com"
          git checkout ${{ inputs.target_ref || 'main' }}
          git pull --ff-only
          if [ -n "$(git status --porcelain)" ]; then
            TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            git add -A
            git commit -m "chore(content): sync from moon at ${TS}"
            git push origin HEAD:${{ inputs.target_ref || 'main' }}
          else
            echo "No changes."
          fi
```

方法 B（本地提交）：在本地创建上述文件，推送到 `moon`。

目录规范与 Frontmatter（重要）
- 发布目录：默认 `moon/blog/`。如果你想用别的目录（例如 `articles/`），改两处：
  - 上面 YAML 的 `paths: - 'blog/**'`
  - 手动触发时的 `blog_dir`（或直接把默认值改为 `articles`）
- 附件与文章同放，用相对路径引用（示例：`![封面](./cover.png)`）。
- 每篇文章需要 Frontmatter（缺失会导致博客构建失败）：
  ```md
  ---
  title: "标题"
  description: "摘要"
  publishDate: "2025-09-12"
  tags: ["astro", "blog"]
  draft: false
  ---
  ```

首次运行与手动触发
- 第一次在 moon 启用 Actions：进入 moon 的 Actions 页，如果提示“Workflows aren’t being run on this repository”，点击启用。
- 正常触发：只要你向 `blog/` 提交变更，工作流会自动运行。
- 手动触发：在 moon → Actions → 选择 “Push posts to dreary-disk” → Run workflow，可以自定义 `blog_dir` 和目标分支 `target_ref`。

验证是否成功
- 看 moon 的 Actions 日志是否显示 “Commit and push” 成功。
- 打开博客仓库 `yueyue-yu/dreary-disk` → Code → `src/content/post/moon/`，应出现同步的 `.md|.mdx` 与图片。
- 博客部署：如托管平台对 `main` 分支 push 自动部署，则无需额外操作；否则你可以在本地执行 `pnpm build && pnpm postbuild && pnpm preview` 验证构建。

常见问题与排查
- 403/权限错误：检查 `DREARY_DISK_PAT` 是否有效、未过期；是否授予了 `yueyue-yu/dreary-disk` 的 Contents: Read & Write。
- 受保护分支：若博客分支受保护，直推会失败。做法：将 `git push origin HEAD:sync/moon`，并用 `peter-evans/create-pull-request` 在工作流里自动开 PR（需要额外权限 Pull requests: Write）。
- 没有触发：确认 YAML 的 `paths` 与你的实际目录一致；确认 Actions 已启用。
- 文件被删：`rsync --delete` 会让目标与源目录保持一致。如果不希望删除历史内容，去掉 `--delete`。
- 目录不一致：改了 `blog_dir` 但忘记同步修改 YAML 的 `paths`，会导致 push 不触发。

可选：可下载附件同步到 public
- 如需把 pdf/zip/csv 等放到博客的公共目录，追加一步：
  ```bash
  # 假设在 moon/blog/files/ 下放这些附件
  mkdir -p "dreary-disk/public/files/moon"
  rsync -av --delete "${SRC_DIR}/files/" "dreary-disk/public/files/moon/"
  ```

可选：在 moon 工作流中自动补全 Frontmatter（推荐）
- 如果你的很多旧笔记没有 Frontmatter，可以在 moon 的工作流里增加一个“小脚本”步骤，自动给没有任何 Frontmatter 的文件添加最小字段。这能保证推送到博客仓库后不会因缺字段而构建失败。
- 在 “Sync posts and assets” 之前插入以下两个步骤：

```yaml
      - name: Prepare normalize script
        run: |
          cat > normalize-frontmatter.mjs <<'EOF'
          #!/usr/bin/env node
          import fs from 'node:fs'; import path from 'node:path';
          const ROOT = process.cwd();
          const targetDir = path.resolve(ROOT, process.env.BLOG_DIR || 'blog');
          const toTitle = (n) => { const b = n.replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim(); return b.charAt(0).toUpperCase()+b.slice(1); };
          const fmtDate = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const hasFM = (t)=>/^---\s*\n/.test(t);
          const walk=(d,o=[])=>{ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) walk(p,o); else if(/\.(md|mdx)$/i.test(e.name)) o.push(p);} return o; };
          if(!fs.existsSync(targetDir)){ console.error('Not found:', targetDir); process.exit(1); }
          const files=walk(targetDir); let changed=0;
          for(const f of files){ const raw=fs.readFileSync(f,'utf8'); if(hasFM(raw)) continue; const st=fs.statSync(f); const t=toTitle(path.basename(f, path.extname(f))); const d=fmtDate(new Date(st.mtimeMs||st.mtime||Date.now())); const fm=`---\ntitle: "${t}"\ndescription: ""\npublishDate: "${d}"\ntags: []\ndraft: false\n---\n\n`; fs.writeFileSync(f, fm+raw); console.log('Added FM:', f); changed++; }
          console.log('Updated files:', changed);
          EOF

      - name: Normalize frontmatter in blog_dir
        env:
          BLOG_DIR: ${{ inputs.blog_dir || 'blog' }}
        run: node normalize-frontmatter.mjs
```

可选：在博客仓库本地一次性补齐 Frontmatter
- 如果你已同步了很多旧文章到本仓库但缺少 Frontmatter，可在博客仓库根目录运行：
  ```bash
  node scripts/normalize-moon-frontmatter.mjs src/content/post/moon
  ```
  它会为没有任何 Frontmatter 的 `.md|.mdx` 文件添加最小字段，避免本地 `pnpm dev` 或构建时报错。

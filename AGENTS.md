# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/` route files (`.astro`, dynamic like `posts/[...slug].astro`).
- `src/components/` reusable UI (e.g., `components/blog/PostPreview.astro`).
- `src/layouts/` page shells; `src/styles/` global and component CSS.
- `src/content/{post,note,tag}/` Markdown/MDX with frontmatter.
- `src/utils/`, `src/plugins/`, `src/data/` TypeScript helpers and remark plugins.
- `public/` static assets. Core config: `astro.config.ts`, `tailwind.config.ts`, `src/site.config.ts`. Build output: `dist/`.

## Build, Test, and Development Commands
- `pnpm install` install dependencies (Node `22` via `.nvmrc`).
- `pnpm dev` start dev server at `http://localhost:3000`.
- `pnpm build` production build to `dist/`.
- `pnpm postbuild` generate Pagefind search index for built content.
- `pnpm preview` serve the built site locally.
- `pnpm check` run Astro type/content checks.
- `pnpm lint` Biome lint; `pnpm format` Prettier + organize imports.

## Coding Style & Naming Conventions
- Tabs (width 2), line width 100; semicolons required; double quotes in JS/TS. Biome + Prettier configs are authoritative.
- Prettier formats `.astro` (with Tailwind plugin). Biome formats JS/TS and organizes imports.
- Markdown/MDX are not auto-formatted by scripts; keep lines ~80 chars and use kebab-case filenames.
- Components: PascalCase (`Header.astro`); utilities: camelCase (`generateToc.ts`); routes reflect filename.

## Testing Guidelines
- No test runner is configured. Validate changes with `pnpm check`, `pnpm dev`, and a full `pnpm build && pnpm postbuild`.
- If adding tests for utilities, colocate as `*.test.ts` and keep tooling lightweight.

## Commit & Pull Request Guidelines
- No strict convention in history; write imperative, descriptive messages (e.g., "Add masthead TOC"). Conventional Commits are welcome.
- Before opening a PR, run `pnpm lint` and `pnpm format`.
- PRs should include: clear description, linked issues, screenshots for UI changes, and notes on config/env updates.

## Security & Configuration Tips
- Copy `.example.env` to `.env` for `WEBMENTION_*` values; never commit `.env`.
- Update `src/site.config.ts` (set `url`) and `public/` icons as needed.
- Do not edit generated artifacts (`.astro/`, `dist/`, `node_modules/`).


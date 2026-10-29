# AGENTS.md

Static HTML/CSS/JS course project (Gitee `feng-xicheng/fxc403`). There is no build, package manager, test, lint, or CI — verify changes by opening the affected `.html` file in a browser.

## Read first

- `skills/project-rules/SKILL.md` — hard project rules. It is not registered with the `skill` tool, so read the file directly before editing.
- `skills/SKILL.md` — frontend-design guidance; plan palette/type/layout before writing UI code.

## Mandatory workflow

- Before executing a task, **append** the user's prompt to `fxc_prompt.md` using the format `## YYYY-MM-DD HH:mm:ss | <model>`, followed by the prompt and `---`. Never overwrite; mask secrets.
- Prefix new CSS classes, IDs, and JS variables with `fxc_`. Existing files (`index.html`, `starter-level*`, `fxc_24001010403.html` internals, etc.) do not follow this — apply the rule to new work; do not mass-rename.
- Every new HTML page must include `<a href="index.html">返回首页</a>`.
- Vendor third-party assets locally (`cdn/`, `font/`); pages must run offline with no remote CDN URLs.

## Layout / architecture

- Root `*.html` are standalone demos with inline CSS/JS; there is no shared app shell or router.
- `index.html` is the hand-maintained course catalog. Add/update its cards manually when a page should appear there.
- `data.js` exposes `window.STUDENTS` and `window.SUBJECTS`; `starter-level1.html` and `starter-level2.html` depend on those global names.
- `font/` holds the iconfont package; `cdn/fontawesome/` and `cdn/lucide/` hold vendored libraries. `my/` and `my2/` are near-duplicate iconfont demo sets.
- Some exercise files are extensionless or misleading: `html_basic.css` / `html_basic_css` are complete HTML documents, while files like `body` and `header` are fragments. Inspect before assuming a type.

## Gotchas

- All files are UTF-8 without BOM. Windows PowerShell 5.1 `Get-Content` / `Select-String` decode CJK as ANSI and show mojibake — use the Read/Write/Edit tools instead.
- Pages reference assets via relative paths (`cdn/`, `font/`, `img/`); keep HTML at repo root or update paths when moving.
- Remote is Gitee. Existing commits use Chinese `feat:` / `fix:` / `merge:` messages. Do not commit or push unless asked.

## Codebase memory

- For architecture discovery, repository-wide search, call-chain tracing, or change-impact analysis, use the `codebase_memory` MCP tools before broad file-by-file exploration.
- Before graph-dependent work, call `index_repository` for the current repository root with `persistence=false`; use the returned `project` value for subsequent graph calls. The startup bootstrap already refreshes the index, so this call is incremental and also resolves the local project name.
- Treat the graph as an index: verify critical conclusions against the source files before editing.

## Git and Commits

When a user asks for a commit:

1. First, examine:
- `git status`
- `git diff`
- `git diff --staged`
2. Don't use `git add .`.
Add files deliberately, in logical groups.
3. If the changes relate to different tasks, propose or make several separate commits.
4. The commit message should always be detailed, no shorter than this format:

```text
type(scope): brief description of the change

What was changed:
- ...
```

### Mandatory frontend validation

Before declaring work complete, committing, or pushing any change under `app/`, run all of the following from `app/`:

```bash
yarn styles:check
yarn test:unit
NN_SKIP_WEB_LITERTLM=1 yarn build
```

Do not commit or push while a required check is failing. If a check cannot run because of an environment limitation, report the exact blocker and do not claim that the change is fully verified.

### Mobile build validation

Do not build the mobile application after every frontend change. Changes limited to localization files, including `app/i18n/locales/*.json`, do not require a mobile rebuild and are covered by the mandatory frontend validation above. Run a mobile build only when the change affects Tauri-related configuration, native mobile code, or the Android shell.

UI colors must use the existing semantic theme tokens. Literal colors are allowed only when the color is application data (for example, note, pen, marker, Canvas, or PDF content), and then only in a dedicated data/rendering module covered by a narrow, explicit exception in `scripts/check-style-location.mjs`. Do not broadly disable or weaken the style check to make it pass.

### No code duplication / mandatory reuse

Before adding new code, always check whether similar logic, UI, validation, API calls, formatting, parsing, state handling, or business rules already exist in the project.

Do not copy-paste or reimplement existing logic in a new place. If the same or similar code is needed in more than one location, extract it into a reusable unit that matches the project structure: a function, utility module, hook, component, service, class, helper, or shared constant.

When extracting shared logic, update **both** places in the same change:

1. Replace the old duplicated implementation with the new reusable abstraction.
2. Use the same abstraction in the new code.
3. Keep behavior backward-compatible unless the task explicitly requires a behavior change.
4. Update imports, types, tests, and documentation affected by the refactor.
5. Do not leave multiple sources of truth for the same logic.

Duplication is allowed only when extraction would clearly make the code harder to understand, more coupled, or less maintainable. In that case, add a short comment or explanation in the final response explaining why reuse was intentionally not introduced.

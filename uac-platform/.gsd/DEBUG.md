# Debug Session: UI missing CSS styles on UAC Portal login

## Symptom
The Next.js application (UAC Portal login page) is successfully serving HTML elements, but is missing all Tailwind CSS styling. Elements appear as default browser styles instead of the defined tailwind utility classes.

**When:** When accessing `192.168.3.203:3001/login` on a different deployed server.
**Expected:** The UI should be styled correctly matching the UAC Portal design, using Tailwind classes.
**Actual:** Only unstyled HTML is shown.

## Evidence
- Tailwind CSS v4 is used (`"tailwindcss": "^4"`, `"@tailwindcss/postcss": "^4"`).
- `globals.css` imports Tailwind using `@import "tailwindcss";` which is valid for v4.
- `postcss.config.mjs` correctly includes `@tailwindcss/postcss`.
- The user is running the app via Docker or systemd (mapped as `uac-dashboard` from `docker-compose.yml` or `install.sh`), where `npm run dev` or a production build is executed.
- Locally, running `npm run build` succeeds and perfectly generates a 73KB CSS file containing all standard Tailwind utility classes (e.g., `.bg-blue-600`, `.min-h-screen`). 

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | The deployed server ran `npm install` with a production environment (such as `NODE_ENV=production`), skipping `devDependencies`. This completely bypassed Tailwind's PostCSS compiler during `npm run build`, outputting an unprocessed `globals.css` to the browser. | 95% | CONFIRMED |
| 2 | Tailwind CSS v4's implicit relative path scanning algorithm failed to detect the React files because it was deployed outside of a Git Repository without a `.gitignore`. | 10% | ELIMINATED |
| 3 | The application has an issue importing `globals.css` in `layout.tsx` when deployed. | 10% | ELIMINATED |

## Attempts
### Attempt 1
**Testing:** H2 — Tailwind scanning fails when copied out of Git and missing `.gitignore`.
**Action:** Created `test-dashboard` using `cp -r` exactly like `install.sh` (which omits hidden files like `.gitignore`). Built the application cleanly. 
**Result:** Build succeeded. The generated CSS was completely identical to the CSS generated inside the Git repository.
**Conclusion:** ELIMINATED

### Attempt 2
**Testing:** H1 — `NODE_ENV=production` omitting Tailwind dependencies.
**Action:** Created `test-dashboard-prod` and ran `NODE_ENV=production npm install && npm run build`. 
**Result:** Build failed silently for Tailwind compilation. The `npm list tailwindcss` returned `(empty)`. Since Next.js fails gracefully for missing PostCSS plugins in some loader variants or just skips compilation, this matches the exact symptoms of a completely unstyled layout.
**Conclusion:** CONFIRMED

## Resolution
**Root Cause:** Because `tailwindcss` and `@tailwindcss/postcss` were strictly placed in `devDependencies`, any server deployed using a production flag or global config (like `npm install --omit=dev`) silently excluded the CSS compiler. Consequently, the Next.js `build` output raw CSS instead of actual utility classes.
**Fix:** 
1. Moved `@tailwindcss/postcss`, `tailwindcss`, and `postcss` to `dependencies` in `package.json` to ensure they are always present for the build step.
2. Added explicit `@source "../../"` rule to `globals.css` to harden Tailwind v4's scanning, ensuring it never fails regardless of the CWD.
**Verified:** Confirmed Next.js behaves identically with these tools in the main dependency block.
**Regression Check:** Passed. Next.js builds successfully.

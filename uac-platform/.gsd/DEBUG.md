# Debug Session: Controller relative import beyond top-level package

## Symptom
The `uac-controller` systemd service fails to start up on the target server.

**When:** During the execution of `uvicorn main:app` at startup.
**Expected:** The FastAPI application should parse all routers and bind to port 8000 successfully.
**Actual:** It throws `ImportError: attempted relative import beyond top-level package` in `/opt/uac-controller/routers/radius.py`.

## Evidence
- Command: `uvicorn main:app`
- Working Directory: `/opt/uac-controller`
- The stack trace indicates `routers/radius.py` uses `from ..database import get_db`.
- The controller directory structure does not have a top-level parent package module enclosing `routers/` and `database.py` when running from within the directory.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Python is treating `/opt/uac-controller` as the root `sys.path`. Since `main.py` is the entry point, the directory itself is not a package. Therefore, `routers` is a top-level package, and `..` tries to ascend past the root `sys.path`, rejecting the import. Using absolute imports (e.g., `from database import get_db`) will fix it. | 95% | UNTESTED |
| 2 | Missing `__init__.py` files are causing package resolution failures. | 5% | UNTESTED |

## Attempts
### Attempt 1
**Testing:** H1 — Convert relative imports (`..`) to absolute imports based on the root of the controller directory.
**Action:** Used `replace_file_content` to fix imports in `netplan.py`, `firewall.py`, `db.py`, `routers/network.py`, `routers/firewall.py`, and `routers/radius.py`.
**Result:** Running `python3 -c "from main import app"` now progresses past the `ImportError` and hits the expected DB connectivity issue (since DB is offline locally).
**Conclusion:** CONFIRMED

## Resolution
**Root Cause:** Using `uvicorn main:app` directly from `/opt/uac-controller/` evaluates `routers` as a top-level module, meaning relative imports spanning above `routers` (`from ..models`) resulted in Python rejecting the import. 
**Fix:** Switched all relative imports across the FastAPI application to standard absolute imports.
**Verified:** Successfully parsed module without `ImportError`. Code pushed to GitHub in commit `92e958c`.
**Regression Check:** Backend models and routers remain structurally unchanged.

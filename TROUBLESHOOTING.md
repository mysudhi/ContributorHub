# Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the ContributorHub development environment on **Linux**, **macOS**, and **Windows**. It covers problems encountered during setup and anticipates issues for developers new to this stack.

> **Legend:** Commands are shown for all platforms where they differ. If no platform label is shown, the command works the same everywhere.

---

## Table of Contents

1. [Node.js and npm Issues](#1-nodejs-and-npm-issues)
2. [Dependency Installation Issues](#2-dependency-installation-issues)
3. [PostgreSQL Issues](#3-postgresql-issues)
4. [Environment Variables Issues](#4-environment-variables-issues)
5. [Prisma Issues](#5-prisma-issues)
6. [Backend Server Issues](#6-backend-server-issues)
7. [Frontend / Vite Issues](#7-frontend--vite-issues)
8. [TypeScript Issues](#8-typescript-issues)
9. [Git and Version Control Issues](#9-git-and-version-control-issues)
10. [Email Notification Issues](#10-email-notification-issues)
11. [General Tips](#11-general-tips)

---

## 1. Node.js and npm Issues

### Wrong Node.js version

**Symptom:** Errors mentioning unsupported syntax, or npm refusing to install with engine warnings.

**Fix:** This project requires Node.js >= 20. Check your version:

```bash
node --version
```

If outdated, update:

**Linux / macOS** (using [nvm](https://github.com/nvm-sh/nvm)):

```bash
nvm install 20
nvm use 20
```

**macOS** (using Homebrew):

```bash
brew install node@20
```

**Windows** (using [nvm-windows](https://github.com/coreybutler/nvm-windows)):

```powershell
nvm install 20
nvm use 20
```

**Windows** (alternative): Download the LTS installer from https://nodejs.org/ and run it.

---

### `npm` command not found

**Symptom:**

| Platform | Error message |
|----------|--------------|
| Linux | `bash: npm: command not found` |
| macOS | `zsh: command not found: npm` |
| Windows | `'npm' is not recognized as an internal or external command` |

**Fix:** npm ships with Node.js. If missing, reinstall Node.js using the methods above. If using nvm/nvm-windows, run `nvm install --lts`.

**Windows-specific:** Close and reopen your terminal after installing Node.js so the PATH updates take effect.

---

### Permission denied errors with npm

**Symptom:** `EACCES: permission denied` when running `npm install`

**Linux / macOS fix:** Never use `sudo npm install`. Instead, fix npm permissions:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

Add the `export` line to your shell profile:
- **Linux:** `~/.bashrc`
- **macOS:** `~/.zshrc`

**macOS-specific:** If you installed Node via Homebrew, permissions are usually fine. If not, try `brew reinstall node@20`.

**Windows fix:** This error is rare on Windows. If it occurs:
1. Close your terminal
2. Right-click your terminal app (PowerShell, CMD, or Windows Terminal) and select **"Run as administrator"**
3. Run `npm install` again

> **Note:** Running as administrator is only needed for the initial fix. For day-to-day development, use a normal terminal.

---

## 2. Dependency Installation Issues

### `npm install` fails or hangs

**Symptom:** Installation stalls or throws network errors.

**Fixes (all platforms):**
- Check internet connectivity: `ping registry.npmjs.org`
- Clear npm cache: `npm cache clean --force`
- Delete lockfile and retry:

**Linux / macOS:**
```bash
rm package-lock.json && npm install
```

**Windows (PowerShell):**
```powershell
Remove-Item package-lock.json; npm install
```

**Windows (Command Prompt):**
```cmd
del package-lock.json && npm install
```

- If behind a corporate proxy:
  ```bash
  npm config set proxy http://proxy.example.com:8080
  npm config set https-proxy http://proxy.example.com:8080
  ```

**Windows-specific:** Some corporate environments use system-level proxy settings. If the npm proxy config doesn't work, try setting the environment variables:

```powershell
$env:HTTP_PROXY="http://proxy.example.com:8080"
$env:HTTPS_PROXY="http://proxy.example.com:8080"
npm install
```

---

### `node_modules` out of sync or corrupted

**Symptom:** Strange import errors, missing modules, or version conflicts.

**Fix:** Clean everything and reinstall.

**Linux / macOS:**
```bash
rm -rf node_modules client/node_modules server/node_modules shared/node_modules package-lock.json
npm install
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force node_modules, client\node_modules, server\node_modules, shared\node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

**Windows (Command Prompt):**
```cmd
rmdir /s /q node_modules client\node_modules server\node_modules shared\node_modules
del package-lock.json
npm install
```

> **Windows tip:** If deletion fails with "file in use" errors, close all editors and terminals that might have files open in `node_modules`, then retry. If still stuck, try deleting with [rimraf](https://www.npmjs.com/package/rimraf): `npx rimraf node_modules client/node_modules server/node_modules shared/node_modules`

---

### Workspace linking not working

**Symptom:** Cannot find module `@contributorhub/shared` or similar workspace package errors.

**Fix (all platforms):** Ensure you run `npm install` from the **workspace root** (the folder containing the root `package.json` with `"workspaces"`), not from inside a sub-package.

---

## 3. PostgreSQL Issues

### PostgreSQL not installed

**Symptom:** `psql: command not found` or `pg_ctlcluster: command not found`

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

**macOS (Homebrew):**

```bash
brew install postgresql@16
```

If `psql` still isn't found after install:

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**macOS (Postgres.app):**

1. Download from https://postgresapp.com/
2. Add CLI tools to PATH: `sudo mkdir -p /etc/paths.d && echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp`

**Windows:**

1. Download installer from https://www.postgresql.org/download/windows/
2. During installation, note the install directory (default: `C:\Program Files\PostgreSQL\16`)
3. If `psql` isn't found, add the bin directory to your PATH:

```powershell
# Check if PostgreSQL bin is in PATH
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
```

To make it permanent: System Properties → Environment Variables → Edit `Path` → Add `C:\Program Files\PostgreSQL\16\bin`

---

### PostgreSQL service not running

**Symptom:** `connection refused` or `could not connect to server`

**Linux:**

```bash
# Start
sudo pg_ctlcluster 16 main start

# Check status
pg_lsclusters

# Alternative (systemd)
sudo systemctl start postgresql
sudo systemctl status postgresql
```

**macOS (Homebrew):**

```bash
# Start
brew services start postgresql@16

# Check status
brew services list

# Manual start (if brew services fails)
pg_ctl -D /opt/homebrew/var/postgresql@16 start
```

**macOS (Postgres.app):** Open the Postgres.app application and click "Start".

**Windows:**

```powershell
# Check if the service is running
Get-Service -Name "postgresql*"

# Start the service
Start-Service -Name "postgresql-x64-16"
```

Or use the Services GUI:
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "postgresql-x64-16" in the list
3. Right-click → Start

**Windows (pgAdmin):** Open pgAdmin → right-click the server → Connect.

---

### Cannot create user or database

**Symptom:** `FATAL: role "contributorhub" does not exist` or permission errors during creation.

**Linux:**

```bash
sudo -u postgres psql -c "CREATE USER contributorhub WITH PASSWORD 'contributorhub' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE contributorhub OWNER contributorhub;"
```

**macOS (Homebrew):**

Your macOS user is typically the PostgreSQL superuser, so `sudo -u postgres` is not needed:

```bash
psql postgres -c "CREATE USER contributorhub WITH PASSWORD 'contributorhub' CREATEDB;"
psql postgres -c "CREATE DATABASE contributorhub OWNER contributorhub;"
```

If that fails, try:
```bash
createuser -s contributorhub
createdb -O contributorhub contributorhub
```

**Windows (SQL Shell):**

1. Open "SQL Shell (psql)" from the Start Menu
2. Press Enter for server, database, port, and username defaults
3. Enter the superuser password set during installation
4. Run:

```sql
CREATE USER contributorhub WITH PASSWORD 'contributorhub' CREATEDB;
CREATE DATABASE contributorhub OWNER contributorhub;
\q
```

**Windows (PowerShell):**

```powershell
psql -U postgres -c "CREATE USER contributorhub WITH PASSWORD 'contributorhub' CREATEDB;"
psql -U postgres -c "CREATE DATABASE contributorhub OWNER contributorhub;"
```

You will be prompted for the postgres superuser password.

---

### Authentication failed

**Symptom:** `FATAL: password authentication failed for user "contributorhub"`

**Fixes (all platforms):**

1. Verify the password matches what's in your `.env` file.

2. Find and check PostgreSQL's `pg_hba.conf`:

   **Linux:**
   ```bash
   sudo -u postgres psql -c "SHOW hba_file;"
   ```

   **macOS:**
   ```bash
   psql postgres -c "SHOW hba_file;"
   ```

   **Windows:**
   ```powershell
   psql -U postgres -c "SHOW hba_file;"
   ```

3. Ensure there's a line allowing password auth:
   ```
   host    all    all    127.0.0.1/32    md5
   ```

4. Restart PostgreSQL after changes:

   | Platform | Restart command |
   |----------|----------------|
   | Linux | `sudo pg_ctlcluster 16 main restart` |
   | macOS (Homebrew) | `brew services restart postgresql@16` |
   | Windows | `Restart-Service -Name "postgresql-x64-16"` |

---

### Port 5432 already in use

**Symptom:** `Is another postmaster already running?` or port conflict.

**Linux / macOS:**

```bash
lsof -i :5432
# Note the PID, then stop the conflicting process
```

**Windows (PowerShell):**

```powershell
netstat -ano | findstr :5432
# Note the PID in the last column, then:
tasklist /FI "PID eq <PID>"
# To stop it:
Stop-Process -Id <PID>
```

**Windows (Command Prompt):**

```cmd
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

Alternatively, change the PostgreSQL port in `postgresql.conf`.

---

## 4. Environment Variables Issues

### Missing `.env` file

**Symptom:** Prisma commands fail with `Environment variable not found: DATABASE_URL`

**Fix:** Create the `.env` file in the workspace root.

**Linux / macOS:**

```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
NODE_ENV="development"
PORT=4000
EOF
```

**Windows (PowerShell):**

```powershell
@"
DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
NODE_ENV="development"
PORT=4000
"@ | Out-File -Encoding utf8 .env
```

**Windows (manual):**

1. Open Notepad (or any text editor)
2. Paste the four lines (DATABASE_URL, DIRECT_URL, NODE_ENV, PORT)
3. Save as `.env` in the project root
4. In the Save dialog, set "Save as type" to **All Files** to avoid `.env.txt`

---

### Server doesn't pick up `.env` file

**Symptom:** Server crashes with Zod validation errors about missing `DATABASE_URL`.

**Explanation:** Prisma CLI auto-loads `.env`, but Node.js/tsx does **not**. You must pass environment variables explicitly.

**Linux / macOS:**

```bash
DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub" \
DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub" \
npm run dev -w server
```

**Windows (PowerShell):**

```powershell
$env:DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
$env:DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
npm run dev -w server
```

**Windows (Command Prompt):**

```cmd
set DATABASE_URL=postgresql://contributorhub:contributorhub@localhost:5432/contributorhub
set DIRECT_URL=postgresql://contributorhub:contributorhub@localhost:5432/contributorhub
npm run dev -w server
```

> **Important:** On Windows, do **not** put quotes around the value when using `set`. `set VAR="value"` includes the quotes as part of the value.

**Cross-platform alternative:** Install `dotenv-cli` globally:

```bash
npm install -g dotenv-cli
dotenv -- npm run dev -w server
```

---

### Env vars set but not recognized

**Symptom:** Variables are exported but the app doesn't see them.

**Fixes:**

| Platform | Check |
|----------|-------|
| Linux | Ensure you `export` in the same terminal session |
| macOS | Same — also check `~/.zshrc` if you added permanent exports |
| Windows (PS) | `$env:VAR` only persists in the current PowerShell session |
| Windows (CMD) | `set VAR` only persists in the current CMD session |

- Check for typos — variable names are case-sensitive on Linux/macOS (but not on Windows)
- If using a `.env` file with a tool, ensure the file is in the correct directory

---

## 5. Prisma Issues

### Prisma version mismatch (v7 errors)

**Symptom:**
```
Error: The datasource property `url` is no longer supported in schema files.
```

**Explanation:** This project uses Prisma v6.x schema format. Prisma v7 removed `url`/`directUrl` from schema files.

**Fix (all platforms):**

```bash
npm install -w server prisma@6 @prisma/client@6
```

Verify:
```bash
npx prisma --version
# Should show prisma: 6.x.x
```

---

### `prisma generate` fails with module not found

**Symptom:** `Cannot find module '@prisma/client/runtime/...'`

**Fix (all platforms):** This usually happens when `@prisma/client` and `prisma` CLI are different major versions. Check and reinstall:

```bash
npm ls prisma @prisma/client
```

If mismatched, do a clean reinstall:

**Linux / macOS:**
```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate --schema prisma/schema.prisma
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
npx prisma generate --schema prisma/schema.prisma
```

---

### Migration fails

**Symptom:** `Error: P3014: Prisma Migrate could not create the shadow database`

**Fix:** Ensure the database user has `CREATEDB` permission.

**Linux:**
```bash
sudo -u postgres psql -c "ALTER USER contributorhub CREATEDB;"
```

**macOS:**
```bash
psql postgres -c "ALTER USER contributorhub CREATEDB;"
```

**Windows:**
```powershell
psql -U postgres -c "ALTER USER contributorhub CREATEDB;"
```

---

### Database schema out of sync

**Symptom:** `The database schema is not empty` or migration drift errors.

**Fix (all platforms):** For development, you can reset the database:

```bash
npx prisma migrate reset --schema prisma/schema.prisma
```

> **Warning:** This deletes all data in the database.

---

### Prisma Studio won't open

**Symptom:** `prisma studio` opens but shows connection errors.

**Fix (all platforms):** Ensure PostgreSQL is running and the `.env` file has correct connection strings:

```bash
npx prisma studio --schema prisma/schema.prisma
```

This opens a browser-based GUI at http://localhost:5555 for exploring your data.

---

## 6. Backend Server Issues

### Port 4000 already in use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::4000`

**Linux / macOS:**

```bash
lsof -i :4000
# Note the PID, then:
kill <PID>
```

**Windows (PowerShell):**

```powershell
netstat -ano | findstr :4000
# Note the PID in the last column
Stop-Process -Id <PID>
```

**Windows (Command Prompt):**

```cmd
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**All platforms — change the port instead:**

| Platform | Command |
|----------|---------|
| Linux / macOS | `PORT=4001 npm run dev -w server` |
| Windows (PS) | `$env:PORT=4001; npm run dev -w server` |
| Windows (CMD) | `set PORT=4001 && npm run dev -w server` |

---

### Server crashes immediately on start

**Symptom:** Process exits with a Zod validation error.

**Explanation:** If any code imports `src/config/env.ts`, Zod validates that `DATABASE_URL` and `DIRECT_URL` are present and valid URLs.

**Fix:** Ensure both env vars are set (see [Section 4](#4-environment-variables-issues)).

---

### `tsx` not found

**Symptom:**

| Platform | Error message |
|----------|--------------|
| Linux | `sh: tsx: command not found` |
| macOS | `zsh: command not found: tsx` |
| Windows | `'tsx' is not recognized as an internal or external command` |

**Fix (all platforms):** `tsx` is a devDependency of the server package. Reinstall:

```bash
npm install
```

If it still fails, run directly via npx:

```bash
npx tsx watch server/src/index.ts
```

---

### Express route returns 404

**Symptom:** `Cannot GET /api/...`

**Explanation (all platforms):** The API router at `server/src/routes/index.ts` is initially empty. You need to add route handlers as you develop features.

The only built-in endpoint is:
```
GET /health → {"status":"ok"}
```

---

## 7. Frontend / Vite Issues

### Vite dev server won't start

**Symptom:** `vite: command not found` or module resolution errors.

**Fix (all platforms):**

```bash
npm install
npm run dev -w client
```

---

### Port 5173 already in use

**Symptom:** Vite reports the port is occupied.

**Fix:** Vite usually auto-picks the next available port. If not, stop the conflicting process.

**Linux / macOS:**
```bash
lsof -i :5173
kill <PID>
```

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :5173
Stop-Process -Id <PID>
```

---

### Blank page in browser

**Symptom:** http://localhost:5173 loads but shows a white screen.

**Fixes (all platforms):**

1. Open browser DevTools (F12 on all platforms, or Cmd+Option+I on macOS) → Console tab. Look for JavaScript errors.
2. Ensure `client/index.html` has `<div id="root"></div>`.
3. Check that React and ReactDOM are installed: `npm ls react react-dom`

---

### Hot Module Replacement (HMR) not working

**Symptom:** Changes to `.tsx` files don't auto-refresh the browser.

**Fixes (all platforms):**
- Try a hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on macOS)
- Ensure `@vitejs/plugin-react` is installed: `npm ls @vitejs/plugin-react`
- Check that the Vite config has `server.host: "0.0.0.0"` (already set)

**Windows-specific:**
- Windows Defender or other antivirus software may block file-watching. Add the project folder to your antivirus exclusion list.
- If using WSL2 with files on the Windows filesystem (e.g., `/mnt/c/...`), file watching is unreliable. Move the project to the Linux filesystem (e.g., `~/projects/`) instead.

**macOS-specific:**
- If using an older macOS version, you may need to increase the file watch limit:
  ```bash
  echo kern.maxfiles=524288 | sudo tee -a /etc/sysctl.conf
  echo kern.maxfilesperproc=524288 | sudo tee -a /etc/sysctl.conf
  sudo sysctl -w kern.maxfiles=524288
  sudo sysctl -w kern.maxfilesperproc=524288
  ```

---

### CSS/styles not loading

**Symptom:** Page renders but looks unstyled.

**Fix (all platforms):** Verify that `client/src/main.tsx` imports `./styles.css`. The project uses utility class names (Tailwind-style) but no Tailwind CSS is configured — the classes in the code are purely illustrative.

---

## 8. TypeScript Issues

### `shared` package build fails with TS2835

**Symptom:**
```
error TS2835: Relative import paths need explicit file extensions in ECMAScript imports
when '--moduleResolution' is 'node16' or 'nodenext'.
```

**Explanation (all platforms):** This is a known pre-existing issue. The `shared/src/index.ts` uses extensionless imports (`./types/rbac` instead of `./types/rbac.js`) while the tsconfig uses `NodeNext` module resolution.

**Impact:** This only affects the `tsc` build command. Runtime tools (tsx, Vite) handle extensionless imports fine. Development is not blocked.

**Fix (if you want to resolve it):** Add `.js` extensions to imports in `shared/src/index.ts`:

```typescript
export * from "./types/rbac.js";
export * from "./schemas/organization.js";
```

---

### Cannot find type declarations

**Symptom:** `Cannot find module 'express'` or `Cannot find type definitions`

**Fix (all platforms):**

```bash
npm install -w server -D @types/express @types/node
npm install -w client -D @types/react @types/react-dom
```

---

### `tsc` reports errors but app runs fine

**Explanation (all platforms):** TypeScript type-checking is stricter than what tsx/Vite enforce at runtime. You can run type-checking separately:

```bash
npx tsc -p client/tsconfig.json --noEmit
npx tsc -p server/tsconfig.json --noEmit
```

Fix type errors for code quality, but they won't prevent the dev servers from running.

---

## 9. Git and Version Control Issues

### Accidentally committed `.env` file

**Symptom:** Secrets visible in git history.

**Fix (all platforms):** The `.env` file is in `.gitignore`, but if you force-added it:

```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

> **Important:** If secrets were pushed to a remote, rotate all passwords immediately.

---

### Merge conflicts in `package-lock.json`

**Symptom:** Large merge conflicts in the lockfile.

**Fix (all platforms):** Don't manually resolve lockfile conflicts. Instead:

```bash
git checkout --theirs package-lock.json
npm install
git add package-lock.json
git commit
```

---

### Line ending issues (Windows)

**Symptom:** Git shows every line in every file as changed, or you see `^M` characters in diffs.

**Explanation:** Windows uses `\r\n` line endings while Linux/macOS use `\n`. Git may flag every line as changed.

**Fix:** Configure Git to handle line endings automatically:

```bash
git config --global core.autocrlf true
```

If the project has a `.gitattributes` file, it takes precedence. If not, consider adding one:

```
* text=auto
*.ts text eol=lf
*.tsx text eol=lf
*.json text eol=lf
```

---

### Prisma migration conflicts

**Symptom:** Two developers created migrations with overlapping changes.

**Fix (all platforms):**

```bash
npx prisma migrate reset --schema prisma/schema.prisma
```

Then re-run migrations to verify they apply cleanly.

---

## 10. Email Notification Issues

### Emails not being sent

**Symptom:** No emails are received after shift signup, assignment, or reminders.

**Fixes (all platforms):**

1. Check if email is enabled: `SMTP_HOST` must be set.
2. Verify status via API:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:4000/api/notifications/status
   ```
   If `emailEnabled` is `false`, the SMTP configuration is missing.

3. Check server logs for `[Email]` messages — they indicate whether emails are sent or skipped.

---

### SMTP connection failed

**Symptom:** Server logs show `[Email] Failed:` errors or SMTP verify returns `connected: false`.

**Fixes (all platforms):**

1. Verify SMTP credentials are correct.
2. Test the connection via API (requires admin role):
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:4000/api/notifications/verify
   ```
3. Common SMTP issues:
   - **Gmail:** Use App Passwords (not your regular password). Enable "Less secure apps" or use OAuth2.
   - **Port 465:** Set `SMTP_SECURE=true` for SSL connections.
   - **Port 587:** Use `SMTP_SECURE=false` (default) — STARTTLS is handled automatically.
   - **Firewall:** Ensure outbound connections on port 587/465 are allowed.

---

### Gmail-specific SMTP setup

**Symptom:** Gmail blocks SMTP authentication.

**Fix:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Generate an App Password: https://myaccount.google.com/apppasswords
4. Use the generated password as `SMTP_PASS`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

---

### Shift reminders not triggering

**Symptom:** Contributors don't receive reminder emails before their shifts.

**Fixes (all platforms):**

1. The scheduler runs automatically when `SMTP_HOST` is configured. Check server logs for `[Scheduler]` messages.
2. The scheduler checks every hour for shifts starting within the next 24 hours.
3. To manually trigger reminders (admin only):
   ```bash
   curl -X POST -H "Authorization: Bearer <token>" http://localhost:4000/api/notifications/send-reminders
   ```
4. Ensure shifts have `OPEN` or `FILLED` status — `DRAFT` and `CANCELLED` shifts are excluded.

---

### Email appears in spam

**Symptom:** Notification emails land in recipients' spam folders.

**Fixes:**
- Use a verified sending domain with proper SPF, DKIM, and DMARC records.
- Set `SMTP_FROM` to match your authenticated domain.
- Avoid using free email providers (Gmail, Yahoo) as the "from" address for bulk sending.
- If using a transactional email service (SendGrid, Mailgun, Amazon SES), follow their domain verification guides.

---

## 11. General Tips

### How to completely reset the development environment

If things are in a broken state and you want to start fresh:

**Linux:**

```bash
rm -rf node_modules client/node_modules server/node_modules shared/node_modules package-lock.json
sudo -u postgres psql -c "DROP DATABASE IF EXISTS contributorhub;"
sudo -u postgres psql -c "CREATE DATABASE contributorhub OWNER contributorhub;"
npm install
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
```

**macOS:**

```bash
rm -rf node_modules client/node_modules server/node_modules shared/node_modules package-lock.json
psql postgres -c "DROP DATABASE IF EXISTS contributorhub;"
psql postgres -c "CREATE DATABASE contributorhub OWNER contributorhub;"
npm install
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
```

**Windows (PowerShell):**

```powershell
Remove-Item -Recurse -Force node_modules, client\node_modules, server\node_modules, shared\node_modules, package-lock.json -ErrorAction SilentlyContinue
psql -U postgres -c "DROP DATABASE IF EXISTS contributorhub;"
psql -U postgres -c "CREATE DATABASE contributorhub OWNER contributorhub;"
npm install
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
```

---

### Checking if all services are running

**Linux / macOS:**

```bash
pg_isready -h localhost -p 5432
curl -s http://localhost:4000/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
```

**Windows (PowerShell):**

```powershell
pg_isready -h localhost -p 5432
Invoke-RestMethod http://localhost:4000/health
(Invoke-WebRequest http://localhost:5173/).StatusCode
```

**Expected output (all platforms):**

```
localhost:5432 - accepting connections
{"status":"ok"}   (or @{status=ok} on PowerShell)
200
```

---

### Understanding the monorepo structure

This is the same on all platforms:

- **Root `package.json`** — defines workspaces and shared scripts
- **`client/`** — React frontend (runs independently)
- **`server/`** — Express API (requires PostgreSQL)
- **`shared/`** — Shared TypeScript types/schemas (imported by both client and server)
- **`prisma/`** — Database schema and migrations

Changes to `shared/` are picked up automatically by both client and server dev servers.

---

### Where to find logs

| Service | Linux | macOS | Windows |
|---------|-------|-------|---------|
| PostgreSQL | `/var/log/postgresql/postgresql-16-main.log` | `brew info postgresql@16` shows the log path, or `~/Library/Logs/Homebrew/postgresql@16/` | `C:\Program Files\PostgreSQL\16\data\log\` or check pgAdmin |
| Backend | Terminal running `npm run dev -w server` | Same | Same |
| Frontend | Terminal running `npm run dev -w client` + browser DevTools | Same | Same |
| Prisma | Inline in terminal output | Same | Same |

---

### Platform-specific gotchas summary

| Issue | Linux | macOS | Windows |
|-------|-------|-------|---------|
| File path separators | `/` | `/` | `\` (but `/` works in Node.js/npm) |
| Case-sensitive filesystem | Yes (by default) | No (by default) | No |
| Env var syntax (inline) | `VAR=val command` | `VAR=val command` | Not supported — use `$env:` (PS) or `set` (CMD) |
| Kill process on port | `lsof -i :PORT` + `kill` | `lsof -i :PORT` + `kill` | `netstat -ano \| findstr :PORT` + `Stop-Process` |
| Default shell | bash | zsh | PowerShell |
| PostgreSQL superuser | `sudo -u postgres psql` | `psql postgres` | `psql -U postgres` |
| File watch limits | Usually fine (can adjust `inotify`) | May need `kern.maxfiles` increase | Antivirus may interfere |
| Line endings | `LF` | `LF` | `CRLF` — set `core.autocrlf=true` |

---

### Getting help

- **Node.js docs:** https://nodejs.org/docs/
- **npm docs:** https://docs.npmjs.com/
- **PostgreSQL docs:** https://www.postgresql.org/docs/16/
- **Prisma docs:** https://www.prisma.io/docs
- **Vite docs:** https://vite.dev/guide/
- **React docs:** https://react.dev/
- **Express docs:** https://expressjs.com/
- **TypeScript docs:** https://www.typescriptlang.org/docs/

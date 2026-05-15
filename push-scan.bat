@echo off
cd /d C:\Plume_code\website\SAV\.claude\worktrees\musing-engelbart-b58a6c
git add -A
git commit -m "feat(school): confirm wing reception by QR scan - bypass shipping step"
cd /d C:\Plume_code\website\SAV
git merge claude/musing-engelbart-b58a6c --no-edit
git push origin main

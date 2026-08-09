#!/usr/bin/env bash
# git commit の前に npm run verify を走らせ、失敗したらコミットを止める。
# 理由は docs/workflow.md「main 直コミットの前提条件」を参照。

command=$(node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.parse(d).tool_input.command ?? ''))")

case "$command" in
  *'git commit'*) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 1

# .nvmrc のバージョンで検証する。CI と同じ Node で通ったことを保証するため。
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use >/dev/null

if output=$(npm run verify 2>&1); then
  exit 0
fi

printf 'npm run verify が失敗したため、コミットを中止した。\n\n%s\n' "$output" >&2
exit 2

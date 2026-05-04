#!/bin/bash
# Claude Code Stop hook: 작업 종료 시 자동 커밋 (push는 하지 않음)

set -e

# stdin으로 들어오는 hook 이벤트 JSON 읽기
HOOK_INPUT=$(cat)

# 무한 루프 방지: 이미 stop_hook이 한 번 실행된 상태면 종료
STOP_HOOK_ACTIVE=$(echo "$HOOK_INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# 프로젝트 루트로 이동
cd "$CLAUDE_PROJECT_DIR" || exit 0

# git 저장소가 아니면 조용히 종료
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  exit 0
fi

# 변경사항이 없으면 종료
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

# 모든 변경사항 스테이징
git add -A

# 스테이징 후에도 변경이 없으면 종료
if git diff --cached --quiet; then
  exit 0
fi

# 변경된 파일 목록으로 커밋 메시지 생성
CHANGED_FILES=$(git diff --cached --name-only | head -3 | tr '\n' ', ' | sed 's/, $//')
FILE_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

COMMIT_MSG="auto: ${CHANGED_FILES} (${FILE_COUNT} files) - ${TIMESTAMP}

Auto-committed by Claude Code Stop hook"

# 커밋 (실패해도 Claude를 막지 않도록 || true)
git commit -m "$COMMIT_MSG" 2>/dev/null || true

exit 0

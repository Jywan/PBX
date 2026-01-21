#!/bin/bash

# 1. 스크립트가 있는 위치(services/api)로 이동
cd "$(dirname "$0")"

# 2. PYTHONPATH에 상위 libs 폴더 추가 (안전장치)
export PYTHONPATH=$PYTHONPATH:../../libs

echo "Starting PBX API Server..."

# 3. 통합 가상환경의 uvicorn으로 실행
# --reload: 코드 수정 시 자동 재시작 (개발용)
../../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
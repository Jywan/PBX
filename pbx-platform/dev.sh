#!/bin/bash

# 종료(Ctrl+C) 시 실행된 프로세스들을 모두 죽이는 안전장치
trap "kill 0" EXIT

echo "Starting PBX Platform (API + ARI Worker)..."

# 1. API 서버 백그라운드(&) 실행
./services/api/run.sh &

# 2. ARI Worker 백그라운드(&) 실행
./services/ari-worker/run.sh &

# 3. 모든 프로세스가 끝날 때까지 대기
wait
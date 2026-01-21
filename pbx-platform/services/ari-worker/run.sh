#!/bin/bash

# 1. 스크립트가 있는 위치로 이동
cd "$(dirname "$0")"

# 2. PYTHONPATH에 상위 libs 폴더 추가
export PYTHONPATH=$PYTHONPATH:../../libs

echo "Staring ARI Worker..."

../../.venv/bin/python -m app.main
## asterisk 서버 설정

# 사용환경
- macboock m4 pro 
- VMware Fusion
- ubuntu 24.0.3 사용
- Asterisk 20.6.0

# ubuntu ip 확인 필수

# 콜테스트 환경
- zoiper, linphone 
- 참고사항: 두 어플리케이션은 웹에서 다운로드 받아서 사용하는것을 추천함 특히 zoiper를 appStore에서 다운로드받고 콜테스트 발신시 무한로딩 이슈가 있음. 

# ubuntu 내 asterisk 설정
1. sudo apt update
2. sudo apt upgrade -y
3. sudo apt install -y asterisk


## ari-collector 

# 사용 언어, 라이브러리
- python 3.9.6
- start: source .venv/bin/activate
- lib: websockets(ARI 이벤트 수신), aiohttp(ARI REST 호출용), python-dotenv(환경변수 관리)

# ari-worker
- run: python app/main.py




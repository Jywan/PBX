# PBX 콜센터 플랫폼

Asterisk 기반 콜센터 관리 시스템입니다.
ARI(Asterisk REST Interface)를 통해 통화 이벤트를 실시간으로 처리하고, 상담원 상태 관리 및 통화 기록을 제공합니다.

---

## 사용 환경

- macOS (Apple Silicon M4 Pro)
- Docker (Asterisk 서버, PostgreSQL)
- Asterisk 20 LTS (Ubuntu 24.04 기반 Docker 이미지로 빌드)

---

## 기술 스택

| 계층 | 기술 |
|---|---|
| **Backend** | Python 3.9+, FastAPI 0.110+ |
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Database** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Async Driver** | asyncpg |
| **State Management** | Zustand |
| **HTTP Client** | Axios |
| **Styling** | Tailwind CSS 4, CSS Modules |
| **Icons** | lucide-react |
| **VoIP** | Asterisk 20, PJSIP, SIP |

---

## 프로젝트 구조

> **주의**: `asterisk/` 디렉토리와 `docker-compose.yml`, `Dockerfile`, `.env`는 `.gitignore`에 등록되어 있어 저장소에 포함되지 않습니다.
> 아래 [Asterisk 설정 파일](#asterisk-설정-파일gitignore-적용) 섹션을 참고하여 직접 생성해야 합니다.

```
PBX_asterisk/
├── asterisk/                    # ⚠️ gitignore 적용 - 직접 생성 필요
│   ├── ari.conf                 # ARI 모듈 설정
│   ├── extensions.conf          # 내선 설정
│   ├── http.conf                # HTTP 서버 설정
│   └── pjsip.conf               # PJSIP 프로토콜 설정
├── pbx-platform/
│   ├── docker-compose.yml       # PostgreSQL 컨테이너 정의
│   ├── Dockerfile               # Asterisk Docker 이미지
│   ├── dev.sh                   # 전체 서비스 동시 실행 스크립트
│   ├── .env                     # 환경변수 설정
│   ├── libs/
│   │   └── pbx_common/          # API·ARI Worker 공유 라이브러리
│   │       ├── models/          # SQLAlchemy ORM 모델
│   │       └── utils/           # 보안, 암호화 유틸
│   └── services/
│       ├── api/                 # FastAPI 백엔드
│       ├── ari-worker/          # Asterisk ARI WebSocket 워커
│       └── frontend/            # Next.js 프론트엔드
└── README.md
```

---

## 서비스 구성

### 1. API 서버 (`services/api`)
FastAPI 기반 REST API 서버입니다.

| 라우트 | 설명 |
|---|---|
| `POST /api/v1/auth/login` | 로그인 (Rate Limit: 5/minute) |
| `POST /api/v1/auth/logout` | 로그아웃 |
| `PATCH /api/v1/auth/activity` | 상담원 활동 상태 변경 |
| `GET/POST /api/v1/users` | 사용자 조회 및 생성 |
| `GET/PATCH/DELETE /api/v1/users/{id}` | 사용자 상세 관리 |
| `GET/POST /api/v1/companies` | 업체 조회 및 생성 |
| `GET /api/v1/calls` | 통화 기록 조회 |
| `WS /ws/signaling` | WebRTC 시그널링 (WebSocket) |

### 2. ARI Worker (`services/ari-worker`)
Asterisk ARI WebSocket 이벤트를 수신하여 통화 기록을 처리합니다.

- Asterisk ARI WebSocket 연결 및 이벤트 수신
- 통화 시작/종료/이벤트 파싱 및 DB 기록
- 연결 끊김 시 자동 재연결 (3초 딜레이)

### 3. Frontend (`services/frontend`)
Next.js 기반 콜센터 관리 UI입니다.

| 페이지 | 설명 |
|---|---|
| 로그인 | JWT 기반 인증 |
| 대시보드 | 메인 화면 |
| 사용자 관리 | 상담원 CRUD, 권한 관리 |
| 업체 관리 | 업체 정보 CRUD (SYSTEM_ADMIN 전용) |
| 통화 기록 | 통화 이력 조회 |

---

## 데이터 모델

### 사용자 역할 (Role)
| 코드 | 설명 |
|---|---|
| `SYSTEM_ADMIN` | 시스템 관리자 - 전체 접근 |
| `MANAGER` | 관리자 - 소속 업체 관리 |
| `AGENT` | 상담원 - 기본 기능 |

### 상담원 활동 상태 (Activity)
| 상태 | 설명 |
|---|---|
| `READY` | 대기중 |
| `POST_PROCESSING` | 후처리 |
| `CALLING` | 통화 연결중 |
| `ON_CALL` | 통화중 |
| `AWAY` | 이석 |
| `TRAINING` | 교육 |
| `DISABLED` | 비활성화 |

---

## 보안

- **비밀번호**: SHA-256 + bcrypt + pepper 적용
- **민감 데이터 암호화**: AES 암호화 (전화번호, 사업자번호, 팩스 등)
- **JWT**: HS256, 10시간 유효
- **Rate Limiting**: 로그인 5회/분 제한
- **RBAC**: 역할 기반 접근 제어
- **보안 헤더**: CSP, X-Frame-Options, X-XSS-Protection 등
- **CORS**: 허용 도메인 제한

---

## 환경 설정

`/pbx-platform/.env` 파일을 생성합니다.

```env
# Asterisk ARI
ARI_HOST=<asterisk_server_ip>
ARI_PORT=8088
ARI_USER=ari-user
ARI_PASS=<password>
ARI_APP=pbx_ari

# Database
DATABASE_URL=postgresql+asyncpg://pbx:<your-db-password>@localhost:5432/pbx

# Security
PASSWORD_PEPPER=<random_string>
ENCRYPTION_KEY=<fernet_key>
JWT_SECRET_KEY=<random_string>
ALGORITHM=HS256

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 실행 방법

### 1. PostgreSQL 실행

```bash
cd pbx-platform
docker compose up -d
```

### 2. 전체 서비스 동시 실행 (개발)

```bash
cd pbx-platform
./dev.sh
```

### 3. 개별 서비스 실행

**API 서버**
```bash
cd pbx-platform/services/api
./run.sh
# → http://localhost:8000
```

**ARI Worker**
```bash
cd pbx-platform/services/ari-worker
./run.sh
```

**Frontend**
```bash
cd pbx-platform/services/frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Asterisk 설정 파일(gitignore 적용)

`asterisk/` 디렉토리는 gitignore에 등록되어 있으므로, 프로젝트 루트에 직접 생성해야 합니다.

### `asterisk/ari.conf`
Asterisk ARI 모듈 활성화 및 사용자 설정입니다.

```ini
[general]
enabled = yes

[ari-user]
type = user
read_only = no
password = <your-ari-password>   ; .env의 ARI_PASS와 일치해야 함
```

### `asterisk/http.conf`
ARI가 사용하는 HTTP 서버 설정입니다.

```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
```

### `asterisk/extensions.conf`
내선 다이얼플랜 설정입니다. `10XX` 패턴의 내선번호를 ARI 앱으로 연결합니다.

```ini
[general]
static=yes
writeprotect=no
clearglobalvars=no

[internal]
exten => _10XX,1,NoOp(Internal call to ${EXTEN})
 same => n,Stasis(pbx_ari,${EXTEN})    ; ARI 앱 이름은 .env의 ARI_APP과 일치해야 함
 same => n,Hangup()
```

### `asterisk/pjsip.conf`
SIP 엔드포인트(내선) 설정입니다. 내선을 추가하려면 아래 패턴을 반복합니다.

```ini
; ---------- TRANSPORT ----------
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060

; ---------- 내선 1000 ----------
[1000-auth]
type=auth
auth_type=userpass
username=1000
password=<your-sip-password>

[1000]
type=aor
max_contacts=1
remove_existing=yes

[1000]
type=endpoint
context=internal
disallow=all
allow=ulaw
auth=1000-auth
aors=1000
direct_media=no

; ---------- 내선 1001 ----------
[1001-auth]
type=auth
auth_type=userpass
username=1001
password=<your-sip-password>

[1001]
type=aor
max_contacts=1
remove_existing=yes

[1001]
type=endpoint
context=internal
disallow=all
allow=ulaw
auth=1001-auth
aors=1001
direct_media=no
```

> 내선을 추가할 때는 `1002`, `1003` 등 같은 패턴으로 반복 작성합니다.

설정 파일 복사 후 Asterisk 서버에서 적용:

```bash
# Ubuntu Asterisk 서버 기준
sudo cp asterisk/*.conf /etc/asterisk/
sudo asterisk -rx "core reload"
```

---

## Asterisk 서버 (Docker)

`Dockerfile`과 `docker-compose.yml`은 `.gitignore`에 등록되어 있으므로 직접 생성해야 합니다.

### `pbx-platform/Dockerfile`

Ubuntu 24.04 기반으로 Asterisk 20 LTS를 소스 빌드합니다.

```dockerfile
FROM ubuntu:24.04

LABEL maintainer="컨테이너명"

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul

RUN apt-get update && apt-get install -y \
    wget curl build-essential git subversion \
    libnewt-dev libssl-dev libncurses5-dev \
    libsqlite3-dev libjansson-dev libxml2-dev \
    uuid-dev bison flex aptitude tzdata \
    libedit-dev libtool libdaemon-dev libasound2-dev \
    libogg-dev libvorbis-dev libspeex-dev \
    libspeexdsp-dev libgsm1-dev libsrtp2-dev \
    vim openssh-server \
    && rm -rf /var/lib/apt/lists/*

# SSH 설정: root 로그인 허용
RUN mkdir /var/run/sshd
# 비밀번호는 별도 생성후 반영
RUN echo 'root:<비밀번호>' | chpasswd 
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# Asterisk 20 LTS 소스 다운로드 및 빌드
WORKDIR /usr/src
RUN wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz \
    && tar zxf asterisk-20-current.tar.gz \
    && rm asterisk-20-current.tar.gz

RUN cd asterisk-20.*/ && \
    ./configure --with-jansson-bundled && \
    make menuselect.makeopts && \
    make -j$(nproc) && \
    make install && \
    make samples && \
    make config

# 포트: SSH(22), SIP(5060/udp), RTP(10000-10100/udp)
EXPOSE 22 5060/udp 10000-10100/udp

# SSH + Asterisk 동시 실행
CMD service ssh start && /usr/sbin/asterisk -fvvvin
```

### `pbx-platform/docker-compose.yml`

PostgreSQL 컨테이너 정의입니다.

```yaml
services:
  postgres:
    image: postgres:16
    container_name: pbx-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: pbx
      POSTGRES_USER: pbx
      POSTGRES_PASSWORD: <your-db-password>
      TZ: Asia/Seoul
    ports:
      - "5432:5432"
    volumes:
      - pbx_pgdata:/var/lib/postgresql/data

volumes:
  pbx_pgdata:
```

### 빌드 및 실행

```bash
cd pbx-platform

# 1. Asterisk 이미지 빌드 (최초 1회, 시간 소요)
docker build --no-cache -t my-asterisk:24.04 .

# 2. Asterisk 컨테이너 실행
docker run -d \
  --name asterisk-server \
  -p 2222:22 \
  -p 5060:5060/udp \
  -p 10000-10100:10000-10100/udp \
  --restart always \
  my-asterisk:24.04

# 3. Asterisk 설정 파일 복사 (asterisk/ 디렉토리 파일들)
docker cp ../asterisk/ari.conf asterisk-server:/etc/asterisk/ari.conf
docker cp ../asterisk/http.conf asterisk-server:/etc/asterisk/http.conf
docker cp ../asterisk/extensions.conf asterisk-server:/etc/asterisk/extensions.conf
docker cp ../asterisk/pjsip.conf asterisk-server:/etc/asterisk/pjsip.conf

# 4. Asterisk 설정 리로드
docker exec asterisk-server asterisk -rx "core reload"

# 5. PostgreSQL 실행
docker compose up -d

# 컨테이너 접속 (필요 시)
docker exec -it asterisk-server bash
```

---

## 콜 테스트 환경

SIP 소프트폰을 사용하여 내선 통화를 테스트합니다.

- **Zoiper** 또는 **Linphone** 사용 권장
- Zoiper는 반드시 **웹사이트에서 다운로드** (App Store 버전은 발신 시 무한 로딩 이슈 있음)

---

## Frontend 주요 의존성

```bash
npm install axios js-cookie zustand lucide-react
npm install --save-dev @types/js-cookie
```

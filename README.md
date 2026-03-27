# PBX Platform

Asterisk 20 기반 콜센터 PBX 플랫폼. 내선 관리, IVR, 큐, 고객 관리, 상담 이력을 통합 제공하는 멀티 테넌트 SaaS.

---

## 아키텍처

```
pbx-platform/
├── services/
│   ├── frontend/        # Next.js 16 + TypeScript
│   ├── api/             # FastAPI (Python async)
│   └── ari-worker/      # Asterisk ARI WebSocket Worker
├── libs/
│   └── pbx_common/      # 공유 SQLAlchemy 모델 & 유틸리티
├── docker-compose.yml   # PostgreSQL 16
├── Dockerfile           # Asterisk 20 LTS
└── dev.sh               # 개발 서버 일괄 기동
```

### 서비스별 역할

| 서비스 | 기술 | 역할 |
|--------|------|------|
| frontend | Next.js 16, React 19, TypeScript | 관리자 웹 UI |
| api | FastAPI, SQLAlchemy 2 (async), Alembic | REST API 서버 |
| ari-worker | Python asyncio, websockets, httpx | Asterisk ARI 이벤트 처리 |
| pbx_common | SQLAlchemy ORM | 공유 DB 모델 라이브러리 |

---

## 기술 스택

### Frontend
- **Next.js** 16 (App Router, `"use client"`)
- **React** 19.2
- **TypeScript** 5
- **Zustand** 5 — 전역 상태 (권한, 활동상태)
- **Axios** 1.13 — HTTP 클라이언트 (인터셉터로 403 시 권한 자동 갱신)
- **CSS Modules** — 컴포넌트 단위 스타일링
- **GoJS** — IVR 트리 다이어그램
- **Lucide React** — 아이콘

### Backend
- **FastAPI** — REST API
- **SQLAlchemy** 2 (async) — ORM
- **Alembic** — DB 마이그레이션
- **PostgreSQL** 16
- **JWT (HS256)** — 인증 (10시간 만료)
- **Bcrypt + Pepper + SHA-256** — 비밀번호 해싱
- **slowapi** — Rate Limiting

### Infra / PBX
- **Asterisk 20 LTS** — PBX 엔진 (PostgreSQL `res_config_pgsql`)
- **Docker / Docker Compose**

---

## 개발 환경 실행

```bash
# PostgreSQL 컨테이너 기동
docker compose -f pbx-platform/docker-compose.yml up -d

# API + ARI Worker 동시 실행
cd pbx-platform && sh dev.sh

# 프론트엔드만
cd pbx-platform/services/frontend && npm run dev

# 백엔드만
cd pbx-platform/services/api && uvicorn app.main:app --reload
```

### 환경변수 (.env)

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL async URL |
| `JWT_SECRET` | JWT 서명 키 |
| `JWT_ALGORITHM` | `HS256` |
| `PASSWORD_PEPPER` | 비밀번호 해싱 pepper 값 |
| `ENCRYPTION_KEY` | 암호화 키 |
| `ARI_HOST` / `ARI_PORT` | Asterisk ARI 호스트/포트 |
| `ARI_USER` / `ARI_PASS` | ARI 인증 정보 |
| `FRONTEND_CORS_URL` | 허용 CORS 출처 |

---

## DB 모델

> 위치: `pbx-platform/libs/pbx_common/models/`

### company (테넌트)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| company_name | Text | 회사명 |
| manager_name | Text | 담당자명 |
| manager_phone | Text | 담당자 전화 |
| use_callback | Boolean | 콜백 사용 여부 |
| is_active | Boolean | 활성화 |
| business_number | Text | 사업자번호 |
| created_at | TIMESTAMP | |

### user
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| company_id | FK → company | |
| account | Text | 로그인 계정 |
| account_pw | Text | Bcrypt 해시 |
| exten | Text | 내선 번호 |
| name | Text | 이름 |
| role | Enum | SYSTEM_ADMIN / MANAGER / AGENT |
| is_active | Boolean | |
| created_at | TIMESTAMP | |

### customer (고객)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| company_id | FK → company | |
| name | Text | 이름 |
| phone | Text | 전화번호 (하이픈 없이 저장) |
| email | Text | |
| group | Enum | vip / normal / blacklist |
| memo | Text | |
| is_active | Boolean | Soft delete |
| last_call_at | TIMESTAMP | 최근 통화 시각 |
| created_at | TIMESTAMP | |

### calls (통화 기록)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| caller_exten | Text | 발신 내선 |
| callee_exten | Text | 수신 내선 |
| caller_channel_id | Text | Asterisk 채널 ID |
| bridge_id | Text | 브릿지 ID |
| started_at | TIMESTAMP | 통화 시작 |
| answered_at | TIMESTAMP | 연결 시각 |
| ended_at | TIMESTAMP | 종료 시각 |
| hangup_cause | Text | 종료 코드 |
| direction | Text | inbound / outbound |
| status | Text | |

### call_events (ARI 이벤트 로그)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BigInteger PK | |
| call_id | FK → calls | |
| ts | TIMESTAMP | 이벤트 발생 시각 |
| type | Text | StasisStart 등 |
| channel_id | Text | |
| raw | JSONB | 원본 ARI 이벤트 |

### queues (콜 큐)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| company_id | FK → company | |
| name | Text | |
| strategy | Text | rrmemory 등 |
| timeout | Integer | 링 타임아웃 (초) |
| wrapuptime | Integer | 후처리 시간 |
| maxlen | Integer | 최대 대기 수 |
| is_active | Boolean | |

### queue_members (큐 멤버)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| queue_id | FK → queues | |
| user_id | FK → user | |
| interface | Text | `PJSIP/{exten}` |
| penalty | Integer | 우선순위 |
| paused | Boolean | |

### ivr_flows (IVR 흐름)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| name | Text | |
| company_id | FK → company | |
| is_preset | Boolean | 공용 프리셋 여부 |
| is_active | Boolean | |

### ivr_nodes (IVR 노드 트리)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| flow_id | FK → ivr_flows | |
| parent_id | FK → ivr_nodes | 자기 참조 트리 구조 |
| queue_id | FK → queues | 큐 연결 노드용 |
| dtmf_key | Text | 버튼 입력값 (0-9, *, #) |
| node_type | Text | menu / action / queue 등 |
| name | Text | |
| config | JSONB | 노드별 설정 |
| sort_order | Integer | |

### ivr_sounds (IVR 음성 파일)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| node_id | FK → ivr_nodes (unique) | 노드당 1개 |
| name | Text | |
| filename | Text (unique) | 저장 파일명 |
| original_filename | Text | 업로드 원본명 |

### consultations (상담 이력)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BigInteger PK | |
| call_id | FK → calls | |
| agent_id | FK → user | |
| company_id | FK → company | |
| original_id | FK → consultations | 수정 이전 버전 참조 |
| category_id | FK → consult_categories | |
| memo | Text | |
| status | Enum | ACTIVE / INACTIVE / SUPERSEDED |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | |

> 수정 시 기존 레코드를 `SUPERSEDED`로 변경하고 새 레코드를 `ACTIVE`로 생성 → 버전 이력 보존

### consult_categories (상담 분류)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| company_id | FK → company | |
| parent_id | FK → consult_categories | 3단계 계층 구조 |
| name | Text | |
| depth | Integer | 0 / 1 / 2 |
| sort_order | Integer | |
| is_active | Boolean | |

### permissions (권한)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| parent_id | FK → permissions | 계층 구조 |
| code | Text (unique) | 권한 코드 (예: `customer-create`) |
| name | Text | |
| type | Enum | MENU / ACTION |
| is_active | Boolean | |

### user_status (사용자 실시간 상태)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | PK/FK → user | |
| login_status | Enum | LOGIN / LOGOUT |
| activity | Enum | READY / POST_PROCESSING / CALLING / ON_CALL / AWAY / TRAINING / DISABLED |
| last_login_at | TIMESTAMP | |

### user_status_log (활동 이력)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BigInteger PK | |
| user_id | FK → user | |
| login_status | Enum | |
| activity | Enum | |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | |
| duration | Integer | 초 단위 |

---

## API 엔드포인트

> Base URL: `http://localhost:8000`
> 인증 필요 엔드포인트: `Authorization: Bearer <token>` 헤더 필수

### 인증 `/api/v1/auth`
| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/login` | 없음 (Rate: 5/min) | 로그인 → JWT 발급 |
| POST | `/logout` | 인증 | 로그아웃 + 상태 로그 기록 |
| PATCH | `/activity` | 인증 | 활동 상태 변경 |
| GET | `/me/permissions` | 인증 | 내 권한 코드 목록 조회 |

### 사용자 `/api/v1/users`
| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/` | SYSTEM_ADMIN | 사용자 생성 + PJSIP 자동 등록 |
| GET | `/` | 인증 | 사용자 목록 (역할별 필터) |
| PATCH | `/{user_id}` | 인증 | 사용자 수정 + 내선 변경 시 PJSIP 동기화 |
| DELETE | `/{user_id}` | SYSTEM_ADMIN | 비활성화 (Soft delete) |
| PATCH | `/{user_id}/restore` | SYSTEM_ADMIN | 재활성화 |
| GET | `/{user_id}/permissions` | 인증 | 사용자 권한 ID 목록 |

### 고객 `/api/v1/customers`
| Method | Path | 권한 코드 | 설명 |
|--------|------|-----------|------|
| GET | `/` | `customer-search` | 목록 조회 (group, search 필터, 최대 200건) |
| POST | `/` | `customer-create` | 생성 |
| PATCH | `/{customer_id}` | `customer-update` | 수정 |
| DELETE | `/{customer_id}` | `customer-delete` | Soft delete |

> `GET /?search=<keyword>` — 이름, 전화번호, 회사명으로 in-memory 검색

### 큐 `/api/v1/queues`
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 큐 목록 (멤버 포함) |
| POST | `/` | 큐 생성 |
| GET | `/{queue_id}` | 큐 상세 |
| PATCH | `/{queue_id}` | 큐 수정 |
| DELETE | `/{queue_id}` | 큐 삭제 |
| POST | `/{queue_id}/members` | 멤버 추가 |
| PATCH | `/{queue_id}/members/{member_id}` | 멤버 수정 |
| DELETE | `/{queue_id}/members/{member_id}` | 멤버 제거 |

### IVR `/api/v1/ivr`
| Method | Path | 권한 코드 | 설명 |
|--------|------|-----------|------|
| GET | `/flows` | `ivr-detail` | 플로우 목록 (company_id, include_presets 필터) |
| POST | `/flows` | 인증 | 플로우 생성 |
| GET | `/flows/{flow_id}` | 인증 | 플로우 + 노드 트리 조회 |
| PATCH | `/flows/{flow_id}` | 인증 | 플로우 수정 |
| POST | `/flows/{flow_id}/nodes` | 인증 | 노드 추가 |
| PATCH | `/flows/{flow_id}/nodes/{node_id}` | 인증 | 노드 수정 |
| DELETE | `/flows/{flow_id}/nodes/{node_id}` | 인증 | 노드 삭제 |
| POST | `/flows/{flow_id}/nodes/{node_id}/sound` | 인증 | 음성 파일 업로드 |
| DELETE | `/flows/{flow_id}/nodes/{node_id}/sound` | 인증 | 음성 파일 삭제 |

### 상담 `/api/v1/consults`
| Method | Path | 권한 코드 | 설명 |
|--------|------|-----------|------|
| GET | `/` | `consult-list` | 목록 (date_from, date_to, agent_id, company_id, status 필터) |
| POST | `/` | `consult-create` | 생성 |
| PATCH | `/{consult_id}` | `consult-update` | 수정 (기존 SUPERSEDED → 신규 ACTIVE) |
| DELETE | `/{consult_id}` | `consult-delete` | Soft delete (INACTIVE) |
| GET | `/categories` | 인증 | 분류 목록 |
| POST | `/categories` | 인증 | 분류 생성 |

### 회사 `/api/v1/companies`
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 회사 목록 |
| POST | `/` | 회사 생성 |
| PATCH | `/{company_id}` | 수정 |
| DELETE | `/{company_id}` | 비활성화 |

### 권한 `/api/v1/permissions`
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 권한 트리 조회 |
| POST | `/users/{user_id}/permissions` | 사용자 권한 일괄 설정 |

### 실시간 시그널링 `/api/v1/signaling`
- WebSocket 연결로 실시간 이벤트 수신

---

## 권한 시스템

### 역할 (Role)
| 역할 | 설명 |
|------|------|
| `SYSTEM_ADMIN` | 전체 시스템 관리자 |
| `MANAGER` | 회사 내 관리자 |
| `AGENT` | 상담원 |

### 주요 권한 코드 (Permission Code)

```
customer            # 고객 관리 메뉴 접근
  customer-search   # 고객 조회
  customer-create   # 고객 생성
  customer-update   # 고객 수정
  customer-delete   # 고객 삭제

consult-list        # 상담 이력 조회
consult-create      # 상담 생성
consult-update      # 상담 수정
consult-delete      # 상담 삭제

ivr-detail          # IVR 조회
```

### 보안 헤더
- `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`

---

## Frontend 구조

```
services/frontend/
├── app/                   # Next.js App Router
│   ├── login/             # 로그인 페이지
│   └── (protected)/       # 인증 필요 페이지들
├── components/
│   ├── layout/            # Header, Sidebar, Footer
│   ├── common/            # Toast, ConfirmModal, Pagination
│   ├── templates/         # 페이지 단위 템플릿 컴포넌트
│   ├── user/              # 사용자 관리 컴포넌트
│   ├── company/           # 회사 관리 컴포넌트
│   ├── customer/          # 고객 관리 컴포넌트
│   ├── queue/             # 큐 관리 컴포넌트
│   ├── ivr/               # IVR 관리 컴포넌트 (GoJS 트리)
│   ├── consult/           # 상담 처리 컴포넌트
│   └── history/           # 이력 조회 컴포넌트
├── hooks/                 # 커스텀 훅
├── lib/
│   ├── api/               # API 호출 레이어 (Axios)
│   ├── auth.ts            # JWT 파싱, 권한 체크
│   └── utils/             # date.ts, validation.ts 등
├── store/
│   └── authStore.ts       # Zustand (권한 + 활동 상태)
├── styles/                # CSS 모듈
└── types/                 # TypeScript 타입 정의
```

### 주요 커스텀 훅

| 훅 | 반환값 | 설명 |
|----|--------|------|
| `useAuth()` | `token, isSystemAdmin, companyId, isLoading` | 쿠키에서 JWT 파싱 |
| `useToast()` | `toast, showToast` | Toast 알림 (success/error) |
| `useConfirmModal()` | `isOpen, message, onConfirm, openConfirm, closeConfirm` | 확인 모달 |
| `useCustomerData()` | 고객 상태 + CRUD 핸들러 | 고객 관리 전체 로직 |
| `useConsultData()` | 대기열, 타이머, 고객 자동조회 | 상담 처리 로직 |
| `useIvrData()` | 플로우/노드 상태 + 핸들러 | IVR 관리 로직 |
| `useQueueData()` | 큐 상태 + 핸들러 | 큐 관리 로직 |
| `useHistoryData()` | 이력 목록 + 필터 | 상담/통화 이력 조회 |

### 날짜 포맷 유틸리티 (`lib/utils/date.ts`)

| 함수 | 출력 예시 | 용도 |
|------|-----------|------|
| `formatDateTime(dt)` | `2026.02.12 10:30:00` | 날짜+시간 |
| `formatDateOnly(dt)` | `2026.02.12` | 날짜만 |
| `formatTimeOnly(dt)` | `10:30:00` | 시간만 |
| `formatRelativeTime(dt)` | `2일 전` | 상대 시간 |
| `calcDuration(start, end)` | `5분 23초` | 통화 시간 계산 |
| `formatTimer(sec)` | `05:23` | 통화 타이머 |

---

## ARI Worker 처리 흐름

```
Asterisk ARI WebSocket
        ↓
    parser.py
  ParsedEvent 파싱
        ↓
  call_service.py
  ┌─────────────────────────────────────────┐
  │  StasisStart       → 신규 채널 추적 시작 │
  │  ChannelStateChange → 통화 상태 업데이트 │
  │  BridgeCreated     → 브릿지 생성 기록    │
  │  ChannelLeftBridge → 통화 종료 처리      │
  └─────────────────────────────────────────┘
        ↓
  call_recorder.py
  PostgreSQL 저장 (calls, call_events)
```

---

## 로그인 흐름

```
1. POST /api/v1/auth/login
   └─ pepper + SHA-256 + Bcrypt 검증
   └─ JWT 생성 { sub, name, role, id, company_id, exp(10h) }
   └─ user_status: LOGIN + READY
   └─ user_status_log: 시작 기록

2. 프론트엔드
   └─ 토큰 → js-cookie 저장
   └─ 권한 → Zustand authStore (10시간 TTL)

3. 이후 API 요청
   └─ Authorization: Bearer <token>
   └─ 403 응답 시 /auth/me/permissions 재조회 (Axios 인터셉터)
```

---

## 고객 관리 접근 제어 로직

- **시스템 관리자**: 전체 고객 조회, 회사 셀렉트박스로 필터 가능
- **일반 계정**: 자신의 `company_id`에 해당하는 고객만 in-memory 자동 필터
- 그룹 필터: `vip` / `normal` / `blacklist` / `all`
- 검색: 이름 + 전화번호 (부분 일치)

---

## 상담 처리 흐름

```
1. 대기 콜 수신 (waitingCalls — ARI WebSocket 연동 예정)
2. 상담원이 콜 선택
   └─ 전화번호로 고객 테이블 자동 조회 (GET /customers?search=<phone>)
   └─ 정확한 전화번호 일치 확인
   └─ 고객 발견 → 프로필 패널 표시
   └─ 미등록 → 등록 폼 표시 (이름 공란 시 "임시" 자동 설정, 전화번호 필수)
3. 통화 진행 (타이머 카운트업)
4. 상담 메모 + 카테고리 선택 (3단계 계층)
5. 저장: POST /api/v1/consults
6. 통화 종료: 대기열에서 제거
```

---

## IVR 노드 타입

| node_type | 설명 |
|-----------|------|
| `menu` | DTMF 입력 분기 메뉴 |
| `action` | 특정 동작 수행 |
| `queue` | 큐로 연결 |

- 트리 구조: `parent_id` 자기 참조 (재귀 cascade delete)
- 프리셋 플로우 (`is_preset=true`): 전체 회사 공용 사용 가능
- 음성 파일: 노드당 1개, 서버 파일시스템 저장

---

## 상담 수정 버전 관리

상담 이력 수정 시 원본 데이터 보존을 위해 버전 체인 방식 사용:

```
수정 요청 시:
  1. 기존 consultation.status → SUPERSEDED
  2. 새 consultation 생성 (original_id = 기존 id, status = ACTIVE)

삭제 요청 시:
  1. consultation.status → INACTIVE

목록 조회 기본값:
  - INACTIVE 제외 (ACTIVE + SUPERSEDED 포함)
  - status 파라미터로 특정 상태만 조회 가능
```

---

## 코드 규칙

- API 호출은 반드시 `lib/api/` 레이어 경유
- 인증 정보는 `useAuth()` 훅 사용 (Cookies 직접 접근 금지)
- Toast: `useToast()` + `<Toast />` 컴포넌트 사용
- 날짜 포맷: `lib/utils/date.ts` 함수 사용 (직접 `new Date()` 포맷 금지)
- 커밋 전 `npm run lint` 통과 필수
- 컴포넌트 책임 분리: template → feature 컴포넌트 → 훅

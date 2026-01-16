from __future__ import annotations

import os 
from dataclasses import dataclass
from dotenv import load_dotenv

@dataclass(frozen=True)
class Settings:
    ari_host: str
    ari_port: str
    ari_app: str
    ari_user: str
    ari_pass: str

    @property
    def ari_base(self) -> str:
        return f"http://{self.ari_host}:{self.ari_port}/ari"
    
    @property
    def api_key(self) -> str:
        return f"{self.ari_user}:{self.ari_pass}"
    
    @property
    def ws_url(self) -> str:
        return (
            f"ws://{self.ari_host}:{self.ari_port}/ari/events"
            f"?app={self.ari_app}&api_key={self.api_key}"
        )
    
def load_settings() -> Settings:
    load_dotenv()

    s = Settings(
        ari_host = os.getenv("ARI_HOST", "").strip(),
        ari_port = os.getenv("ARI_PORT", "8088").strip(),
        ari_app = os.getenv("ARI_APP", "").strip(),
        ari_user = os.getenv("ARI_USER", "").strip(),
        ari_pass = os.getenv("ARI_PASS", "").strip(),
    )

    missing = [k for k, v in {
        "ARI_HOST": s.ari_host,
        "ARI_APP": s.ari_app,
        "ARI_USER": s.ari_user,
        "ARI_PASS": s.ari_pass,
    }.items() if not v]

    if missing:
        raise SystemExit(f"Missing env: {', '.join(missing)} (check .env)")
    
    return s

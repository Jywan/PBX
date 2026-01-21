from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

@dataclass(frozen=True)
class ParsedEvent:
    etype: str
    timestamp: Optional[str]
    channel_id: Optional[str]
    channel_name: Optional[str]
    app_name: Optional[str]
    app_args: list[str]
    raw: dict[str, Any]


def _split_app_data(app_data: Optional[str]) -> tuple[Optional[str], list[str]]:
    if not isinstance(app_data, str) or not app_data.strip():
        return None, []
    
    parts = [p.strip() for p in app_data.split(",") if p.strip()]
    if not parts:
        return None, []
    
    app_name = parts[0]
    args = parts[1:]
    return app_name, args

def parse_event(event: dict[str, Any]) -> ParsedEvent:
    etype = event.get("type")
    ts = event.get("timestamp")

    channel = event.get("channel") or {}
    chan_id = channel.get("id")
    chan_name = channel.get("name")
    
    app_name = event.get("application")
    app_args = event.get("args")

    if not app_args or not isinstance(app_args, list):
        dialplan = channel.get("dialplan") or {}
        app_data = dialplan.get("app_data")

        parsed_name, parsed_args = _split_app_data(app_data)

        if not app_name:
            app_name = parsed_name
        if not app_args:
            app_args = parsed_args

    return ParsedEvent(
        etype=etype,
        timestamp=ts,
        channel_id=chan_id,
        channel_name=chan_name,
        app_name=app_name,
        app_args=app_args or [],
        raw=event,
    )
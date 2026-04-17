"""Structured JSON logging with sensitive-field masking."""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

_PASSPORT_RE = re.compile(r"\b[A-Z]{1,2}\d{7,8}\b")
_PHONE_RE = re.compile(r"\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b")


def _mask(text: str) -> str:
    text = _PASSPORT_RE.sub(lambda m: m.group()[:2] + "***" + m.group()[-2:], text)
    text = _PHONE_RE.sub(lambda m: m.group()[:3] + "-****-" + m.group()[-4:], text)
    return text


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        record.message = record.getMessage()
        log: dict[str, Any] = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "msg": _mask(record.message),
        }
        if record.exc_info:
            log["exc"] = self.formatException(record.exc_info)
        return json.dumps(log, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

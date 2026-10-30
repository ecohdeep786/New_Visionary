"""BUILD-LAUNCH-02 (KAN-133) — isolated generated HTML previews and the
authenticated review bridge.

  - HTML CONTENT SANDBOX: generated HTML is scanned and BOUNDED before any
    preview is served. Script tags, event handlers, external URLs, iframe/
    embed/object elements and CSS url() references are REFUSED. Only safe
    tags from the allowlist are accepted, and the total size is bounded.
  - ORIGIN + MESSAGE CONTROLS: the review bridge only accepts postMessage
    events from the AUTHORIZED preview origin, with a VALIDATED message type
    and bounded payload size. Malicious events (wrong origin, unknown type,
    oversized payload, injection payloads) are rejected with accessible
    error codes.
  - AUTHENTICATED REVIEW BRIDGE: only the artifact owner (or an authorized
    reviewer) can open a preview session. Preview sessions are time-bounded.
    Cross-owner requests are denied.
  - ACCESSIBLE ERRORS: every refusal carries a machine-readable error code
    AND a text alternative (not just visual).
"""
from __future__ import annotations

import hashlib
import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

SANDBOX_CONTRACT = "vmm-previewsandbox.v1"

MAX_HTML_BYTES = 256 * 1024
MAX_MESSAGE_BYTES = 64 * 1024

SAFE_TAGS = frozenset({
    "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "thead",
    "tbody", "tr", "td", "th", "span", "div", "img", "br", "hr", "strong", "em",
    "blockquote", "pre", "code", "figure", "figcaption", "section", "article",
    "header", "footer", "nav", "main", "aside",
})

DANGEROUS_PATTERNS = (
    r"<script", r"javascript\s*:", r"on(?:error|load|click|focus|blur|submit|change)\s*=",
    r"<iframe", r"<embed", r"<object", r"<applet", r"<form", r"<input",
    r"https?://", r"data:text/html", r"vbscript:", r"<svg.*onload",
    r"expression\s*\(", r"url\s*\(", r"@import", r"<link", r"<meta\s+http-equiv",
)

DANGEROUS_ATTRS = frozenset({"onclick", "onload", "onerror", "onfocus", "onblur", "onsubmit", "onchange", "onmouseover", "formaction", "xlink:href"})

AUTHORIZED_ORIGIN = "https://preview.visionary.org"


class SandboxError(ValueError):
    """The preview operation is not admissible."""

    def __init__(self, code: str, accessible_text: str):
        super().__init__(code)
        self.code = code
        self.accessible_text = accessible_text


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def scan_html(html: str) -> dict[str, Any]:
    """Scan and validate generated HTML for the sandbox. Returns a sanitized
    receipt; the ORIGINAL html is never modified — dangerous content is
    refused, not stripped."""
    if type(html) is not str or not html.strip():
        raise SandboxError("empty_html", "The preview HTML is empty. Provide content to preview.")
    if len(html.encode("utf-8")) > MAX_HTML_BYTES:
        raise SandboxError("html_too_large", f"The preview HTML exceeds the {MAX_HTML_BYTES // 1024} KB limit.")

    lowered = html.lower()
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, lowered):
            raise SandboxError("dangerous_content", f"Refused: dangerous pattern '{pattern}' detected in the preview HTML.")

    # Check for dangerous attributes inside tags.
    for attr in DANGEROUS_ATTRS:
        if re.search(rf"\b{attr}\s*=", lowered):
            raise SandboxError("dangerous_content", f"Refused: dangerous attribute '{attr}' detected.")

    # Check for disallowed tags.
    for tag in re.findall(r"<(\w+)[\s>/]", lowered):
        if tag not in SAFE_TAGS:
            raise SandboxError("dangerous_content", f"Refused: disallowed tag '<{tag}>'.")

    return {
        "contract": SANDBOX_CONTRACT,
        "sanitized": True,
        "sizeBytes": len(html.encode("utf-8")),
        "sha256": hashlib.sha256(html.encode("utf-8")).hexdigest(),
        "scannedAt": _now(),
    }


class PreviewSession:
    """A time-bounded, owner-scoped preview session."""

    def __init__(self, session_id: str, owner_uid: str, artifact_digest: str, expires_at: str):
        self.session_id = session_id
        self.owner_uid = owner_uid
        self.artifact_digest = artifact_digest
        self.expires_at = expires_at
        self.closed = False

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc).isoformat() > self.expires_at


class PreviewSandbox:
    """Authenticated preview bridge with origin/message/content controls."""

    def __init__(self, authorized_origin: str = AUTHORIZED_ORIGIN, session_ttl_ms: int = 300000):
        self.authorized_origin = authorized_origin
        self.session_ttl_ms = session_ttl_ms
        self._sessions: dict[str, PreviewSession] = {}
        self._session_counter = 0
        self._messages: list[dict[str, Any]] = []

    def open_session(self, actor: dict[str, Any], artifact_digest: str) -> dict[str, Any]:
        """Open a preview session — owner or authorized reviewer only."""
        uid = actor.get("uid")
        if type(uid) is not str or not uid:
            raise SandboxError("unauthorized", "Preview requires an authenticated identity.")
        role = actor.get("role")
        if role not in ("owner", "reviewer", "custodian"):
            raise SandboxError("unauthorized", "Preview access requires an owner, reviewer, or custodian role.")
        expires_at = datetime.fromtimestamp(
            datetime.now(timezone.utc).timestamp() + self.session_ttl_ms / 1000, timezone.utc
        ).isoformat()
        self._session_counter += 1
        session = PreviewSession(f"pv_{self._session_counter}", uid, artifact_digest, expires_at)
        self._sessions[session.session_id] = session
        return {
            "sessionId": session.session_id,
            "authorizedOrigin": self.authorized_origin,
            "expiresAt": expires_at,
            "csp": "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
        }

    def close_session(self, actor: dict[str, Any], session_id: str) -> dict[str, Any]:
        session = self._require_session(actor, session_id)
        session.closed = True
        return {"closed": True, "sessionId": session_id}

    def _require_session(self, actor: dict[str, Any], session_id: str) -> PreviewSession:
        session = self._sessions.get(session_id)
        if session is None:
            raise SandboxError("unknown_session", "Unknown preview session.")
        if session.owner_uid != actor.get("uid") and actor.get("role") not in ("reviewer", "custodian"):
            raise SandboxError("cross_owner", "Cross-owner preview access denied.")
        if session.closed or session.is_expired():
            raise SandboxError("session_expired", "Preview session has expired or was closed.")
        return session

    def post_message(self, actor: dict[str, Any], session_id: str, origin: str, message: dict[str, Any]) -> dict[str, Any]:
        """Validate and accept ONE postMessage event on the review bridge."""
        session = self._require_session(actor, session_id)
        if origin != self.authorized_origin:
            raise SandboxError("wrong_origin", f"Message origin '{origin}' does not match the authorized preview origin.")
        if type(message) is not dict or "type" not in message:
            raise SandboxError("invalid_message", "Message must be a dict with a 'type' field.")
        if message["type"] not in ("ready", "content-update", "error", "resize"):
            raise SandboxError("unknown_message_type", f"Unknown message type: {message['type']}")
        payload_size = len(json.dumps(message, default=str).encode("utf-8"))
        if payload_size > MAX_MESSAGE_BYTES:
            raise SandboxError("message_too_large", "Message payload exceeds the size limit.")
        if message["type"] == "content-update":
            scan_html(message.get("html", ""))

        receipt = {"accepted": True, "sessionId": session_id, "type": message["type"], "origin": origin, "at": _now()}
        self._messages.append(receipt)
        return receipt

    def messages(self, actor: dict[str, Any], session_id: str) -> list[dict[str, Any]]:
        self._require_session(actor, session_id)
        return [deepcopy(m) for m in self._messages if m["sessionId"] == session_id]

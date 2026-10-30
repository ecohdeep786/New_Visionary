"""BUILD-LAUNCH-02 (KAN-133) — preview sandbox + review bridge contracts."""
import unittest

from vmm.previewsandbox import PreviewSandbox, SandboxError


def scan_html_safe(html):
    from vmm.previewsandbox import scan_html
    return scan_html(html)

OWNER = {"uid": "uid_builder", "role": "owner"}
REVIEWER = {"uid": "uid_reviewer", "role": "reviewer"}
STRANGER = {"uid": "uid_stranger", "role": "user"}
MODEL = {"uid": "tiny-d1", "role": "model"}

ORIGIN = "https://preview.visionary.org"

CLEAN_HTML = "<h1>Solar System</h1><p>Force equals mass times acceleration</p><ul><li>Mercury</li></ul>"


class HtmlSandboxContracts(unittest.TestCase):
    def test_clean_html_passes(self):
        receipt = scan_html_safe(CLEAN_HTML)
        self.assertTrue(receipt["sanitized"])

    def test_script_tags_refused(self):
        for html in [
            "<h1>Ok</h1><script>alert(1)</script>",
            "<p>Ok</p><script src='https://evil.com/x.js'></script>",
        ]:
            with self.subTest(html[:30]):
                with self.assertRaises(SandboxError) as ctx:
                    scan_html_safe(html)
                self.assertEqual(ctx.exception.code, "dangerous_content")

    def test_event_handlers_refused(self):
        for html in [
            "<p onclick='alert(1)'>click</p>",
            "<img src='data:image/png' onerror='alert(1)'>",
            "<body onload='steal()'>",
        ]:
            with self.subTest(html[:30]):
                with self.assertRaises(SandboxError) as ctx:
                    scan_html_safe(html)

    def test_external_urls_refused(self):
        for html in [
            "<p>See <a href='https://evil.com'>this</a></p>",
            "<img src='https://evil.com/pixel.png'>",
            "<div style='background:url(https://evil.com)'>",
        ]:
            with self.subTest(html[:30]):
                with self.assertRaises(SandboxError) as ctx:
                    scan_html_safe(html)

    def test_iframe_embed_object_refused(self):
        for html in ["<iframe src='x'></iframe>", "<embed src='x'>", "<object data='x'>"]:
            with self.subTest(html[:30]):
                with self.assertRaises(SandboxError) as ctx:
                    scan_html_safe(html)

    def test_disallowed_tags_refused(self):
        for html in ["<form action='x'><input type='text'></form>", "<meta http-equiv='refresh' content='0'>"]:
            with self.subTest(html[:30]):
                with self.assertRaises(SandboxError) as ctx:
                    scan_html_safe(html)

    def test_empty_and_oversized_refused(self):
        with self.assertRaises(SandboxError) as ctx:
            scan_html_safe("")
        self.assertEqual(ctx.exception.code, "empty_html")
        with self.assertRaises(SandboxError) as ctx:
            scan_html_safe("<p>" + "x" * (256 * 1024 + 1) + "</p>")
        self.assertEqual(ctx.exception.code, "html_too_large")

    def test_accessible_errors_have_text_alternatives(self):
        try:
            scan_html_safe("<script>alert(1)</script>")
        except SandboxError as e:
            self.assertTrue(e.accessible_text, "accessible text alternative present")
            self.assertTrue(len(e.accessible_text) > 20, "text is meaningful, not just a code")


class BridgeContracts(unittest.TestCase):
    def setUp(self):
        self.sandbox = PreviewSandbox()
        self.session = self.sandbox.open_session(OWNER, "a" * 64)

    def test_open_session_returns_csp_and_origin(self):
        self.assertEqual(self.session["authorizedOrigin"], ORIGIN)
        self.assertIn("default-src 'none'", self.session["csp"])

    def test_cross_owner_denied(self):
        with self.assertRaises(SandboxError) as ctx:
            self.sandbox.post_message(STRANGER, self.session["sessionId"], ORIGIN, {"type": "ready"})
        self.assertEqual(ctx.exception.code, "cross_owner")

    def test_model_cannot_open_sessions(self):
        with self.assertRaises(SandboxError) as ctx:
            self.sandbox.open_session(MODEL, "a" * 64)
        self.assertEqual(ctx.exception.code, "unauthorized")

    def test_wrong_origin_refused(self):
        with self.assertRaises(SandboxError) as ctx:
            self.sandbox.post_message(OWNER, self.session["sessionId"], "https://evil.com", {"type": "ready"})
        self.assertEqual(ctx.exception.code, "wrong_origin")

    def test_unknown_message_type_refused(self):
        with self.assertRaises(SandboxError) as ctx:
            self.sandbox.post_message(OWNER, self.session["sessionId"], ORIGIN, {"type": "exfiltrate"})
        self.assertEqual(ctx.exception.code, "unknown_message_type")

    def test_content_update_with_script_refused(self):
        with self.assertRaises(SandboxError) as ctx:
            self.sandbox.post_message(OWNER, self.session["sessionId"], ORIGIN, {"type": "content-update", "html": "<p>ok</p><script>x()</script>"})
        self.assertEqual(ctx.exception.code, "dangerous_content")

    def test_valid_messages_accepted_and_receipts_kept(self):
        for msg_type in ("ready", "content-update", "resize"):
            self.sandbox.post_message(OWNER, self.session["sessionId"], ORIGIN, {"type": msg_type, "html": CLEAN_HTML})
        receipts = self.sandbox.messages(OWNER, self.session["sessionId"])
        self.assertEqual(len(receipts), 3)
        self.assertTrue(all(r["accepted"] for r in receipts))

    def test_reviewer_can_access_but_stranger_cannot(self):
        receipts = self.sandbox.messages(REVIEWER, self.session["sessionId"])
        self.assertEqual(len(receipts), 0)  # reviewer can read but no messages yet
        with self.assertRaises(SandboxError):
            self.sandbox.messages(STRANGER, self.session["sessionId"])

    def test_session_expiry_denies_access(self):
        self.sandbox._sessions[self.session["sessionId"]].expires_at = "2000-01-01T00:00:00+00:00"
        with self.assertRaises(SandboxError) as ctx:
            self.sandbox.post_message(OWNER, self.session["sessionId"], ORIGIN, {"type": "ready"})
        self.assertEqual(ctx.exception.code, "session_expired")


if __name__ == "__main__":
    unittest.main()

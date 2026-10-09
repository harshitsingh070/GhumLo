import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeExternalUrl } from "./urls.js";

test("allows http and https URLs", () => {
  assert.equal(sanitizeExternalUrl("https://example.com"), "https://example.com");
  assert.equal(sanitizeExternalUrl("http://example.com/x?q=1"), "http://example.com/x?q=1");
  assert.equal(sanitizeExternalUrl("  HTTPS://example.com  "), "HTTPS://example.com");
});

test("rejects dangerous schemes", () => {
  assert.equal(sanitizeExternalUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeExternalUrl("  javascript:alert(1)"), null);
  assert.equal(sanitizeExternalUrl("JaVaScRiPt:alert(1)"), null);
  assert.equal(sanitizeExternalUrl("data:text/html,<h1>x</h1>"), null);
  assert.equal(sanitizeExternalUrl("vbscript:msgbox(1)"), null);
  assert.equal(sanitizeExternalUrl("file:///etc/passwd"), null);
  assert.equal(sanitizeExternalUrl("blob:https://example.com/uuid"), null);
});

test("rejects empty and non-string input", () => {
  assert.equal(sanitizeExternalUrl(""), null);
  assert.equal(sanitizeExternalUrl("   "), null);
  assert.equal(sanitizeExternalUrl(null), null);
  assert.equal(sanitizeExternalUrl(undefined), null);
  assert.equal(sanitizeExternalUrl(42), null);
});

import { describe, it, expect, vi } from "vitest";
import { withGeminiRetry } from "@/lib/ai/retry";

describe("withGeminiRetry", () => {
  it("returns the result immediately on success, without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withGeminiRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on a transient 503 overload error and eventually succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}'))
      .mockResolvedValueOnce("recovered");

    const result = await withGeminiRetry(fn, 3);
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  }, 10000);

  it("does not retry a non-transient error (e.g. a 400 bad request)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error('{"error":{"code":400,"status":"INVALID_ARGUMENT"}}'));

    await expect(withGeminiRetry(fn, 3)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured number of attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error('{"error":{"code":503}}'));

    await expect(withGeminiRetry(fn, 2)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(2);
  }, 10000);
});

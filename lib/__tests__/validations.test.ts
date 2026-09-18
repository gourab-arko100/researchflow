import { describe, it, expect } from "vitest";
import { createWorkspaceSchema, ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES } from "@/lib/validations";

describe("createWorkspaceSchema", () => {
  it("accepts a valid workspace name", () => {
    const result = createWorkspaceSchema.safeParse({ name: "Bengali Aphasia Detection" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createWorkspaceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name over 80 characters", () => {
    const result = createWorkspaceSchema.safeParse({ name: "x".repeat(81) });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from the name", () => {
    const result = createWorkspaceSchema.safeParse({ name: "  Padded name  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Padded name");
  });

  it("rejects a description over 280 characters", () => {
    const result = createWorkspaceSchema.safeParse({ name: "ok", description: "x".repeat(281) });
    expect(result.success).toBe(false);
  });

  it("allows an omitted description", () => {
    const result = createWorkspaceSchema.safeParse({ name: "ok" });
    expect(result.success).toBe(true);
  });
});

describe("upload constraints", () => {
  it("includes the three documented file types", () => {
    expect(ACCEPTED_EXTENSIONS).toEqual([".pdf", ".txt", ".docx"]);
  });

  it("caps uploads under Vercel's 4.5MB Function body limit", () => {
    expect(MAX_UPLOAD_BYTES).toBe(4 * 1024 * 1024);
    expect(MAX_UPLOAD_BYTES).toBeLessThan(4.5 * 1024 * 1024);
  });
});

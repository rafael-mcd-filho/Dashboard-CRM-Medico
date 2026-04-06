import { describe, expect, it } from "vitest";
import {
  getUserIdFromSearch,
  isRecognizedUserId,
  isUserAuthorized,
  parseAllowedUserIds,
} from "./accessControl";

describe("accessControl", () => {
  it("extracts userid from the query string", () => {
    expect(getUserIdFromSearch("?userid=123")).toBe("123");
    expect(getUserIdFromSearch("?foo=bar&userid=abc-9")).toBe("abc-9");
  });

  it("returns null when userid is missing or blank", () => {
    expect(getUserIdFromSearch("")).toBeNull();
    expect(getUserIdFromSearch("?userid=   ")).toBeNull();
  });

  it("normalizes the configured allowlist", () => {
    expect(parseAllowedUserIds("123, 456 ,123,,789")).toEqual(["123", "456", "789"]);
  });

  it("authorizes only configured user ids", () => {
    const userIds = new Set(["123", "456"]);

    expect(isUserAuthorized("123", userIds)).toBe(true);
    expect(isUserAuthorized("999", userIds)).toBe(false);
    expect(isUserAuthorized(null, userIds)).toBe(false);
  });

  it("accepts null user ids and recognized ids only", () => {
    const userIds = new Set(["123", "456"]);

    expect(isRecognizedUserId(null, userIds)).toBe(true);
    expect(isRecognizedUserId("123", userIds)).toBe(true);
    expect(isRecognizedUserId("999", userIds)).toBe(false);
  });
});

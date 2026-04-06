import { describe, expect, it } from "vitest";
import {
  getUserIdFromSearch,
  isLocalAdminCredentialsValid,
  isLocalAdminLoginEnabled,
  isUserAuthorized,
  parseAllowedUserIds,
  resolveAccess,
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

  it("accepts the local admin test credentials", () => {
    expect(isLocalAdminCredentialsValid("admin", "admin")).toBe(true);
    expect(isLocalAdminCredentialsValid("admin", "wrong")).toBe(false);
  });

  it("enables local login on localhost", () => {
    expect(isLocalAdminLoginEnabled("localhost", false)).toBe(true);
    expect(isLocalAdminLoginEnabled("127.0.0.1", false)).toBe(true);
    expect(isLocalAdminLoginEnabled("crm.exemplo.com", false)).toBe(false);
  });

  it("requires login locally when userid is missing", () => {
    expect(resolveAccess({ search: "", hostname: "localhost", isDevelopment: false })).toEqual({
      status: "login-required",
      userId: null,
    });
  });

  it("authorizes the local admin session when userid is missing", () => {
    expect(
      resolveAccess({
        search: "",
        hostname: "localhost",
        hasLocalAdminAuth: true,
        isDevelopment: false,
      })
    ).toEqual({
      status: "authorized",
      userId: null,
      accessMode: "local-admin",
    });
  });

  it("keeps denying an explicit invalid userid", () => {
    expect(
      resolveAccess({
        search: "?userid=invalido",
        hostname: "localhost",
        hasLocalAdminAuth: true,
        userIds: new Set(["123"]),
        isDevelopment: false,
      })
    ).toEqual({
      status: "denied",
      userId: "invalido",
    });
  });
});

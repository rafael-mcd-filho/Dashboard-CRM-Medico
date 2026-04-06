import { describe, expect, it } from "vitest";
import {
  getUserIdFromSearch,
  isLocalAdminCredentialsValid,
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

  it("requires login when userid is missing", () => {
    expect(resolveAccess({ search: "" })).toEqual({
      status: "login-required",
      userId: null,
    });
  });

  it("authorizes the local admin session when userid is missing", () => {
    expect(
      resolveAccess({
        search: "",
        hasLocalAdminAuth: true,
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
        hasLocalAdminAuth: true,
        userIds: new Set(["123"]),
      })
    ).toEqual({
      status: "denied",
      userId: "invalido",
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  buildIndicatorAccessScope,
  isBrandAllowedForScope,
  normalizeBrandScopeValue,
} from "@/server/indicators/access";

process.env.ADMIN_EMAILS = "admin@example.com";

describe("indicator access scope", () => {
  it("grants all-brand access to admins", () => {
    const scope = buildIndicatorAccessScope("admin@example.com", []);
    expect(scope.isAdmin).toBe(true);
    expect(scope.canAccess).toBe(true);
    expect(scope.reason).toBe("ADMIN");
  });

  it("returns unique active brands for restricted users", () => {
    const scope = buildIndicatorAccessScope("user@example.com", [
      {
        user_email: "user@example.com",
        brand_name: "Matriz",
        is_active: "true",
      },
      {
        user_id: "user@example.com",
        brand_name: "QI",
        is_active: "1",
      },
      {
        user_email: "user@example.com",
        brand_name: "Matriz",
        is_active: "true",
      },
      {
        user_email: "user@example.com",
        brand_name: "Global Tree",
        is_active: "false",
      },
    ]);

    expect(scope.isAdmin).toBe(false);
    expect(scope.canAccess).toBe(true);
    expect(scope.allowedBrands).toEqual(["Matriz", "QI"]);
  });

  it("denies users without active brand bindings", () => {
    const scope = buildIndicatorAccessScope("user@example.com", [
      {
        user_email: "user@example.com",
        brand_name: "Matriz",
        is_active: "false",
      },
    ]);

    expect(scope.canAccess).toBe(false);
    expect(scope.reason).toBe("NO_BRAND_ACCESS");
  });

  it("matches brands without case or accent sensitivity", () => {
    const scope = {
      isAdmin: false,
      allowedBrands: ["Global Tree", "Saude Integral"],
    };

    expect(normalizeBrandScopeValue("Saúde Integral")).toBe("saude integral");
    expect(isBrandAllowedForScope("global tree", scope)).toBe(true);
    expect(isBrandAllowedForScope("Saúde Integral", scope)).toBe(true);
    expect(isBrandAllowedForScope("Outra Marca", scope)).toBe(false);
  });
});

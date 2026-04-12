import { describe, expect, it } from "vitest";
import { withAppUtm } from "./utm";

describe("withAppUtm", () => {
  it("añade parámetros UTM conservando la URL base", () => {
    const out = withAppUtm("https://example.com/path?q=1", "nav");
    expect(out).toContain("utm_source=championshipsudoku");
    expect(out).toContain("utm_medium=nav");
    expect(out).toContain("utm_campaign=casual_games");
    expect(out).toContain("q=1");
  });

  it("devuelve la cadena original si la URL es inválida", () => {
    expect(withAppUtm("not-a-url", "footer")).toBe("not-a-url");
  });
});

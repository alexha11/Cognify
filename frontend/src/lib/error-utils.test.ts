import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./error-utils";

describe("getApiErrorMessage", () => {
  it("reads the API's { error: { message } } envelope", () => {
    const err = {
      response: {
        data: {
          success: false,
          error: { message: "Too many incorrect attempts." },
        },
      },
    };
    expect(getApiErrorMessage(err, "fallback")).toBe(
      "Too many incorrect attempts.",
    );
  });

  it("also accepts a flat { message }", () => {
    expect(
      getApiErrorMessage({ response: { data: { message: "Flat" } } }, "x"),
    ).toBe("Flat");
  });

  it("falls back for empty responses and uses Error messages", () => {
    expect(getApiErrorMessage({ response: {} }, "fallback")).toBe("fallback");
    expect(getApiErrorMessage(new Error("Network Error"), "fallback")).toBe(
      "Network Error",
    );
    expect(getApiErrorMessage("nope", "fallback")).toBe("fallback");
  });
});

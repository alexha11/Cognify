import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/toast", () => ({
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import api from "./api";
import { toast } from "@/components/ui/toast";

/** Makes every request fail with `status` and the API's error envelope. */
function respondWith(status: number) {
  api.defaults.adapter = (config: InternalAxiosRequestConfig) =>
    Promise.reject(
      new AxiosError(`HTTP ${status}`, String(status), config, null, {
        status,
        statusText: "",
        headers: new AxiosHeaders(),
        config,
        data: { success: false, error: { message: `Server says ${status}` } },
      }),
    );
}

describe("api error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stays silent when the sign-in check finds nobody signed in", async () => {
    respondWith(401);
    await expect(api.get("/auth/profile")).rejects.toBeInstanceOf(AxiosError);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("tells the user when another request is rejected as unauthenticated", async () => {
    respondWith(401);
    await expect(api.get("/courses")).rejects.toBeInstanceOf(AxiosError);
    expect(toast.error).toHaveBeenCalledWith(
      "Session expired or unauthorized. Please sign in.",
    );
  });

  it("shows the server's message for other client errors", async () => {
    respondWith(400);
    await expect(api.post("/questions", {})).rejects.toBeInstanceOf(AxiosError);
    expect(toast.error).toHaveBeenCalledWith("Server says 400");
  });

  it("warns about rate limiting", async () => {
    respondWith(429);
    await expect(api.get("/courses")).rejects.toBeInstanceOf(AxiosError);
    expect(toast.warning).toHaveBeenCalled();
  });
});

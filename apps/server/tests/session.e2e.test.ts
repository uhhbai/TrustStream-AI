import { describe, expect, it } from "vitest";
import { buildServer } from "../src/app";

describe("session API happy path", () => {
  it("creates session and processes chunk", async () => {
    const app = buildServer();

    const startRes = await app.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        platform: "generic",
        pageUrl: "https://example.com/live"
      }
    });

    expect(startRes.statusCode).toBe(200);
    const startPayload = startRes.json();
    expect(startPayload.sessionId).toBeTruthy();

    const chunkRes = await app.inject({
      method: "POST",
      url: `/api/session/${startPayload.sessionId}/transcript-chunk`,
      payload: {
        text: "This is 100% original and buy now before it's gone.",
        source: "manual"
      }
    });

    expect(chunkRes.statusCode).toBe(200);
    const state = chunkRes.json();
    expect(state.trustScore).toBeTruthy();
    expect(Array.isArray(state.claims)).toBe(true);

    const stopRes = await app.inject({
      method: "POST",
      url: `/api/session/${startPayload.sessionId}/stop`
    });
    expect(stopRes.statusCode).toBe(200);
  });
});

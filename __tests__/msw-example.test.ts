import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";

const server = setupServer(
  http.get("https://api.example.com/greet", () =>
    HttpResponse.json({ message: "hello from msw" }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("fetches mocked data from MSW handler", async () => {
  const res = await fetch("https://api.example.com/greet");
  expect(res.ok).toBe(true);
  const json = (await res.json()) as { message: string };
  expect(json).toEqual({ message: "hello from msw" });
});

test("can override handler per test", async () => {
  server.use(
    http.get("https://api.example.com/greet", () =>
      HttpResponse.json({ message: "override" }),
    ),
  );

  const res = await fetch("https://api.example.com/greet");
  expect(res.ok).toBe(true);
  const json = (await res.json()) as { message: string };
  expect(json.message).toBe("override");
});

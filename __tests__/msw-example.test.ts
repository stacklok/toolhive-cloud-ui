import { HttpResponse, http } from "msw";
import { beforeEach, expect, test } from "vitest";
import { server } from "@/mocks/node";

beforeEach(() => {
  server.resetHandlers();
  server.use(
    http.get("https://api.example.com/greet", () =>
      HttpResponse.json({ message: "hello from msw" }),
    ),
  );
});

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

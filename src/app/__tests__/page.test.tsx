import * as nextNavigation from "next/navigation";
import { expect, test, vi } from "vitest";
import Home from "@/app/page";

test("Home redirects to /catalog when user is logged in", async () => {
  const redirectSpy = vi.spyOn(nextNavigation, "redirect");
  await Home();
  expect(redirectSpy).toHaveBeenCalledWith("/catalog");
});

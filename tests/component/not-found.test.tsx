import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("404案内とホームへの復帰導線を表示する", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "ページが見つかりません" }),
    ).toBeInTheDocument();
    expect(screen.getByText("404 / Not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホームへ戻る" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});

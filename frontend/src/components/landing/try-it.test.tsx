import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import { TryIt } from "./try-it";

const renderSection = () =>
  render(
    <LanguageProvider>
      <TryIt />
    </LanguageProvider>,
  );

describe("TryIt", () => {
  it("grades the demo questions and keeps score", async () => {
    const user = userEvent.setup();
    renderSection();

    const check = screen.getByRole("button", { name: "Check answer" });
    expect(check).toBeDisabled();

    // A wrong answer names the right one and scores nothing.
    await user.click(screen.getByRole("button", { name: /Array/ }));
    await user.click(check);
    expect(screen.getByRole("status")).toHaveTextContent("Not quite: the answer is Hash map");
    expect(screen.getByRole("button", { name: /Linked list/ })).toBeDisabled();
    expect(screen.getByText(/Question 1 of 3 · 0 pts/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(screen.getByText("Where does the Calvin cycle take place?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Stroma/ }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct · +10 points");
    expect(screen.getByText(/Question 2 of 3 · 10 pts/)).toBeInTheDocument();
  });

  it("starts over after the last question", async () => {
    const user = userEvent.setup();
    renderSection();

    for (const answer of [/Hash map/, /Stroma/, /Ohm/]) {
      await user.click(screen.getByRole("button", { name: answer }));
      await user.click(screen.getByRole("button", { name: "Check answer" }));
      await user.click(screen.getByRole("button", { name: /Next question|Play again/ }));
    }
    expect(screen.getByText(/Question 1 of 3 · 0 pts/)).toBeInTheDocument();
  });

  it("links to sign-up and the course list", () => {
    renderSection();
    expect(screen.getByRole("link", { name: "Create your first course" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute("href", "/courses");
  });
});

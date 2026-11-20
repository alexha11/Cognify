import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "./i18n";

function LanguageProbe() {
  const { language, setLanguage } = useLanguage();
  return (
    <>
      <p data-testid="lang">{language}</p>
      <button onClick={() => setLanguage("vi")}>Vietnamese</button>
    </>
  );
}

describe("LanguageProvider", () => {
  it("starts in English and remembers the chosen language", async () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("lang")).toHaveTextContent("en");

    await userEvent.setup().click(screen.getByText("Vietnamese"));

    expect(screen.getByTestId("lang")).toHaveTextContent("vi");
    expect(localStorage.getItem("cognify-lang")).toBe("vi");
  });

  it("picks up a stored choice", () => {
    localStorage.setItem("cognify-lang", "fi");
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("lang")).toHaveTextContent("fi");
  });

  it("follows changes made in another tab", () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>,
    );

    act(() => {
      localStorage.setItem("cognify-lang", "fi");
      window.dispatchEvent(new StorageEvent("storage", { key: "cognify-lang" }));
    });

    expect(screen.getByTestId("lang")).toHaveTextContent("fi");
  });
});

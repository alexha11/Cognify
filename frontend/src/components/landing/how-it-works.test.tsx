import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import { HowItWorks, STEP_MS } from "./how-it-works";

let reducedMotion = false;
let intersect: ((entries: { isIntersecting: boolean }[]) => void) | null = null;

beforeEach(() => {
  reducedMotion = false;
  intersect = null;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion") && reducedMotion,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderSection = () =>
  render(
    <LanguageProvider>
      <HowItWorks />
    </LanguageProvider>,
  );

const scrollIntoView = () => act(() => intersect?.([{ isIntersecting: true }]));
const step = (name: RegExp) => screen.getByRole("button", { name });

describe("HowItWorks", () => {
  it("shows the screen of the step the visitor points at", () => {
    renderSection();
    expect(screen.getByText("Drop a PDF here")).toBeInTheDocument();

    fireEvent.mouseEnter(step(/Get a quiz in seconds/));
    expect(screen.getByText("Which process turns light energy into chemical energy?")).toBeInTheDocument();
    expect(screen.queryByText("Drop a PDF here")).not.toBeInTheDocument();
    expect(step(/Get a quiz in seconds/)).toHaveAttribute("aria-pressed", "true");
    expect(step(/Upload your notes/)).toHaveAttribute("aria-pressed", "false");

    // Keyboard users reach the same screens by focus.
    fireEvent.focus(step(/Practise and see progress/));
    expect(screen.getByText("Correct: photosynthesis")).toBeInTheDocument();
  });

  it("plays through the steps while on screen, and stops once a step is chosen", () => {
    vi.useFakeTimers();
    renderSection();

    // Off screen nothing moves.
    act(() => vi.advanceTimersByTime(STEP_MS * 2));
    expect(screen.getByText("Drop a PDF here")).toBeInTheDocument();

    scrollIntoView();
    act(() => vi.advanceTimersByTime(STEP_MS));
    expect(step(/Get a quiz in seconds/)).toHaveAttribute("aria-pressed", "true");
    act(() => vi.advanceTimersByTime(STEP_MS));
    expect(step(/Practise and see progress/)).toHaveAttribute("aria-pressed", "true");

    fireEvent.mouseEnter(step(/Upload your notes/));
    act(() => vi.advanceTimersByTime(STEP_MS * 3));
    expect(step(/Upload your notes/)).toHaveAttribute("aria-pressed", "true");
  });

  it("never plays by itself for visitors who reduce motion", () => {
    reducedMotion = true;
    vi.useFakeTimers();
    renderSection();
    scrollIntoView();

    act(() => vi.advanceTimersByTime(STEP_MS * 3));
    expect(step(/Upload your notes/)).toHaveAttribute("aria-pressed", "true");
  });
});

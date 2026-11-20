import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Modal } from "./modal";

/** A page that opens a dialog and re-renders itself while it is open. */
function Page() {
  const [open, setOpen] = useState(false);
  const [edits, setEdits] = useState(0);
  return (
    <div data-testid="page">
      <button onClick={() => setOpen(true)}>Edit course</button>
      <span>{edits} edits</span>
      {/* An inline onClose, as every caller writes it: a new function on each render. */}
      <Modal open={open} onClose={() => setOpen(false)} title="Edit course">
        <input aria-label="Course name" onChange={() => setEdits((n) => n + 1)} />
      </Modal>
    </div>
  );
}

describe("Modal", () => {
  it("renders on <body>, outside the page, so the sticky header cannot sit above it", async () => {
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: "Edit course" }));

    const dialog = screen.getByRole("dialog", { name: "Edit course" });
    expect(screen.getByTestId("page")).not.toContainElement(dialog);
    // The overlay wrapping the dialog is a direct child of <body>.
    expect(dialog.parentElement?.parentElement).toBe(document.body);
  });

  it("returns focus to the control that opened it", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const opener = screen.getByRole("button", { name: "Edit course" });

    await user.click(opener);
    expect(screen.getByRole("dialog")).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("keeps focus in a field while the page behind it re-renders", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Edit course" }));

    // Each keystroke re-renders the page, which hands the modal a new onClose.
    // That used to re-run the focus effect and move focus to the panel after
    // the first character.
    const field = screen.getByRole("textbox", { name: "Course name" });
    await user.click(field);
    await user.keyboard("Databases");

    expect(field).toHaveFocus();
    expect(field).toHaveValue("Databases");
    expect(screen.getByText("9 edits")).toBeInTheDocument();
  });
});

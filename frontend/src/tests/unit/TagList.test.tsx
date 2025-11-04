import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TagList from "../../components/TagList";
import { api } from "../../api";

jest.mock("../../api");

const mockOnChanged = jest.fn();

const renderTagList = (tags = [{ _id: "1", name: "Work", color: "#123456" }]) =>
  render(<TagList tags={tags} onChanged={mockOnChanged} />);

describe("TagList (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders existing tags", () => {
    renderTagList();
    expect(screen.getByText("🏷️ Tags")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("submits successfully: calls api, resets form, and calls onChanged", async () => {
    // Return a Response-like object with ok: true
    (api as jest.Mock).mockResolvedValue({ ok: true });

    renderTagList();

    const nameInput = screen.getByPlaceholderText("Name") as HTMLInputElement;
    const colorInput = screen.getByPlaceholderText(
      "#rrggbb",
    ) as HTMLInputElement;
    const addBtn = screen.getByRole("button", { name: "Add" });
    const form = addBtn.closest("form")!;

    // Fill form
    fireEvent.change(nameInput, { target: { value: "Fun" } });
    fireEvent.change(colorInput, { target: { value: "#ffffff" } });

    // Submit
    fireEvent.submit(form);

    // Button enters submitting state
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveTextContent("Adding…");

    await waitFor(() => {
      // onChanged called after success
      expect(mockOnChanged).toHaveBeenCalledTimes(1);
    });

    // After success, button state restored
    expect(addBtn).not.toBeDisabled();
    expect(addBtn).toHaveTextContent("Add");

    // Form reset: name empty, color back to default value
    expect(nameInput.value).toBe("");
    // Default value in component is "#4f46e5"
    expect(colorInput.value.toLowerCase()).toBe("#4f46e5");
  });

  it("shows API error from Response.json() when response.ok === false", async () => {
    (api as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({ error: "Duplicate tag" }),
    });

    renderTagList();

    const addBtn = screen.getByRole("button", { name: "Add" });
    const form = addBtn.closest("form")!;
    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Work" },
    });
    fireEvent.submit(form);

    await waitFor(() => {
      // Alert is rendered with our message
      expect(screen.getByRole("alert")).toHaveTextContent(
        "HTTP 409: Duplicate tag",
      );
      // onChanged not called on error
      expect(mockOnChanged).not.toHaveBeenCalled();
    });

    // Button back to normal after failure
    expect(addBtn).not.toBeDisabled();
    expect(addBtn).toHaveTextContent("Add");
  });

  it("shows fallback API error when api() returns object with { error }", async () => {
    (api as jest.Mock).mockResolvedValue({ error: "Invalid color" });

    renderTagList();

    const addBtn = screen.getByRole("button", { name: "Add" });
    const form = addBtn.closest("form")!;
    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Oops" },
    });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "HTTP 400: Invalid color",
      );
      expect(mockOnChanged).not.toHaveBeenCalled();
    });
  });

  it("shows network/unknown error when api() throws", async () => {
    (api as jest.Mock).mockRejectedValue(new Error("Network down"));

    renderTagList();

    const addBtn = screen.getByRole("button", { name: "Add" });
    const form = addBtn.closest("form")!;
    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "TagX" },
    });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network down");
      expect(mockOnChanged).not.toHaveBeenCalled();
    });
  });
});

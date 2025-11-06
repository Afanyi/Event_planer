import { render, screen, fireEvent } from "@testing-library/react";
import Filters from "../../components/Filters";

describe("Filters (unit)", () => {
  const setup = (override?: Partial<React.ComponentProps<typeof Filters>>) => {
    const props: React.ComponentProps<typeof Filters> = {
      q: "kickoff",
      setQ: jest.fn(),
      from: "2025-10-01",
      setFrom: jest.fn(),
      to: "2025-10-31",
      setTo: jest.fn(),
      location: "Berlin",
      setLocation: jest.fn(),
      participant: "Alice",
      setParticipant: jest.fn(),
      tagsFilter: "work,fun",
      setTagsFilter: jest.fn(),
      onApply: jest.fn(),
      ...override,
    };

    const utils = render(<Filters {...props} />);
    return { props, ...utils };
  };

  it("renders all fields with controlled values and the Apply button", () => {
    const { props } = setup();

    // Inputs present
    const qInput = screen.getByPlaceholderText(
      "Search title…",
    ) as HTMLInputElement;
    const fromInput = screen.getByDisplayValue(props.from) as HTMLInputElement;
    const toInput = screen.getByDisplayValue(props.to) as HTMLInputElement;
    const locationInput = screen.getByPlaceholderText(
      "Location…",
    ) as HTMLInputElement;
    const participantInput = screen.getByPlaceholderText(
      "Participant…",
    ) as HTMLInputElement;
    const tagsInput = screen.getByPlaceholderText("Tags…") as HTMLInputElement;

    // Controlled values visible
    expect(qInput.value).toBe(props.q);
    expect(fromInput.value).toBe(props.from);
    expect(toInput.value).toBe(props.to);
    expect(locationInput.value).toBe(props.location);
    expect(participantInput.value).toBe(props.participant);
    expect(tagsInput.value).toBe(props.tagsFilter);

    // Apply button present
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("calls the corresponding setters when inputs change", () => {
    const { props } = setup();

    fireEvent.change(screen.getByPlaceholderText("Search title…"), {
      target: { value: "meet" },
    });
    expect(props.setQ).toHaveBeenCalledWith("meet");

    fireEvent.change(screen.getByDisplayValue("2025-10-01"), {
      target: { value: "2025-10-02" },
    });
    expect(props.setFrom).toHaveBeenCalledWith("2025-10-02");

    fireEvent.change(screen.getByDisplayValue("2025-10-31"), {
      target: { value: "2025-10-30" },
    });
    expect(props.setTo).toHaveBeenCalledWith("2025-10-30");

    fireEvent.change(screen.getByPlaceholderText("Location…"), {
      target: { value: "Munich" },
    });
    expect(props.setLocation).toHaveBeenCalledWith("Munich");

    fireEvent.change(screen.getByPlaceholderText("Participant…"), {
      target: { value: "Bob" },
    });
    expect(props.setParticipant).toHaveBeenCalledWith("Bob");

    fireEvent.change(screen.getByPlaceholderText("Tags…"), {
      target: { value: "work,tech" },
    });
    expect(props.setTagsFilter).toHaveBeenCalledWith("work,tech");
  });

  it("invokes onApply when clicking the Apply button", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(props.onApply).toHaveBeenCalledTimes(1);
  });
});

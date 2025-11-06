import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EventForm from "../../components/EventForm";
import { api } from "../../api";

jest.mock("../../api");

const tags = [
  { _id: "t1", name: "Work", color: "#111111" },
  { _id: "t2", name: "Fun", color: "#222222" },
];

const participants = [
  { _id: "p1", name: "Alice", email: "alice@example.com" },
  { _id: "p2", name: "Bob", email: "bob@example.com" },
];

describe("EventForm (unit)", () => {
  const onCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (api as jest.Mock).mockResolvedValue({ ok: true });
  });

  function renderForm() {
    render(
      <EventForm
        tags={tags as any}
        participants={participants as any}
        onCreated={onCreated}
      />,
    );
    const submitBtn = screen.getByRole("button", { name: "Create" });
    const form = submitBtn.closest("form") as HTMLFormElement;
    return { form, submitBtn };
  }

  it("submits with all fields, tags, participants, and location, calls api and resets form", async () => {
    const { form } = renderForm();

    // Query all inputs directly by name on the <form> (most reliable)
    const titleInput = form.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;
    const dateInput = form.querySelector(
      'input[name="date"]',
    ) as HTMLInputElement;
    const streetInput = form.querySelector(
      'input[name="street"]',
    ) as HTMLInputElement;
    const houseInput = form.querySelector(
      'input[name="houseNumber"]',
    ) as HTMLInputElement;
    const plzInput = form.querySelector(
      'input[name="postalCode"]',
    ) as HTMLInputElement;
    const cityInput = form.querySelector(
      'input[name="city"]',
    ) as HTMLInputElement;
    const imageUrlInp = form.querySelector(
      'input[name="imageUrl"]',
    ) as HTMLInputElement;
    const descInput = form.querySelector(
      'textarea[name="description"]',
    ) as HTMLTextAreaElement;

    const tagWork = screen.getByLabelText(/Work/i) as HTMLInputElement;
    const tagFun = screen.getByLabelText(/Fun/i) as HTMLInputElement;
    const partAlice = screen.getByLabelText(/Alice/i) as HTMLInputElement;
    const partBob = screen.getByLabelText(/Bob/i) as HTMLInputElement;

    // Ensure a valid future date (set a future date to avoid validation errors)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // set to one year in the future
    const futureDateString = futureDate.toISOString().slice(0, 16);

    fireEvent.change(titleInput, { target: { value: "Project Kickoff" } });
    fireEvent.change(dateInput, { target: { value: futureDateString } }); // Ensure valid future date
    fireEvent.change(streetInput, { target: { value: "Musterstraße" } });
    fireEvent.change(houseInput, { target: { value: "10" } });
    fireEvent.change(plzInput, { target: { value: "12345" } });
    fireEvent.change(cityInput, { target: { value: "Berlin" } });
    fireEvent.change(imageUrlInp, {
      target: { value: "https://example.com/pic.png" },
    });
    fireEvent.change(descInput, { target: { value: "Initial meeting" } });

    fireEvent.click(tagWork);
    fireEvent.click(tagFun);
    fireEvent.click(partAlice);
    fireEvent.click(partBob);

    // Submit the form using act to ensure async updates are processed
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

    const [calledUrl, calledOpts] = (api as jest.Mock).mock.calls[0];
    expect(calledUrl).toBe("/events");

    const sent = JSON.parse(calledOpts.body);
    expect(sent).toEqual({
      title: "Project Kickoff",
      description: "Initial meeting",
      // Dynamically generated location
      location: "Musterstraße 10, 12345 Berlin",
      street: "Musterstraße",
      houseNumber: "10",
      postalCode: "12345",
      city: "Berlin",
      date: futureDateString,
      imageUrl: "https://example.com/pic.png",
      tags: ["t1", "t2"],
      participants: ["p1", "p2"],
    });

    expect(onCreated).toHaveBeenCalled();

    // Reset checks
    expect(titleInput.value).toBe("");
    expect(dateInput.value).toBe("");
    expect(streetInput.value).toBe("");
    expect(houseInput.value).toBe("");
    expect(plzInput.value).toBe("");
    expect(cityInput.value).toBe("");
    expect(imageUrlInp.value).toBe("");
    expect(descInput.value).toBe("");
    expect(tagWork.checked).toBe(false);
    expect(tagFun.checked).toBe(false);
    expect(partAlice.checked).toBe(false);
    expect(partBob.checked).toBe(false);
  });
});

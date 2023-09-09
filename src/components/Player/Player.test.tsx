import { fireEvent, render } from "@solidjs/testing-library";
import Player from "./Player";

describe("<Player />", () => {
  it("increments value", async () => {
    const { queryByRole, unmount } = render(() => <Player />);
    const button = (await queryByRole("button")) as HTMLButtonElement;
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/Clicks: 0/);
    fireEvent.click(button);
    expect(button).toHaveTextContent(/Clicks: 1/);
    unmount();
  });

  it("renders 1", () => {
    const { container, unmount } = render(() => <Player />);
    expect(container).toMatchSnapshot();
    unmount();
  });
});

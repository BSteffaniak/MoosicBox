import { render } from '@solidjs/testing-library';
import Player from './Player';

describe('<Player />', () => {
    it('renders Connecting...', () => {
        const { container, unmount } = render(() => <Player />);
        expect(container).toMatchSnapshot();
        unmount();
    });
});

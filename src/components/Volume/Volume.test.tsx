import { render } from '@solidjs/testing-library';
import Volume from './Volume';

describe('<Volume />', () => {
    it('renders Connecting...', () => {
        const { container, unmount } = render(() => <Volume />);
        expect(container).toMatchSnapshot();
        unmount();
    });
});

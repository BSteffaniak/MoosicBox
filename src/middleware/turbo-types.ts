export {};

declare global {
    interface Window {
        Turbo: {
            navigator: {
                history: {
                    replace(url: URL): void;
                };
            };
        };
    }
}

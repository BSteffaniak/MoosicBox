export {};

declare global {
    interface Window {
        Turbo: {
            navigator: {
                history: {
                    replace(url: string): void;
                };
            };
        };
    }
}

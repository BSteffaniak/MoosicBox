// @refresh reload
import { Routes } from "@solidjs/router";
import { Suspense } from "solid-js";
import {
    Body,
    FileRoutes,
    Head,
    Html,
    Link,
    Meta,
    Scripts,
    Title,
} from "solid-start";
import { ErrorBoundary } from "solid-start/error-boundary";

export default function Root() {
    return (
        <Html lang="en">
            <Head>
                <Title>SolidStart - With Vitest</Title>
                <Meta charset="utf-8" />
                <Meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/base-min.css"
                ></Link>
                <Link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/grids-min.css"
                ></Link>
                <Link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/grids-responsive-min.css"
                ></Link>
            </Head>
            <Body>
                <Suspense>
                    <ErrorBoundary>
                        <Routes>
                            <FileRoutes />
                        </Routes>
                    </ErrorBoundary>
                </Suspense>
                <Scripts />
            </Body>
        </Html>
    );
}

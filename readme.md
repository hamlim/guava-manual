# Guava

Rawdogging RSC with Vite + Hono

## Features:

- Routing
  - `fileName.page.tsx` -> RSC for `/${fileName}`
  - `fileName.route.tsx` -> Route handler for `/${fileName}` (handles all request methods)
  - `[name].(page|route).tsx` -> Dynamic RSC/Route handler for `/<dynamic-segment>`
    - Will **not** match on `/` or `/something/another-thing`
  - `[...name].(page|route).ts` -> Nested Dynamic RSC/Route handler for `/<dynamic-segment>(...)`
    - Will **not** match on `/`
    - Will match on:
      - `/foo`
      - `/foo/bar`
      - `/foo/bar/...`

### "APIs":

#### Server Components:

Any `${fileName}.page.tsx` file will be treated as a top level server component entrypoint into a specific route.

These files **must** provide a react component as it's default export.

The component will recieve the following props:

- `request: Request` - the `Request` for the page
- `context: Store['context']` - a grab-bag of different values associated with the request (at the moment it's only `context.params`, but may be extended in the future!)

Example:

```tsx
// ./src/blog.page.tsx
import type {PageProps} from 'guava/types';

export default async function BlogPage({ request, context }: PageProps) {
  return <h1>Welcome!</h1>
}
```

#### Route Handlers:

Any `${fileName}.route.ts` file will be treated as a route handler.

These files **must** provide a handler function as a default export.

This function will be called with the following arguments:

- `request: Request` - the `Request` for the page
- `context: Store['context']` - a grab-bag of different values associated with the request (at the moment it's only `context.params`, but may be extended in the future)

Example:

```ts
// ./src/api/do-thing.route.ts
import type {Store} from 'guava/types';

export default async function doSomething(request: Request, context: Store['context']) {
  return new Response('Hello World!');
}
```
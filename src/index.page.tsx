import type { PageProps } from "guava/types";

export default async function IndexPage({ request, context }: PageProps) {
  return (
    <main>
      <h1>Hello World from Guava!</h1>
      <p>URL: {new URL(request.url).pathname}</p>
    </main>
  );
}

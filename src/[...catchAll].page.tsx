import type { PageProps } from "guava/types";

export default async function CatchAllPage({ context }: PageProps) {
  let { catchAll } = context.params;

  // 404 if no other route was matched!
  context.status(404);

  return <div>CatchAllPage for {catchAll}</div>;
}

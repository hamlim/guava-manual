import type { PageProps } from "guava/types";

export default async function CommentsPage({ context }: PageProps) {
  let { slug } = context.params;

  return <div>Comments for {slug}</div>;
}

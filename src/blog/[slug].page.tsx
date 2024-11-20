import type { PageProps } from "guava/types";

export default async function BlogPage({ context }: PageProps) {
  let { slug } = context.params;

  console.log(slug);
  return <div>BlogPage for {slug}</div>;
}

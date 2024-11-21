import type { PageProps } from "guava/types";
import { LikeButton } from "./components/like-button";
import { likePost } from "./index.actions";
import "./styles.css";

export default async function IndexPage({ request, context }: PageProps) {
  return (
    <main>
      <h1>Hello World from Guava!</h1>
      <p>URL: {new URL(request.url).pathname}</p>
      <form>
        <input type="hidden" name="postId" value="1" />
        <LikeButton likeAction={likePost} />
      </form>
    </main>
  );
}

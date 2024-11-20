"use client";

import { useRouter } from "guava/client";
import { useActionState } from "react";

type Props = {
  likeAction: (formData: FormData, prevState: boolean) => Promise<boolean>;
};

export function LikeButton({ likeAction }: Props) {
  let router = useRouter();
  let [state, action] = useActionState(
    async (prevState: boolean, formData: FormData) => {
      try {
        await likeAction(formData, prevState);
        router.refresh(router.path);
        return !prevState;
      } catch (err) {
        console.error(err);
      }
      return prevState;
    },
    false,
  );

  return (
    <button type="submit" formAction={action}>
      {state ? "Unlike" : "Like"} Post
    </button>
  );
}

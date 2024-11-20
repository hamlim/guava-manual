"use server";
import { db } from "./db";

export async function likePost(formData: FormData, prevState: boolean) {
  let postId = formData.get("postId");
  if (typeof postId !== "string") {
    throw new Error("postId is required");
  }
  try {
    db.prepare("INSERT INTO likes (post_id) VALUES (?)").run(postId);
    return !prevState;
  } catch (err) {
    console.error(err);
    return prevState;
  }
}

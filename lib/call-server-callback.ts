import {
  type CallServerCallback,
  createFromFetch,
  encodeReply,
} from "react-server-dom-webpack/client.browser";

/*
 * React will delegate to this function when it needs to call a server action.
 *
 * See file://./NodeServer.tsx callServerAction
 */
export async function callServer(
  id: string,
  args: Parameters<CallServerCallback>[1],
): ReturnType<CallServerCallback> {
  const fetchPromise = fetch(`/__action`, {
    method: "POST",
    headers: { "rsc-action": id },
    body: await encodeReply(args),
  });

  return createFromFetch(fetchPromise);
}

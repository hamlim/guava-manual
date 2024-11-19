export function config(newDebug: boolean) {
  debug = newDebug;
}

export let debug = false;

export function debugLog(message: string) {
  if (debug) {
    console.log(`[DEBUG] ${message}`);
  }
}

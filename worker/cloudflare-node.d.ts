// Minimal declaration for the Workers runtime module used by worker/index.ts.
// (The full @cloudflare/workers-types globals conflict with the DOM lib used by
// the React client, so only what is needed is declared here.)
declare module "cloudflare:node" {
  export function handleAsNodeRequest(
    port: number | { port: number },
    request: Request,
    env?: unknown,
    ctx?: unknown
  ): Promise<Response>;
}

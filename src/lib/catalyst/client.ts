/**
 * Server-side Catalyst app-instance helper.
 * -----------------------------------------------------------------------
 * Builds a `CatalystApp` (from `zcatalyst-sdk-node`) out of an incoming
 * Next.js App Router Route Handler request, for use by server-side route
 * handlers under `src/app/api/**`. Do NOT import this from client
 * components - the SDK is Node-only and this whole module is meant to run
 * exclusively inside Route Handlers (`export const runtime = "nodejs"`).
 *
 * WHY THE SHIM EXISTS
 * -----------------------------------------------------------------------
 * Next.js App Router Route Handlers hand you a Web-standard `Request`
 * (the Fetch API object - `request.headers` is a `Headers` instance,
 * there's no `req.headers` plain object, no Express-style `req`). The
 * Catalyst Node SDK's `catalyst.initialize(req, opts)` is documented and
 * exemplified only against Express/Node-style request objects: a plain
 * object exposing `headers` as a `{ [key: string]: string }` map (see the
 * catalyst-appsail skill's Express template, which calls
 * `catalyst.initialize(req, { scope: 'admin' })` straight off an Express
 * `req`).
 *
 * Having read the SDK's own source (node_modules/zcatalyst-sdk-node/lib/
 * catalyst-namespace.js, `initialize()`), the *only* thing it actually
 * reads off the object passed in is `object.headers` - a plain key/value
 * map, from which it pulls the `x-zc-*` project/credential headers (via
 * `CatalystCredential`). `method` and `url` are not read by `initialize()`
 * itself in this SDK version, but they're harmless, cheap to include, and
 * guard against a different SDK version (or a code path we haven't read)
 * expecting a more complete Express-req-shaped object - hence including
 * them defensively below.
 *
 * `Object.fromEntries(request.headers.entries())` turns the Fetch `Headers`
 * iterator into that plain object; Fetch `Headers` keys are already
 * lowercased (per the Fetch spec), matching the lowercase `x-zc-*` header
 * names the SDK looks for (and matching what Node's own
 * `http.IncomingMessage.headers` would have given it), so no further
 * normalization is needed.
 *
 * UNVERIFIED FROM THIS SANDBOX: this shim was built by reading the SDK's
 * source and the catalyst-appsail skill's docs, not by exercising it
 * against Catalyst's real AppSail gateway (this sandbox has no network
 * path to a live Catalyst project - see the AppSail skill's "Gateway
 * Always Injects Admin Credentials" section). It should work once deployed
 * (the gateway injects real `x-zc-*` headers into every request, so
 * `request.headers` will already carry them here), but that is the one
 * thing that genuinely cannot be confirmed until this is redeployed and
 * hit for real.
 */
import catalyst from "zcatalyst-sdk-node";
import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type { NextRequest } from "next/server";

/**
 * Builds an admin-scope `CatalystApp` for the given incoming request.
 *
 * Uses `scope: 'admin'` per the catalyst-appsail skill: Catalyst's AppSail
 * gateway injects admin-scope `x-zc-*` headers into every request that
 * reaches a deployed AppSail instance (including unauthenticated ones), so
 * this only ever yields real DataStore access when actually running on
 * Catalyst's AppSail infrastructure - see the module doc above.
 */
export function getCatalystApp(request: NextRequest | Request): CatalystApp {
  const shimReq = {
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: request.url,
  };
  // The SDK's own type for `initialize()`'s first parameter is
  // `{ [x: string]: unknown }` - it's typed loosely on purpose to accept
  // either this Express-style shim or its "basic I/O" alternative shape,
  // so no `as never`/`any` cast is needed here; `shimReq` already
  // satisfies it structurally.
  return catalyst.initialize(shimReq, { scope: "admin" });
}

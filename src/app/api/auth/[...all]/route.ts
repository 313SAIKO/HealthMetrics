import { getAuth } from "../../../../server/auth";
import {
  handleApi,
  readJsonBody,
  requireTrustedOrigin,
} from "../../../../server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApi(async () => (await getAuth()).handler(request));
}

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    requireTrustedOrigin(request);
    const body = await readJsonBody(request, true);
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    headers.set("content-type", "application/json");
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: request.signal,
    });
    return (await getAuth()).handler(boundedRequest);
  });
}

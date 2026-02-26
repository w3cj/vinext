import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-route-proxy-root", "root-proxy-ran");
  return response;
}

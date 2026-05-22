import { NextRequest } from "next/server";

export function verifyAgentApiKey(request: NextRequest): boolean {
  const expected = process.env.RECEIPT_AGENT_API_KEY;
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7) === expected;
  }

  const headerKey = request.headers.get("x-api-key");
  return headerKey === expected;
}

export function getAgentAuthError() {
  return {
    error: "未授權。請設定 RECEIPT_AGENT_API_KEY 並在請求中提供 Bearer token。",
  };
}

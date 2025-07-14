import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("Debug route called");

  return NextResponse.json({
    message: "Debug route working",
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries()),
  });
}

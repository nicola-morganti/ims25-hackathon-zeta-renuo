import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const date = searchParams.get("date") ?? "";
    const time = searchParams.get("time") ?? "";
    const isArrivalTime = searchParams.get("isArrivalTime") ?? "0";

    const api = new URL("https://transport.opendata.ch/v1/connections");
    if (from) api.searchParams.set("from", from);
    if (to) api.searchParams.set("to", to);
    if (date) api.searchParams.set("date", date);
    if (time) api.searchParams.set("time", time);
    if (isArrivalTime) api.searchParams.set("isArrivalTime", isArrivalTime);

    const r = await fetch(api.toString(), {
      headers: { Accept: "application/json" },
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 500 });
  }
}

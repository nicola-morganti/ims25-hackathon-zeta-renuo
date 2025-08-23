import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const viewMode = searchParams.get("viewMode") || "day";

    const whereClause: { userId: string; startTime?: { gte: Date; lte: Date } } = { userId };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      let endDate: Date;
      
      if (viewMode === "week") {
        // Get the end of the week (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Single day
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      }
      
      whereClause.startTime = {
        gte: startDate,
        lte: endDate
      };
    }

    // Get events from database
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' }
    });

    return NextResponse.json({ events });

  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Events" },
      { status: 500 }
    );
  }
}

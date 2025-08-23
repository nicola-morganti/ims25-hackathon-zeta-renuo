import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    let whereClause: any = { userId: session.user.id };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

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

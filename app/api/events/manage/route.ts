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
    const action = searchParams.get("action");
    
    if (action === "clear") {
      // Clear all events for this user
      await prisma.event.deleteMany({
        where: { userId }
      });
      return NextResponse.json({ 
        message: "Alle Events gelöscht",
        count: 0
      });
    }
    
    if (action === "info") {
      // Get storage info for this user
      const events = await prisma.event.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          startTime: true,
          userId: true,
          createdAt: true
        }
      });
      
      return NextResponse.json({
        totalEvents: events.length,
        events
      });
    }
    
    // Default: return all events for this user
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' }
    });
    
    return NextResponse.json({
      events,
      count: events.length
    });
    
  } catch (error) {
    console.error("Events management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

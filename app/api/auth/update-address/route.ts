import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const { street, houseNumber, postalCode, city } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        street: street || null,
        houseNumber: houseNumber || null,
        postalCode: postalCode || null,
        city: city || null
      }
    });

    return NextResponse.json({ 
      message: "Adresse erfolgreich aktualisiert",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        street: updatedUser.street,
        houseNumber: updatedUser.houseNumber,
        postalCode: updatedUser.postalCode,
        city: updatedUser.city
      }
    });

  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Adresse" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        street: true,
        houseNumber: true,
        postalCode: true,
        city: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error("Get user address error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Adresse" },
      { status: 500 }
    );
  }
}

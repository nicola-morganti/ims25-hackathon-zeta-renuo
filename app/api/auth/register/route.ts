import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, street, houseNumber, postalCode, city } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password,
        name: name || null,
        street: street || null,
        houseNumber: houseNumber || null,
        postalCode: postalCode || null,
        city: city || null
      }
    });

    return NextResponse.json({ 
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        street: newUser.street,
        houseNumber: newUser.houseNumber,
        postalCode: newUser.postalCode,
        city: newUser.city
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
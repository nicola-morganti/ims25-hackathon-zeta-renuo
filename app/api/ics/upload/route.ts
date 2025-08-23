import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveLocation } from "@/lib/locationMap";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    if (!file.name.endsWith('.ics')) {
      return NextResponse.json({ error: "Nur ICS-Dateien erlaubt" }, { status: 400 });
    }

    const fileContent = await file.text();
    const events = parseICSFile(fileContent, session.user.id);

    // Save events to database
    const savedEvents = await Promise.all(
      events.map(event => 
        prisma.event.create({
          data: event
        })
      )
    );

    return NextResponse.json({
      message: `${savedEvents.length} Events erfolgreich importiert`,
      events: savedEvents
    });

  } catch (error) {
    console.error("ICS upload error:", error);
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten der ICS-Datei" },
      { status: 500 }
    );
  }
}

interface ICSEvent {
  userId: string;
  title: string;
  description?: string;
  location?: string;
  address?: string;
  startTime: Date;
  endTime: Date;
}

function parseICSFile(content: string, userId: string) {
  const events: ICSEvent[] = [];
  const lines = content.split('\n');
  
  let currentEvent: Partial<ICSEvent> = { userId };
  let inEvent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = { userId };
      inEvent = true;
      continue;
    }
    
    if (line === 'END:VEVENT') {
      if (currentEvent.title && currentEvent.startTime) {
        // If no endTime is set, use startTime + 1 hour as default
        const eventWithEndTime: ICSEvent = {
          ...currentEvent as ICSEvent,
          endTime: currentEvent.endTime || new Date(currentEvent.startTime.getTime() + 60 * 60 * 1000)
        };
        events.push(eventWithEndTime);
      }
      inEvent = false;
      continue;
    }
    
    if (!inEvent) continue;
    
    if (line.startsWith('SUMMARY:')) {
      currentEvent.title = line.substring(8);
    } else if (line.startsWith('DESCRIPTION:')) {
      currentEvent.description = line.substring(12);
    } else if (line.startsWith('LOCATION:')) {
      const location = line.substring(9);
      currentEvent.location = location;
      // Resolve location to address using locationMap
      const address = resolveLocation(location);
      if (address) {
        currentEvent.address = address;
      }
    } else if (line.startsWith('DTSTART:')) {
      const dateStr = line.substring(8);
      currentEvent.startTime = parseICSDate(dateStr);
    } else if (line.startsWith('DTEND:')) {
      const dateStr = line.substring(6);
      currentEvent.endTime = parseICSDate(dateStr);
    }
  }
  
  return events;
}

function parseICSDate(dateStr: string): Date {
  // Handle different ICS date formats
  if (dateStr.includes('T')) {
    // Format: 20240115T080000Z or 20240115T080000
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  } else {
    // Format: 20240115
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return new Date(`${year}-${month}-${day}`);
  }
}

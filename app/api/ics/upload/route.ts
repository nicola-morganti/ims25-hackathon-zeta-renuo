import { NextRequest, NextResponse } from "next/server";
import { resolveLocation } from "@/lib/locationMap";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("ICS Upload - Using user ID:", userId);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    if (!file.name.endsWith('.ics')) {
      return NextResponse.json({ error: "Nur ICS-Dateien erlaubt" }, { status: 400 });
    }

    const fileContent = await file.text();
    console.log("File content:", fileContent);
    
    const events = parseICSFile(fileContent, userId);
    console.log("Parsed events:", events);

    // Save events to database with duplicate check
    const savedEvents = [];
    for (const event of events) {
      // Check for duplicates based on title, startTime, and userId
      const existingEvent = await prisma.event.findFirst({
        where: {
          userId: event.userId,
          title: event.title,
          startTime: {
            gte: new Date(event.startTime.getTime() - 60000), // 1 minute before
            lte: new Date(event.startTime.getTime() + 60000)  // 1 minute after
          }
        }
      });
      
      if (existingEvent) {
        console.log("Skipping duplicate event:", event.title, "at", event.startTime);
        continue;
      }
      
      const savedEvent = await prisma.event.create({
        data: {
          userId: event.userId,
          title: event.title,
          description: event.description,
          location: event.location,
          address: event.address,
          startTime: event.startTime,
          endTime: event.endTime,
          color: "#3B82F6" // Default blue color
        }
      });
      
      savedEvents.push(savedEvent);
      console.log("Successfully stored event:", savedEvent.id);
    }
    
    const totalEvents = await prisma.event.count({ where: { userId } });
    console.log("Total events for user:", totalEvents);

    return NextResponse.json({
      message: `${savedEvents.length} Events erfolgreich importiert`,
      events: savedEvents
    });

  } catch (error) {
    console.error("ICS upload error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: `Fehler beim Verarbeiten der ICS-Datei: ${error instanceof Error ? error.message : 'Unknown error'}` },
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

  console.log("Parsing ICS file with", lines.length, "lines");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log(`Line ${i}: "${line}"`);
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = { userId };
      inEvent = true;
      console.log("Started new event");
      continue;
    }
    
    if (line === 'END:VEVENT') {
      console.log("Ending event:", currentEvent);
      if (currentEvent.title && currentEvent.startTime) {
        // If no endTime is set, use startTime + 1 hour as default
        const eventWithEndTime: ICSEvent = {
          ...currentEvent as ICSEvent,
          endTime: currentEvent.endTime || new Date(currentEvent.startTime.getTime() + 60 * 60 * 1000)
        };
        events.push(eventWithEndTime);
        console.log("Added event:", eventWithEndTime);
      } else {
        console.log("Event missing required fields:", { title: currentEvent.title, startTime: currentEvent.startTime });
      }
      inEvent = false;
      continue;
    }
    
    if (!inEvent) continue;
    
    if (line.startsWith('SUMMARY:')) {
      currentEvent.title = line.substring(8);
      console.log("Set title:", currentEvent.title);
    } else if (line.startsWith('DESCRIPTION:')) {
      currentEvent.description = line.substring(12);
      console.log("Set description:", currentEvent.description);
    } else if (line.startsWith('LOCATION:')) {
      const location = line.substring(9);
      currentEvent.location = location;
      console.log("Set location:", location);
      // Resolve location to address using locationMap
      const address = resolveLocation(location);
      if (address) {
        currentEvent.address = address;
        console.log("Resolved address:", address);
      }
    } else if (line.startsWith('DTSTART:')) {
      const dateStr = line.substring(8);
      console.log("Parsing start date:", dateStr);
      try {
        currentEvent.startTime = parseICSDate(dateStr);
        console.log("Set startTime:", currentEvent.startTime);
      } catch (error) {
        console.error("Error parsing start date:", error);
      }
    } else if (line.startsWith('DTEND:')) {
      const dateStr = line.substring(6);
      console.log("Parsing end date:", dateStr);
      try {
        currentEvent.endTime = parseICSDate(dateStr);
        console.log("Set endTime:", currentEvent.endTime);
      } catch (error) {
        console.error("Error parsing end date:", error);
      }
    }
  }
  
  console.log("Final events array:", events);
  return events;
}

function parseICSDate(dateStr: string): Date {
  // Handle different ICS date formats
  if (dateStr.includes('T')) {
    // Format: 20240115T080000Z or 20240115T080000
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = parseInt(dateStr.substring(9, 11));
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);
    
    // ICS times need to be adjusted by +2 hours for Swiss time
    // Add 2 hours to get the correct local time
    const adjustedHour = hour + 2;
    let utcDate: Date;
    
    if (adjustedHour >= 24) {
      // Handle day rollover
      const nextDay = new Date(`${year}-${month}-${day}`);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      utcDate = new Date(`${nextDayStr}T${(adjustedHour - 24).toString().padStart(2, '0')}:${minute}:${second}`);
    } else {
      utcDate = new Date(`${year}-${month}-${day}T${adjustedHour.toString().padStart(2, '0')}:${minute}:${second}`);
    }
    
    return utcDate;
  } else {
    // Format: 20240115
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return new Date(`${year}-${month}-${day}`);
  }
}

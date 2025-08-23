"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  Train,
  LogOut,
  Upload,
  Route,
  Settings,
} from "lucide-react";
import { resolveLocation } from "@/lib/locationMap";

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  address?: string;
  color: string;
  date?: string;
}

interface SBBConnection {
  from: {
    station: { name: string };
    departure?: string;
  };
  to: {
    station: { name: string };
    arrival?: string;
  };
  duration: string;
  sections: Array<{
    journey?: {
      category: string;
      number: string;
      duration?: string;
    };
    walk?: {
      duration?: string;
    };
    departure?: {
      station?: { name: string };
      departure?: string;
      platform?: string;
    };
    arrival?: {
      station?: { name: string };
      arrival?: string;
    };
  }>;
  price?: string;
}

interface TransformedConnection {
  id: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  transport: string[];
  price?: string;
  sections: Array<{
    type: string;
    from?: string;
    to?: string;
    departure?: string;
    arrival?: string;
    duration?: string;
    platform?: string;
  }>;
}

interface UserAddress {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showOvModal, setShowOvModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedConnection, setSelectedConnection] =
    useState<TransformedConnection | null>(null);
  const [userAddress, setUserAddress] = useState<UserAddress>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadEvents = useCallback(
    async (date?: Date) => {
      try {
        const targetDate = date || selectedDate;
        const dateString = targetDate.toISOString().split("T")[0];
        const response = await fetch(
          `/api/events?date=${dateString}&viewMode=day`
        );
        const data = await response.json();

        if (response.ok) {
          const formattedEvents = data.events.map(
            (event: {
              id: string;
              title: string;
              startTime: string;
              endTime: string;
              location?: string;
              address?: string;
              color: string;
            }) => ({
              id: event.id,
              title: event.title,
              startTime: new Date(event.startTime).toLocaleTimeString("de-CH", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Europe/Zurich",
              }),
              endTime: new Date(event.endTime).toLocaleTimeString("de-CH", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Europe/Zurich",
              }),
              location: event.location,
              address: event.address,
              color: event.color,
              date: new Date(event.startTime).toLocaleDateString("de-CH", {
                weekday: "short",
                month: "short",
                day: "numeric",
                timeZone: "Europe/Zurich",
              }),
            })
          );
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error("Error loading events:", error);
      }
    },
    [selectedDate]
  );

  const loadUserAddress = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/update-address");
      if (response.ok) {
        const data = await response.json();
        setUserAddress(data.user);
      }
    } catch (error) {
      console.error("Error loading user address:", error);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadEvents();
      loadUserAddress();
    }
  }, [status, router, loadEvents, loadUserAddress]);

  useEffect(() => {
    if (status === "authenticated") {
      loadEvents();
    }
  }, [status, loadEvents]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    console.log("Frontend: Uploading file:", file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/ics/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("Frontend: Response status:", response.status);
      const data = await response.json();
      console.log("Frontend: Response data:", data);

      if (response.ok) {
        alert(data.message);
        loadEvents();
        setShowUploadModal(false);
      } else {
        alert(data.error || "Fehler beim Upload");
      }
    } catch (error) {
      console.error("Frontend: Upload error:", error);
      alert("Fehler beim Upload");
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const getUserAddressString = () => {
    if (userAddress.street && userAddress.houseNumber && userAddress.postalCode && userAddress.city) {
      return `${userAddress.street} ${userAddress.houseNumber}, ${userAddress.postalCode} ${userAddress.city}`;
    }
    return "";
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Stundenplan
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session.user?.name || session.user?.email}
                </p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/settings")}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Einstellungen</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Willkommen zurück!
            👋
          </h2>

          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                  loadEvents(newDate);
                }}
              >
                ← Vorheriger Tag
              </Button>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString("de-CH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                  loadEvents(newDate);
                }}
              >
                Nächster Tag →
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setShowOvModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Train className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">ÖV-Verbindung</h3>
                  <p className="text-sm text-gray-500">Route finden</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setShowUploadModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    ICS importieren
                  </h3>
                  <p className="text-sm text-gray-500">Stundenplan hochladen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>
              {selectedDate.toLocaleDateString("de-CH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Keine Lektionen gefunden</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Für diesen Tag sind keine Lektionen geplant
                  </p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-4 h-4 rounded-full mr-4"
                      style={{ backgroundColor: event.color }}
                    ></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {event.startTime} - {event.endTime}
                        </span>
                        {event.location && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("Route clicked for event:", event);
                        console.log("Event location:", event.location);
                        const address = resolveLocation(event.location || "");
                        console.log("Resolved address:", address);
                        setSelectedLocation(address || "");
                        const timeMatch =
                          event.startTime.match(/(\d{1,2}):(\d{2})/);
                        const timeForInput = timeMatch
                          ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`
                          : "";
                        console.log("Time for input:", timeForInput);
                        setSelectedTime(timeForInput);
                        setShowOvModal(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Route className="w-3 h-3" />
                      <span>Route</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Wochenübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    {day}
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                    {day === "Mo"
                      ? "3"
                      : day === "Di"
                      ? "2"
                      : day === "Mi"
                      ? "4"
                      : day === "Do"
                      ? "1"
                      : day === "Fr"
                      ? "2"
                      : "0"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </main>

      {/* Connections Modal */}
      {showOvModal && (
        <OvConnectionModal
          onClose={() => setShowOvModal(false)}
          defaultFrom={getUserAddressString()}
          defaultTo={selectedLocation}
          defaultTime={selectedTime}
          selectedConnection={selectedConnection}
          onConnectionSelect={setSelectedConnection}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
        />
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".ics"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

function UploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await onUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">ICS-Datei importieren</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Lade deine ICS-Datei hoch, um deinen Stundenplan zu importieren. Die
            Lektionen werden automatisch mit Adressen aus dem locationMap
            verknüpft.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">ICS-Datei auswählen</p>
            <p className="text-sm text-gray-500">Nur .ics Dateien erlaubt</p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleFileSelect}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Datei auswählen
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".ics"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

function OvConnectionModal({
  onClose,
  defaultFrom,
  defaultTo,
  defaultTime,
  selectedConnection,
  onConnectionSelect,
}: {
  onClose: () => void;
  defaultFrom?: string;
  defaultTo?: string;
  defaultTime?: string;
  selectedConnection: TransformedConnection | null;
  onConnectionSelect: (connection: TransformedConnection | null) => void;
}) {
  const [from, setFrom] = useState(defaultFrom || "");
  const [to, setTo] = useState(defaultTo || "");
  const [departureTime, setDepartureTime] = useState(defaultTime || "");
  const [transportType, setTransportType] = useState("all");
  const [connections, setConnections] = useState<TransformedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("defaultFrom changed:", defaultFrom);
    if (defaultFrom) {
      setFrom(defaultFrom);
    }
  }, [defaultFrom]);

  useEffect(() => {
    console.log("defaultTo changed:", defaultTo);
    if (defaultTo) {
      setTo(defaultTo);
    }
  }, [defaultTo]);

  useEffect(() => {
    console.log("defaultTime changed:", defaultTime);
    if (defaultTime) {
      setDepartureTime(defaultTime);
    }
  }, [defaultTime]);

  const handleSearch = async () => {
    if (!to) {
      setError("Bitte gib einen Zielort an");
      return;
    }

    const searchFrom = from || defaultFrom || "Zürich HB";
    if (!from) {
      setFrom(searchFrom);
    }

    setIsLoading(true);
    setError("");

    try {
      const today = new Date().toISOString().split("T")[0];
      const searchTime =
        departureTime ||
        new Date().toLocaleTimeString("de-CH", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

      const response = await fetch(
        `/api/sbb?from=${encodeURIComponent(
          searchFrom
        )}&to=${encodeURIComponent(to)}&date=${today}&time=${searchTime}`
      );

      const data = await response.json();

      if (response.ok && data.connections) {
        console.log("SBB API response:", data.connections);

        const transformedConnections = data.connections
          .slice(0, 5)
          .map((connection: SBBConnection, index: number) => ({
            id: index.toString(),
            from: connection.from.station.name,
            to: connection.to.station.name,
            departure:
              connection.from.departure?.slice(11, 16) ||
              connection.from.departure ||
              "",
            arrival:
              connection.to.arrival?.slice(11, 16) ||
              connection.to.arrival ||
              "",
            duration: connection.duration,
            transport: connection.sections
              .map((section) => {
                if (section.journey) {
                  return `${section.journey.category}${
                    section.journey.number || ""
                  }`.trim();
                } else if (section.walk) {
                  return "Fussweg";
                } else {
                  return "Unbekannt";
                }
              })
              .filter((t: string) => t !== "Unbekannt"),
            sections: connection.sections
              .map((section) => {
                if (section.journey && section.departure && section.arrival) {
                  return {
                    type: `${section.journey.category}${
                      section.journey.number || ""
                    }`.trim(),
                    from: section.departure.station?.name,
                    to: section.arrival.station?.name,
                    departure: section.departure.departure?.slice(11, 16),
                    arrival: section.arrival.arrival?.slice(11, 16),
                    duration: section.journey.duration,
                    platform: section.departure.platform,
                  };
                } else if (
                  section.walk &&
                  section.departure &&
                  section.arrival
                ) {
                  return {
                    type: "Fussweg",
                    from: section.departure.station?.name,
                    to: section.arrival.station?.name,
                    departure: section.departure.departure?.slice(11, 16),
                    arrival: section.arrival.arrival?.slice(11, 16),
                    duration: section.walk.duration,
                  };
                } else {
                  return {
                    type: "Unbekannt",
                  };
                }
              })
              .filter((section) => section.type !== "Unbekannt"),
            price: connection.price,
          }));

        setConnections(transformedConnections);
      } else {
        setError(data.error || "Fehler beim Suchen der Verbindung");
      }
    } catch (error) {
      console.error("Error searching for connections:", error);
      setError("Netzwerkfehler");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">ÖV-Verbindung finden</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von
              </label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Startort"
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  defaultFrom ? "bg-gray-50" : ""
                }`}
                readOnly={!!defaultFrom}
              />
              {defaultFrom && (
                <p className="text-xs text-gray-500 mt-1">
                  Deine gespeicherte Adresse
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nach
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Zielort"
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  defaultTo ? "bg-gray-50" : ""
                }`}
                readOnly={!!defaultTo}
              />
              {defaultTo && (
                <p className="text-xs text-gray-500 mt-1">
                  Aus Stundenplan übernommen
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ankunftszeit
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  defaultTime ? "bg-gray-50" : ""
                }`}
              />
              {defaultTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Aus Stundenplan übernommen
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verkehrsmittel
              </label>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle Verkehrsmittel</option>
                <option value="train">Zug</option>
                <option value="bus">Bus</option>
                <option value="tram">Tram</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Suche..." : "Route suchen"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
          </div>

          {/* Results */}
          {connections.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Verbindungen</h3>
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      selectedConnection?.id === connection.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() =>
                      onConnectionSelect(
                        selectedConnection?.id === connection.id
                          ? null
                          : connection
                      )
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="text-lg font-semibold">
                            {connection.departure} - {connection.arrival}
                          </div>
                          <div className="text-sm text-gray-500">
                            {connection.duration}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {connection.from} → {connection.to}
                        </div>
                        <div className="flex items-center space-x-2">
                          {connection.transport.map(
                            (transport: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {transport}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      {connection.price && (
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {connection.price}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Connection Details */}
                    {selectedConnection?.id === connection.id &&
                      connection.sections && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Verbindungsdetails:
                          </h4>
                          <div className="space-y-2">
                            {connection.sections.map((section, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-3 text-sm"
                              >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                                  {section.type === "Fussweg" ? "🚶" : "🚆"}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {section.type}
                                    {section.platform && (
                                      <span className="text-gray-500 ml-2">
                                        Gleis {section.platform}
                                      </span>
                                    )}
                                  </div>
                                  {section.from && section.to && (
                                    <div className="text-gray-600 text-xs">
                                      {section.from} → {section.to}
                                    </div>
                                  )}
                                </div>
                                {section.departure && section.arrival && (
                                  <div className="text-right text-gray-600">
                                    <div className="font-medium">
                                      {section.departure} - {section.arrival}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

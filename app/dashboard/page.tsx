"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Train, Bus, Car, Plus, Settings, LogOut, Upload, Route } from "lucide-react";

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  address?: string;
  color: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showOvModal, setShowOvModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadEvents();
    }
  }, [status, router]);

  const loadEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/events?date=${today}`);
      const data = await response.json();
      
      if (response.ok) {
        const formattedEvents = data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          startTime: new Date(event.startTime).toLocaleTimeString('de-CH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          endTime: new Date(event.endTime).toLocaleTimeString('de-CH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          location: event.location,
          address: event.address,
          color: event.color
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ics/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        loadEvents(); // Reload events after upload
        setShowUploadModal(false);
      } else {
        alert(data.error || 'Fehler beim Upload');
      }
    } catch (error) {
      alert('Fehler beim Upload');
    }
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
              <h1 className="text-xl font-semibold text-gray-900">Stundenplan</h1>
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
            Willkommen zurück, {session.user?.name?.split(' ')[0] || 'Student'}! 👋
          </h2>
          <p className="text-gray-600">Hier ist dein Stundenplan für heute</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowOvModal(true)}>
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowUploadModal(true)}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">ICS importieren</h3>
                  <p className="text-sm text-gray-500">Stundenplan hochladen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Einstellungen</h3>
                  <p className="text-sm text-gray-500">Präferenzen anpassen</p>
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
              <span>Heute - {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div 
                    className="w-4 h-4 rounded-full mr-4"
                    style={{ backgroundColor: event.color }}
                  ></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
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
                                     {event.address && (
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => setShowOvModal(true)}
                       className="flex items-center space-x-1"
                     >
                       <Route className="w-3 h-3" />
                       <span>Route</span>
                     </Button>
                   )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Wochenübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium text-gray-500 mb-2">{day}</div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                    {day === 'Mo' ? '3' : day === 'Di' ? '2' : day === 'Mi' ? '4' : day === 'Do' ? '1' : day === 'Fr' ? '2' : '0'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ÖV Modal */}
      {showOvModal && (
        <OvConnectionModal onClose={() => setShowOvModal(false)} />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)} 
          onUpload={handleFileUpload}
          fileInputRef={fileInputRef}
        />
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".ics"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}

function UploadModal({ 
  onClose, 
  onUpload, 
  fileInputRef 
}: { 
  onClose: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const handleFileSelect = () => {
    fileInputRef.current?.click();
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
            Lade deine ICS-Datei hoch, um deinen Stundenplan zu importieren. 
            Die Lektionen werden automatisch mit Adressen aus dem locationMap verknüpft.
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
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OvConnectionModal({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [transportType, setTransportType] = useState("all");
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!from || !to) {
      setError("Bitte fülle alle Felder aus");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('de-CH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      const response = await fetch(`/api/sbb?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${today}&time=${currentTime}`);

      const data = await response.json();

      if (response.ok && data.connections) {
        // Transform SBB API response to our format
        const transformedConnections = data.connections.slice(0, 5).map((connection: any, index: number) => ({
          id: index.toString(),
          from: connection.from.station.name,
          to: connection.to.station.name,
          departure: connection.from.departure?.slice(11, 16) || connection.from.departure,
          arrival: connection.to.arrival?.slice(11, 16) || connection.to.arrival,
          duration: connection.duration,
          transport: connection.sections.map((section: any) => 
            section.journey?.category || section.walk ? 'Fussweg' : 'Unbekannt'
          ).filter((transport: string) => transport !== 'Unbekannt'),
          price: connection.price
        }));
        
        setConnections(transformedConnections);
      } else {
        setError(data.error || "Fehler beim Suchen der Verbindung");
      }
    } catch (error) {
      setError("Netzwerkfehler");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">ÖV-Verbindung finden</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von
              </label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Startort eingeben"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nach
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Zielort eingeben"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
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
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                          {connection.transport.map((transport: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {transport}
                            </span>
                          ))}
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

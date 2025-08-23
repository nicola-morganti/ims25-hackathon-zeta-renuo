"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Check } from "lucide-react";

interface UserAddress {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
}

export function AddressSettings() {
  const [address, setAddress] = useState<UserAddress>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    try {
      const response = await fetch("/api/auth/update-address");
      if (response.ok) {
        const data = await response.json();
        setAddress(data.user);
      }
    } catch (error) {
      console.error("Error loading address:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target as HTMLFormElement);
    const street = formData.get("street") as string;
    const houseNumber = formData.get("houseNumber") as string;
    const postalCode = formData.get("postalCode") as string;
    const city = formData.get("city") as string;

    if (!street || !houseNumber || !postalCode || !city) {
      setError("Bitte füllen Sie alle Felder aus");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/update-address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ street, houseNumber, postalCode, city }),
      });

      if (response.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        setAddress({ street, houseNumber, postalCode, city });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Fehler beim Speichern");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      setError("Netzwerkfehler");
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Adresse für ÖV-Routenplanung</span>
        </CardTitle>
        <CardDescription>
          Diese Adresse wird automatisch als Startpunkt für ÖV-Verbindungen verwendet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="street">Strasse *</Label>
                <Input
                  id="street"
                  name="street"
                  type="text"
                  placeholder="Musterstrasse"
                  defaultValue={address.street || ""}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="houseNumber">Hausnummer *</Label>
                <Input
                  id="houseNumber"
                  name="houseNumber"
                  type="text"
                  placeholder="123"
                  defaultValue={address.houseNumber || ""}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="postalCode">Postleitzahl *</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  placeholder="8000"
                  defaultValue={address.postalCode || ""}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="city">Ort *</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Zürich"
                  defaultValue={address.city || ""}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Gespeichert!</span>
                  </>
                ) : (
                  <>
                    <span>{isLoading ? "Speichern..." : "Adresse speichern"}</span>
                  </>
                )}
              </Button>
              
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

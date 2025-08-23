"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronLeft, ChevronRight, User, MapPin, Check } from "lucide-react"

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: ""
  });

  const totalSteps = 3;

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("Bitte füllen Sie alle Pflichtfelder aus");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.street || !formData.houseNumber || !formData.postalCode || !formData.city) {
      setError("Bitte füllen Sie alle Adressfelder aus");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Registrierung erfolgreich, aber Anmeldung fehlgeschlagen");
        } else {
          router.push("/dashboard");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Registrierung fehlgeschlagen");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      setError("Netzwerkfehler");
    }
    
    setIsLoading(false);
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <User className="w-5 h-5" />;
      case 2: return <MapPin className="w-5 h-5" />;
      case 3: return <Check className="w-5 h-5" />;
      default: return null;
    }
  };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Persönliche Daten";
      case 2: return "Adresse";
      case 3: return "Überprüfung";
      default: return "";
    }
  };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return "Gebe deine grundlegenden Informationen ein";
      case 2: return "Diese Adresse wird für die automatische Routenplanung verwendet";
      case 3: return "Überprüfe deine Daten vor der Registrierung";
      default: return "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
          <CardDescription>
            Registriere dich in {totalSteps} einfachen Schritten
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < currentStep 
                      ? "bg-green-500 text-white" 
                      : step === currentStep 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {step < currentStep ? <Check className="w-4 h-4" /> : getStepIcon(step)}
                  </div>
                  {step < totalSteps && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Schritt {currentStep} von {totalSteps}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Max Mustermann"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Passwort *</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  required 
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  required 
                />
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="street">Strasse *</Label>
                  <Input
                    id="street"
                    type="text"
                    placeholder="Musterstrasse"
                    value={formData.street}
                    onChange={(e) => updateFormData("street", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="houseNumber">Hausnummer *</Label>
                  <Input
                    id="houseNumber"
                    type="text"
                    placeholder="123"
                    value={formData.houseNumber}
                    onChange={(e) => updateFormData("houseNumber", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="postalCode">Postleitzahl *</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="8000"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData("postalCode", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="city">Ort *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Zürich"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Persönliche Daten</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {formData.name || "Nicht angegeben"}</div>
                  <div><span className="font-medium">E-Mail:</span> {formData.email}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Adresse</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Strasse:</span> {formData.street} {formData.houseNumber}</div>
                  <div><span className="font-medium">Ort:</span> {formData.postalCode} {formData.city}</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  💡 Wichtig
                </h3>
                <p className="text-blue-800 text-sm">
                Diese Adresse wird für die automatische Routenplanung verwendet.
                  Du kannst diese jederzeit in den Einstellungen ändern.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg mt-4">
              {error}
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Zurück</span>
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center space-x-2"
              >
                <span>Weiter</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? "Registrieren..." : "Registrierung abschliessen"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm">
        Hast du bereits ein Konto?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Anmelden
        </Link>
      </div>
    </div>
  )
}

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
import { useState, useEffect } from "react"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      // Auto-login after registration
      const result = await signIn("credentials", {
        email,
        password,
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
    
    setIsLoading(false);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
          <CardDescription>
            Geben Sie Ihre E-Mail-Adresse ein, um sich zu registrieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Passwort</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Registrieren..." : "Registrieren"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Haben Sie bereits ein Konto?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Anmelden
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

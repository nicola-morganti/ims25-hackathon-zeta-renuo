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
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Ungültige Anmeldedaten");
    } else {
      router.push("/dashboard");
    }
    
    setIsLoading(false);
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Bei Ihrem Konto anmelden</CardTitle>
          <CardDescription>
            Geben Sie Ihre E-Mail-Adresse ein, um sich bei Ihrem Konto anzumelden
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
              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Anmelden..." : "Anmelden"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Haben Sie noch kein Konto?{" "}
              <Link href="/register" className="underline underline-offset-4">
                Registrieren
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

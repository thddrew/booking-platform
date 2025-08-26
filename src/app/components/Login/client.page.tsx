"use client";

import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// go to /tenant1/home
// redirects to /tenant1/login?redirect=%2Ftenant1%2Fhome
// login, uses slug to set payload-tenant cookie

type Props = {
  tenantSlug?: string;
  tenantDomain?: string;
};

export const Login = ({ tenantSlug, tenantDomain }: Props) => {
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const usernameId = React.useId();
  const passwordId = React.useId();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameRef?.current?.value || !passwordRef?.current?.value) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      const actionRes = await fetch("/api/users/external-users/login", {
        body: JSON.stringify({
          password: passwordRef.current.value,
          tenantSlug,
          tenantDomain,
          username: usernameRef.current.value,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "post",
      });
      const json = await actionRes.json();

      if (actionRes.status === 200 && json.user) {
        const redirectTo = searchParams.get("redirect");
        if (redirectTo) {
          router.push(redirectTo);
          return;
        } else {
          if (tenantDomain) {
            router.push("/tenant-domains");
          } else {
            router.push(`/tenant-slugs/${tenantSlug}`);
          }
        }
      } else if (actionRes.status === 400 && json?.errors?.[0]?.message) {
        setError(json.errors[0].message);
      } else {
        setError("Something went wrong, please try again.");
      }
    } catch (err) {
      setError("Something went wrong, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert
              variant="destructive"
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor={usernameId}>Username</Label>
              <Input
                id={usernameId}
                name="username"
                ref={usernameRef}
                type="text"
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={passwordId}>Password</Label>
              <Input
                id={passwordId}
                name="password"
                ref={passwordRef}
                type="password"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

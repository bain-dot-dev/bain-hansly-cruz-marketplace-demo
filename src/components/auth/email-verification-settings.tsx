"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Settings, Mail, Shield, Info } from "lucide-react";

export function EmailVerificationSettings() {
  // Get current setting from environment
  const emailVerificationEnabled =
    process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION !== "false";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Email Verification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <Label htmlFor="email-verification">Email Verification</Label>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={emailVerificationEnabled ? "default" : "secondary"}>
              {emailVerificationEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Current Status:</strong>{" "}
                {emailVerificationEnabled ? "Enabled" : "Disabled"}
              </p>

              {emailVerificationEnabled ? (
                <div>
                  <p>
                    <strong>Enabled Mode:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Users must verify their email before signing in</li>
                    <li>Confirmation email sent automatically</li>
                    <li>Users redirected to sign-in page after signup</li>
                    <li>More secure but requires email setup</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p>
                    <strong>Disabled Mode:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Users are signed in immediately after signup</li>
                    <li>No email confirmation required</li>
                    <li>Users redirected to profile after signup</li>
                    <li>Faster signup but less secure</li>
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>To change this setting:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                <li>
                  Open your{" "}
                  <code className="bg-gray-100 px-1 rounded">.env</code> file
                </li>
                <li>
                  Set{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION=true
                  </code>{" "}
                  (to enable) or{" "}
                  <code className="bg-gray-100 px-1 rounded">false</code> (to
                  disable)
                </li>
                <li>Restart your development server</li>
                <li>
                  Also update your Supabase Dashboard settings under
                  Authentication → Settings
                </li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

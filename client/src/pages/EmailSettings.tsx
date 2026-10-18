import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Loader2, Check, AlertCircle } from "lucide-react";

export function EmailSettings() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [preferences, setPreferences] = useState({
    marketing: true,
    transactional: true,
    digests: true,
    frequency: "weekly" as "daily" | "weekly" | "never",
  });

  // Fetch current preferences
  const { data: currentPrefs, isLoading } = trpc.emailPreferences.getPreferences.useQuery();

  useEffect(() => {
    if (currentPrefs) {
      setPreferences((prev) => ({
        ...prev,
        ...currentPrefs,
      }));
    }
  }, [currentPrefs]);

  // Update preferences mutation
  const updateMutation = trpc.emailPreferences.updatePreferences.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Email preferences updated successfully");
      setTimeout(() => setStatus("idle"), 3000);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Failed to update preferences");
    },
  });

  const handleSave = async () => {
    setStatus("loading");
    await updateMutation.mutateAsync(preferences);
  };

  if (!user) {
    return (
      <div className="container max-w-2xl py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">Please sign in to manage your email preferences.</p>
            <Button onClick={() => navigate("/signin")} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Preferences</h1>
        <p className="mt-2 text-gray-600">Manage how you receive communications from The Patient's Compass</p>
      </div>

      <div className="space-y-6">
        {/* Status Messages */}
        {status === "success" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{message}</p>
            </CardContent>
          </Card>
        )}

        {status === "error" && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{message}</p>
            </CardContent>
          </Card>
        )}

        {/* Email Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Email Categories</CardTitle>
            <CardDescription>Choose which types of emails you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Marketing Emails */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-900">Marketing & Promotions</Label>
                <p className="text-sm text-gray-600">New features, special offers, and announcements</p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
              />
            </div>

            {/* Transactional Emails */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-900">Transactional Emails</Label>
                <p className="text-sm text-gray-600">Account updates, password resets, and important notifications</p>
              </div>
              <Switch
                checked={preferences.transactional}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, transactional: checked })
                }
              />
            </div>

            {/* Digest Emails */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-900">Weekly Digest</Label>
                <p className="text-sm text-gray-600">Personalized health insights and recommendations</p>
              </div>
              <Switch
                checked={preferences.digests}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, digests: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Digest Frequency */}
        {preferences.digests && (
          <Card>
            <CardHeader>
              <CardTitle>Digest Frequency</CardTitle>
              <CardDescription>How often would you like to receive the weekly digest?</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={preferences.frequency}
                onValueChange={(value) =>
                  setPreferences({
                    ...preferences,
                    frequency: value as "daily" | "weekly" | "never",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (Sundays)</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={status === "loading"}
            className="bg-green-600 hover:bg-green-700"
          >
            {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Educational Content Notice */}
      <div className="mt-12 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <p>
          <strong>EDUCATIONAL CONTENT ONLY:</strong> These email preferences help us send you relevant health information. We respect your communication preferences and will never share your email with third parties.
        </p>
      </div>
    </div>
  );
}

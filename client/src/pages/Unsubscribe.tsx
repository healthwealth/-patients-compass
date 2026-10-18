import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface UnsubscribeState {
  status: "loading" | "verified" | "error" | "confirmed" | "resubscribed";
  userEmail?: string;
  userName?: string;
  error?: string;
  reason?: string;
}

export default function Unsubscribe() {
  const [location] = useLocation();
  const [state, setState] = useState<UnsubscribeState>({ status: "loading" });

  const token = new URLSearchParams(location.split("?")[1]).get("token");

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        error: "No unsubscribe token provided",
      });
      return;
    }

    // Verify token
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/unsubscribe/verify?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!data.success) {
          setState({
            status: "error",
            error: data.message || "Invalid or expired unsubscribe token",
          });
          return;
        }

        setState({
          status: "verified",
          userEmail: data.user.email,
          userName: data.user.name,
        });
      } catch (error) {
        console.error("[Unsubscribe] Verification failed:", error);
        setState({
          status: "error",
          error: "Failed to verify unsubscribe token",
        });
      }
    };

    verifyToken();
  }, [token]);

  const handleUnsubscribe = async (reason?: string) => {
    if (!token) return;

    try {
      setState((prev) => ({ ...prev, status: "loading" }));

      const response = await fetch("/api/unsubscribe/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason }),
      });

      const data = await response.json();

      if (!data.success) {
        setState({
          status: "error",
          error: data.message || "Failed to unsubscribe",
        });
        return;
      }

      setState({
        status: "confirmed",
        userEmail: state.userEmail,
        reason,
      });
    } catch (error) {
      console.error("[Unsubscribe] Confirmation failed:", error);
      setState({
        status: "error",
        error: "Failed to process unsubscribe request",
      });
    }
  };

  const handleResubscribe = async () => {
    if (!token) return;

    try {
      setState((prev) => ({ ...prev, status: "loading" }));

      const response = await fetch("/api/unsubscribe/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.success) {
        setState({
          status: "error",
          error: data.message || "Failed to resubscribe",
        });
        return;
      }

      setState({
        status: "resubscribed",
        userEmail: state.userEmail,
      });
    } catch (error) {
      console.error("[Unsubscribe] Resubscribe failed:", error);
      setState({
        status: "error",
        error: "Failed to process resubscribe request",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {state.status === "loading" && (
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your unsubscribe request...</p>
          </CardContent>
        )}

        {state.status === "error" && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Unsubscribe Failed</CardTitle>
              </div>
              <CardDescription>{state.error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Please try again or contact support if the issue persists.
              </p>
              <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>
                Return Home
              </Button>
            </CardContent>
          </>
        )}

        {state.status === "verified" && (
          <>
            <CardHeader>
              <CardTitle>Manage Email Preferences</CardTitle>
              <CardDescription>We're sorry to see you go. What would you like to do?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">{state.userName}</p>
                <p className="text-muted-foreground text-xs">{state.userEmail}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Unsubscribe Reason (optional):</p>
                <div className="space-y-2">
                  {[
                    { value: "too_many_emails", label: "Too many emails" },
                    { value: "not_relevant", label: "Content not relevant" },
                    { value: "no_longer_interested", label: "No longer interested" },
                    { value: "other", label: "Other" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        onChange={(e) => setState((prev) => ({ ...prev, reason: e.target.value }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => handleUnsubscribe(state.reason)}
                >
                  Unsubscribe from All Emails
                </Button>
                <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/settings/email")}>
                  Manage Preferences Instead
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {state.status === "confirmed" && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>Unsubscribed Successfully</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have been unsubscribed from all emails. You can resubscribe anytime from your account settings.
              </p>
              {state.reason && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium">Reason: {state.reason}</p>
                  <p className="text-muted-foreground text-xs">Thank you for the feedback</p>
                </div>
              )}
              <Button className="w-full" onClick={() => (window.location.href = "/")}>
                Return Home
              </Button>
            </CardContent>
          </>
        )}

        {state.status === "resubscribed" && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>Resubscribed Successfully</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have been resubscribed to emails. You'll start receiving updates again.
              </p>
              <Button className="w-full" onClick={() => (window.location.href = "/settings/email")}>
                Manage Email Preferences
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

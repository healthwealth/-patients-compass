import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function TrialCountdown() {
  const [, navigate] = useLocation();
  const { data: trialStatus, isLoading } = trpc.trial.getTrialStatus.useQuery();
  const [displayDays, setDisplayDays] = useState(0);

  useEffect(() => {
    if (trialStatus?.daysRemaining !== undefined) {
      setDisplayDays(trialStatus.daysRemaining);
    }
  }, [trialStatus]);

  if (isLoading || !trialStatus?.isTrialActive) {
    return null;
  }

  const isUrgent = displayDays <= 3;
  const bgColor = isUrgent ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200";
  const textColor = isUrgent ? "text-red-800" : "text-blue-800";
  const alertColor = isUrgent ? "text-red-600" : "text-blue-600";

  return (
    <Alert className={`${bgColor} border-2 mb-4`}>
      <Clock className={`h-4 w-4 ${alertColor}`} />
      <AlertDescription className={textColor}>
        <div className="flex items-center justify-between">
          <div>
            <strong>Free Trial Active:</strong> {displayDays} day{displayDays !== 1 ? "s" : ""} remaining
            {isUrgent && <span className="ml-2 text-red-600 font-semibold">Upgrade soon!</span>}
          </div>
          <Button
            onClick={() => navigate("/upgrade-pro")}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            Upgrade Now
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

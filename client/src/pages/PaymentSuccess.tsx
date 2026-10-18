import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/gtm";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  
  // Get session_id from URL params
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    // Track successful payment
    trackEvent("purchase_success", {
      session_id: sessionId || "",
    });
  }, [sessionId]);

  const handleDashboardClick = () => navigate("/dashboard");
  const handleHomeClick = () => navigate("/");

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-600" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful! 🎉
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-4">
          Thank you for subscribing to The Patient's Compass Pro! Your subscription is now active.
        </p>

        {/* Features List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">You now have access to:</h2>
          <ul className="space-y-3">
            <li className="flex items-center text-gray-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
              Unlimited AI health insights
            </li>
            <li className="flex items-center text-gray-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
              Advanced lab analysis
            </li>
            <li className="flex items-center text-gray-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
              Personalized wellness recommendations
            </li>
            <li className="flex items-center text-gray-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
              Priority email support
            </li>
          </ul>
        </div>

        {/* Confirmation Email */}
        <p className="text-sm text-gray-600 mb-6">
          A confirmation email has been sent to your inbox. Check your email for account setup instructions.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleDashboardClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={handleHomeClick}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Back to Home
          </Button>
        </div>

        {/* Billing Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3">
            Need help? Visit our <a href="/support" className="text-blue-600 hover:underline">support page</a> or <a href="/contact" className="text-blue-600 hover:underline">contact us</a>.
          </p>
          <p className="text-xs text-gray-400">
            <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { trackEvent } from "@/lib/gtm";

export default function PaymentCanceled() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Track canceled payment
    trackEvent("purchase_canceled", {});
  }, []);

  const handleRetryClick = () => navigate("/pricing");
  const handleHomeClick = () => navigate("/");

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-red-600" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Canceled
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Your payment was not completed. No charges have been made to your account.
        </p>

        {/* Reasons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">Common reasons:</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>You closed the payment window</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>Your payment method was declined</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>You chose to cancel the transaction</span>
            </li>
          </ul>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-600 mb-6">
          You can try again anytime. If you're having trouble, please contact our support team.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRetryClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Try Again
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

        {/* Support Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Need help? <a href="/support" className="text-blue-600 hover:underline">Visit our support page</a> or <a href="/contact" className="text-blue-600 hover:underline">contact us</a>.
          </p>
          <p className="text-xs text-gray-400">
            <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}

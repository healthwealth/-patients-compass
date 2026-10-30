import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import * as gtm from "./lib/gtm";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "@/_core/hooks/useAuth";

// Pages — public
import Home from "./pages/Home";
import BiomarkerDirectory from "./pages/BiomarkerDirectory";
import BiomarkerDetail from "./pages/BiomarkerDetail";
import LifestyleCustomizer from "./pages/LifestyleCustomizer";
import Books from "./pages/Books";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Pricing from "@/pages/Pricing";
import SignIn from "@/pages/SignIn";
import Signup from "@/pages/Signup";
import AuthError from "@/pages/AuthError";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/Profile";
import DevSignIn from "@/pages/DevSignIn";
import MedicalAssistant from "./pages/MedicalAssistant";
import Features from "./pages/Features";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import CareConnections from "./pages/CareConnections";
import IntegrationHub from "./pages/IntegrationHub";
import SuperKids from "./pages/SuperKids";

// Pages — protected (require authentication)
import Dashboard from "./pages/Dashboard";

// Pages — admin-only
import AdminWaitlist from "@/pages/AdminWaitlist";
import AdminMigration from "@/pages/AdminMigration";
import AdminSignup from "@/pages/AdminSignup";
import AdminControl from "@/pages/AdminControl";
import AdminAnalytics from "@/pages/AdminAnalytics";
import ReferralDashboard from "@/pages/ReferralDashboard";
import UpdateDashboard from "@/pages/UpdateDashboard";
import UpgradePro from "@/pages/UpgradePro";
import PurchaseConfirmation from "@/pages/PurchaseConfirmation";
import { EmailSettings } from "@/pages/EmailSettings";
import { EmailAnalyticsDashboard } from "@/pages/EmailAnalyticsDashboard";
import Unsubscribe from "@/pages/Unsubscribe";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { BlogEditor } from "@/pages/BlogEditor";
import { BiomarkerEditor } from "@/pages/BiomarkerEditor";
import BillingSettings from "@/pages/BillingSettings";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCanceled from "@/pages/PaymentCanceled";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import Favorites from "@/pages/Favorites";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import AdminCollections from "./pages/AdminCollections";
import AdminAssistantAppearance from "./pages/AdminAssistantAppearance";
import AdminCareConnections from "./pages/AdminCareConnections";

// Global widgets / overlays
import MedicalAssistantWidget from "./components/MedicalAssistantWidget";
import SupportChatWidget from "./components/SupportChatWidget";
import CookieConsent from "./components/CookieConsent";
import MaintenanceBanner from "./components/MaintenanceBanner";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";

function Router() {
  return (
    <Switch>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/biomarkers" component={BiomarkerDirectory} />
      <Route path="/biomarkers/:slug" component={BiomarkerDetail} />
      <Route path="/lifestyle" component={LifestyleCustomizer} />
      <Route path="/books" component={Books} />
      <Route path="/medical-assistant" component={MedicalAssistant} />
      <Route path="/features" component={Features} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogArticle} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:slug" component={CollectionDetail} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/care-connections" component={CareConnections} />
      <Route path="/integrations">
        <ProtectedRoute>
          <IntegrationHub />
        </ProtectedRoute>
      </Route>
      <Route path="/super-kids" component={SuperKids} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={Signup} />
      <Route path="/auth/error" component={AuthError} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={Signup} />
      <Route path="/dev/signin" component={DevSignIn} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/contact" component={Contact} />
      <Route path="/support" component={Support} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route path="/faq" component={FAQ} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-canceled" component={PaymentCanceled} />
      <Route path="/purchase-confirmation" component={PurchaseConfirmation} />

      {/* ── Protected routes (must be authenticated) ──────────────────── */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/subscription">
        <ProtectedRoute>
          <SubscriptionManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/favorites">
        <ProtectedRoute>
          <Favorites />
        </ProtectedRoute>
      </Route>

      {/* ── Admin-only routes ──────────────────────────────────────────── */}
      <Route path="/admin/signup" component={AdminSignup} />
      <Route path="/admin/control">
        <ProtectedRoute>
          <AdminControl />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/migration">
        <ProtectedRoute adminOnly>
          <AdminMigration />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/waitlist">
        <ProtectedRoute adminOnly>
          <AdminWaitlist />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute adminOnly>
          <AdminAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/referrals">
        <ProtectedRoute>
          <ReferralDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/email-analytics">
        <ProtectedRoute adminOnly>
          <EmailAnalyticsDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/blog/create">
        <ProtectedRoute adminOnly>
          <BlogEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/collections">
        <ProtectedRoute adminOnly>
          <AdminCollections />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/assistant-appearance">
        <ProtectedRoute adminOnly>
          <AdminAssistantAppearance />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/care-connections">
        <ProtectedRoute adminOnly>
          <AdminCareConnections />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/biomarkers/create">
        <ProtectedRoute adminOnly>
          <BiomarkerEditor />
        </ProtectedRoute>
      </Route>

      {/* ── User routes ────────────────────────────────────────────────── */}
      <Route path="/settings/email">
        <ProtectedRoute>
          <EmailSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/billing">
        <ProtectedRoute>
          <BillingSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/update-dashboard">
        <ProtectedRoute>
          <UpdateDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/upgrade-pro" component={UpgradePro} />

      {/* ── Fallback ───────────────────────────────────────────────────── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AnalyticsTracker() {
  const [location] = useLocation();

  useEffect(() => {
    gtm.trackPageView(location, document.title);
  }, [location]);

  return null;
}

function OAuthWelcomeToast() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user || sessionStorage.getItem("patients-compass-oauth-pending") !== "1") return;
    sessionStorage.removeItem("patients-compass-oauth-pending");
    const rememberMe = sessionStorage.getItem("patients-compass-oauth-remember-me") === "1";
    sessionStorage.removeItem("patients-compass-oauth-remember-me");
    sessionStorage.removeItem("patients-compass-oauth-retry-count");
    if (rememberMe) {
      localStorage.setItem("patients-compass-session-expires-at", String(Date.now() + 365 * 24 * 60 * 60 * 1000));
    } else {
      localStorage.removeItem("patients-compass-session-expires-at");
    }
    toast.success(`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}!`, {
      description: "Your Patients Compass session is ready.",
      duration: 4200,
    });
  }, [isAuthenticated, user]);

  return null;
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), then change
//   the colour palette in index.css to keep consistent foreground/background across components.
// - If you want to make the theme switchable, pass `switchable` to ThemeProvider and use
//   the `useTheme` hook wherever a toggle is needed.

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster position="top-center" />
          <AnalyticsTracker />
          <OAuthWelcomeToast />
          <div className="flex flex-col min-h-screen">
            <MaintenanceBanner />
            <div className="flex-1">
              <Router />
            </div>
          </div>
          <FloatingChatWidgets />
          <SessionTimeoutWarning />
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * The floating chat bubbles, hidden on the full-page assistant where they
 * would repeat it and cover its Send button on phones.
 */
function FloatingChatWidgets() {
  const [location] = useLocation();
  // Kept mounted (just hidden) so an open widget conversation survives a visit to that page.
  const hidden = location.startsWith("/medical-assistant");
  return (
    <div className={hidden ? "hidden" : undefined}>
      <MedicalAssistantWidget />
      <SupportChatWidget />
    </div>
  );
}

export default App;

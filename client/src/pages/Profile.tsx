import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, LogOut, Trash2, Mail, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  // Newsletter preferences state
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [transactionalOptIn, setTransactionalOptIn] = useState(true);
  const [digestsOptIn, setDigestsOptIn] = useState(true);

  // Email verification state
  const [newEmailForVerification, setNewEmailForVerification] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showEmailVerificationForm, setShowEmailVerificationForm] = useState(false);

  // Queries
  const { data: profile, isLoading: profileLoading } = trpc.profile.getProfile.useQuery();
  const { data: subscription } = trpc.profile.getSubscription.useQuery();
  const { data: newsletterPrefs } = trpc.profile.getNewsletterPreferences.useQuery();
  const { data: billingHistory } = trpc.profile.getBillingHistory.useQuery();

  // Load newsletter preferences when they arrive
  useEffect(() => {
    if (newsletterPrefs) {
      setMarketingOptIn(newsletterPrefs.marketing);
      setTransactionalOptIn(newsletterPrefs.transactional);
      setDigestsOptIn(newsletterPrefs.digests);
    }
  }, [newsletterPrefs]);

  // Mutations
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
      setIsLoading(false);
    },
  });

  const changePassword = trpc.profile.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
      setIsLoading(false);
    },
  });

  const deleteAccount = trpc.profile.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Account deleted successfully");
      setTimeout(() => {
        logout();
        window.location.href = "/";
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete account");
      setIsLoading(false);
    },
  });

  const updateNewsletterPrefs = trpc.profile.updateNewsletterPreferences.useMutation({
    onSuccess: () => {
      toast.success("Newsletter preferences updated");
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update preferences");
      setIsLoading(false);
    },
  });

  const sendEmailVerification = trpc.profile.sendEmailVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent to your new email");
      setShowEmailVerificationForm(true);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send verification code");
      setIsLoading(false);
    },
  });

  const verifyEmailChange = trpc.profile.verifyEmailChange.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setNewEmailForVerification("");
      setVerificationCode("");
      setShowEmailVerificationForm(false);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify email");
      setIsLoading(false);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4 flex items-center justify-center">
        <Card className="border-[#EBE6DC] shadow-lg max-w-md w-full">
          <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <CardTitle>Not Authenticated</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="text-[#5C5A59] mb-4">Please sign in to view your profile.</p>
            <Link href="/signin">
              <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white w-full">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editEmail) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    await updateProfile.mutateAsync({
      name: editName !== user?.name ? editName : undefined,
      email: editEmail !== user?.email ? editEmail : undefined,
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    await changePassword.mutateAsync({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }
    setIsLoading(true);
    await deleteAccount.mutateAsync({
      password: deletePassword,
      confirmDelete: true,
    });
  };

  const handleUpdateNewsletterPrefs = async () => {
    setIsLoading(true);
    await updateNewsletterPrefs.mutateAsync({
      marketing: marketingOptIn,
      transactional: transactionalOptIn,
      digests: digestsOptIn,
    });
  };

  const handleSendEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailForVerification) {
      toast.error("Please enter a new email address");
      return;
    }
    setIsLoading(true);
    await sendEmailVerification.mutateAsync({
      newEmail: newEmailForVerification,
    });
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }
    setIsLoading(true);
    await verifyEmailChange.mutateAsync({
      verificationCode,
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7E9A85]" />
      </div>
    );
  }

  const subscriptionStatusColor = {
    free: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    canceled: "bg-red-100 text-red-800",
    past_due: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2C2A29] mb-2">My Profile</h1>
          <p className="text-[#5C5A59]">Manage your account settings and subscription</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#EBE6DC]">
            <TabsTrigger value="account" className="text-[#5C5A59]">
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription" className="text-[#5C5A59]">
              Subscription
            </TabsTrigger>
            <TabsTrigger value="email" className="text-[#5C5A59]">
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="text-[#5C5A59]">
              Security
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6 mt-6">
            <Card className="border-[#EBE6DC] shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg">
                <CardTitle>Account Information</CardTitle>
                <CardDescription className="text-[#FFF5F0]">
                  View and update your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border-[#EBE6DC] focus:border-[#7E9A85]"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="border-[#EBE6DC] focus:border-[#7E9A85]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#5C5A59] font-semibold">Account Created</p>
                      <p className="text-[#2C2A29]">
                        {profile?.createdAt
                          ? format(new Date(profile.createdAt), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#5C5A59] font-semibold">Last Sign In</p>
                      <p className="text-[#2C2A29]">
                        {profile?.lastSignedIn
                          ? format(new Date(profile.lastSignedIn), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6 mt-6">
            <Card className="border-[#EBE6DC] shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg">
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription className="text-[#FFF5F0]">
                  View your active subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="border border-[#EBE6DC] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#2C2A29]">Current Plan</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                          subscriptionStatusColor[
                            subscription?.status as keyof typeof subscriptionStatusColor
                          ] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {subscription?.status || "Free"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#5C5A59] font-semibold">Status</p>
                        <p className="text-[#2C2A29] capitalize">
                          {subscription?.status || "Free"}
                        </p>
                      </div>
                      {subscription?.isTrialActive && (
                        <div>
                          <p className="text-[#5C5A59] font-semibold">Trial Ends</p>
                          <p className="text-[#2C2A29]">
                            {subscription?.trialEndDate
                              ? format(new Date(subscription.trialEndDate), "MMM d, yyyy")
                              : "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Query Usage */}
                  <div className="border border-[#EBE6DC] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#2C2A29] mb-4">AI Query Usage</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#5C5A59] font-semibold">Queries Used Today</p>
                        <p className="text-[#2C2A29]">{subscription?.aiQueryCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-[#5C5A59] font-semibold">Last Reset</p>
                        <p className="text-[#2C2A29]">{subscription?.aiQueryDate || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  {billingHistory && billingHistory.invoices.length > 0 && (
                    <div className="border border-[#EBE6DC] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[#2C2A29] mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Billing History
                      </h3>
                      <div className="space-y-2">
                        {billingHistory.invoices.map((invoice: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm py-2 border-b border-[#EBE6DC] last:border-0">
                            <span className="text-[#5C5A59]">{invoice.date}</span>
                            <span className="text-[#2C2A29] font-semibold">${invoice.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upgrade CTA */}
                  {subscription?.status === "free" && (
                    <Link href="/pricing">
                      <Button className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  )}

                  {subscription?.status === "active" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm">
                        ✓ Your subscription is active. Thank you for your support!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6 mt-6">
            {/* Email Verification */}
            <Card className="border-[#EBE6DC] shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Verification
                </CardTitle>
                <CardDescription className="text-[#FFF5F0]">
                  Change your email address with verification
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {!showEmailVerificationForm ? (
                  <form onSubmit={handleSendEmailVerification} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                        New Email Address
                      </label>
                      <Input
                        type="email"
                        value={newEmailForVerification}
                        onChange={(e) => setNewEmailForVerification(e.target.value)}
                        className="border-[#EBE6DC] focus:border-[#7E9A85]"
                        placeholder="Enter your new email"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailChange} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        ✓ Verification code sent to <strong>{newEmailForVerification}</strong>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                        Verification Code (6 digits)
                      </label>
                      <Input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                        className="border-[#EBE6DC] focus:border-[#7E9A85]"
                        placeholder="000000"
                        maxLength={6}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1 bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEmailVerificationForm(false);
                          setVerificationCode("");
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Newsletter Preferences */}
            <Card className="border-[#EBE6DC] shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg">
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription className="text-[#FFF5F0]">
                  Manage your newsletter and email subscription settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-[#EBE6DC] rounded-lg hover:bg-[#F9F6F0] transition">
                    <div>
                      <p className="font-semibold text-[#2C2A29]">Marketing Emails</p>
                      <p className="text-sm text-[#5C5A59]">Receive product updates and promotions</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="w-5 h-5 rounded border-[#EBE6DC] text-[#7E9A85] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-[#EBE6DC] rounded-lg hover:bg-[#F9F6F0] transition">
                    <div>
                      <p className="font-semibold text-[#2C2A29]">Transactional Emails</p>
                      <p className="text-sm text-[#5C5A59]">Important account and billing notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={transactionalOptIn}
                      onChange={(e) => setTransactionalOptIn(e.target.checked)}
                      disabled
                      className="w-5 h-5 rounded border-[#EBE6DC] text-[#7E9A85] cursor-not-allowed opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-[#EBE6DC] rounded-lg hover:bg-[#F9F6F0] transition">
                    <div>
                      <p className="font-semibold text-[#2C2A29]">Weekly Digests</p>
                      <p className="text-sm text-[#5C5A59]">Health insights and wellness summaries</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={digestsOptIn}
                      onChange={(e) => setDigestsOptIn(e.target.checked)}
                      className="w-5 h-5 rounded border-[#EBE6DC] text-[#7E9A85] cursor-pointer"
                    />
                  </div>

                  <Button
                    onClick={handleUpdateNewsletterPrefs}
                    className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Change Password */}
            <Card className="border-[#EBE6DC] shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg">
                <CardTitle>Change Password</CardTitle>
                <CardDescription className="text-[#FFF5F0]">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="border-[#EBE6DC] focus:border-[#7E9A85] pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E9A85] hover:text-[#6A8571]"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border-[#EBE6DC] focus:border-[#7E9A85] pr-10"
                        disabled={isLoading}
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E9A85] hover:text-[#6A8571]"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-[#EBE6DC] focus:border-[#7E9A85] pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E9A85] hover:text-[#6A8571]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-red-50">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Account
                </CardTitle>
                <CardDescription className="text-red-100">
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm font-semibold">⚠️ Warning</p>
                  <p className="text-red-700 text-sm mt-1">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>

                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                      Type "DELETE" to confirm
                    </label>
                    <Input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                      className="border-red-200 focus:border-red-500"
                      placeholder="DELETE"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="border-[#EBE6DC] focus:border-[#7E9A85]"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={isLoading || deleteConfirm !== "DELETE"}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Button
              onClick={logout}
              className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

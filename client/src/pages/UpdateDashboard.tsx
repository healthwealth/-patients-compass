import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Bell, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function UpdateDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC]">
        <p className="text-[#5C5A59]">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] px-4">
        <Card className="max-w-md w-full border-[#EBE6DC]">
          <CardHeader>
            <CardTitle className="text-[#2C2A29]">Sign In Required</CardTitle>
            <CardDescription>Please sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
              onClick={() => window.location.href = getLoginUrl("/update-dashboard")}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    toast.success("Dashboard updated successfully!");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#7E9A85] hover:text-[#6A8571] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2C2A29] mb-2">My Dashboard</h1>
          <p className="text-[#5C5A59]">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-[#EBE6DC] border border-[#D48C70]">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#7E9A85] data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-[#7E9A85] data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-[#7E9A85] data-[state=active]:text-white">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="border-[#EBE6DC]">
              <CardHeader>
                <CardTitle className="text-[#2C2A29]">Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#2C2A29] font-semibold">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="mt-2 border-[#EBE6DC]"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-[#2C2A29] font-semibold">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="mt-2 border-[#EBE6DC]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  {!isEditing ? (
                    <Button 
                      className="bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className="bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                        onClick={handleSave}
                      >
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-[#EBE6DC] text-[#5C5A59]"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-[#EBE6DC]">
              <CardHeader>
                <CardTitle className="text-[#2C2A29]">Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-[#5C5A59]">Notification settings coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="border-[#EBE6DC]">
              <CardHeader>
                <CardTitle className="text-[#2C2A29]">Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="border-[#EBE6DC] text-[#5C5A59] hover:bg-[#EBE6DC]/40">
                    Change Password
                  </Button>
                  <Button variant="outline" className="border-[#EBE6DC] text-[#5C5A59] hover:bg-[#EBE6DC]/40">
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

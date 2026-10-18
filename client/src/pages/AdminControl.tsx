import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Users, BarChart3, Lock, ArrowLeft, TrendingUp, Activity, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function AdminControl() {
  const { user, isAuthenticated, loading } = useAuth();

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
            <CardTitle className="text-[#2C2A29]">Admin Access Required</CardTitle>
            <CardDescription>Please sign in to access the admin control panel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
              onClick={() => window.location.href = getLoginUrl("/admin/control")}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] px-4">
        <Card className="max-w-md w-full border-[#EBE6DC]">
          <CardHeader>
            <CardTitle className="text-[#2C2A29]">Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="text-[#7E9A85] hover:text-[#6A8571]">
              Return to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#7E9A85] hover:text-[#6A8571] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2C2A29] mb-2">Admin Control Panel</h1>
          <p className="text-[#5C5A59]">Manage your Patient's Compass platform</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#EBE6DC] border-[#D1C7BD]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-[#EBE6DC]">
                <CardHeader>
                  <CardTitle className="text-[#2C2A29] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#7E9A85]" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#7E9A85]">—</p>
                  <p className="text-sm text-[#5C5A59] mt-2">Coming soon</p>
                </CardContent>
              </Card>

              <Card className="border-[#EBE6DC]">
                <CardHeader>
                  <CardTitle className="text-[#2C2A29] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#D4A574]" />
                    Active Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#D4A574]">—</p>
                  <p className="text-sm text-[#5C5A59] mt-2">Coming soon</p>
                </CardContent>
              </Card>

              <Card className="border-[#EBE6DC]">
                <CardHeader>
                  <CardTitle className="text-[#2C2A29] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#8B7355]" />
                    Platform Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  <p className="text-sm text-[#5C5A59] mt-2">All systems running</p>
                </CardContent>
              </Card>
            </div>
            <Card className="border-[#C9D8CB] bg-[#F7FBF7]">
              <CardHeader>
                <CardTitle className="text-[#2C2A29]">Licensed Care Connections</CardTitle>
                <CardDescription>Review partner licensing, service states, specialties, and publication status.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/care-connections"><Button className="bg-[#71917A] text-white hover:bg-[#607A68]">Open partner manager</Button></Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-[#EBE6DC]">
              <CardHeader>
                <CardTitle className="text-[#2C2A29]">User Management</CardTitle>
                <CardDescription>Manage platform users and their access</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[#5C5A59]">User management features coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-[#EBE6DC]">
              <CardHeader>
                <CardTitle className="text-[#2C2A29]">Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[#5C5A59]">Settings management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

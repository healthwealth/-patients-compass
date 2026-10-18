import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Download, TrendingUp, Users, Heart, Mail, Palette } from "lucide-react";
import { CombinedAnalyticsView } from "@/components/AnalyticsCharts";

export function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check admin access
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch analytics data
  const userGrowth = trpc.adminAnalytics.getUserGrowth.useQuery({
    days: 30,
  });

  const subscriptionMetrics = trpc.adminAnalytics.getSubscriptionMetrics.useQuery();

  const engagementMetrics = trpc.adminAnalytics.getEngagementMetrics.useQuery();

  const cohortRetention = trpc.adminAnalytics.getCohortRetention.useQuery({});

  // Note: getExportData is a query, not a mutation. For export, we'll use a button click handler

  const handleExport = (type: "users" | "emails" | "subscriptions") => {
    // Placeholder for export functionality
    console.log(`Export ${type} clicked`);
    // In production, this would trigger an API call to generate and download the CSV
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground">
              Monitor platform metrics, user growth, and subscription performance
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/admin/collections")} className="gap-2">
                <Heart className="h-4 w-4" />
                Manage collections
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/assistant-appearance")} className="gap-2">
                <Palette className="h-4 w-4" />
                Health Companion portrait
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* User Growth Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userGrowth.data?.totalSignups || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{userGrowth.data?.avgDaily || 0} avg daily
                  </p>
                </CardContent>
              </Card>

              {/* Active Subscriptions Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {subscriptionMetrics.data?.active || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionMetrics.data?.conversionRate || 0}% conversion rate
                  </p>
                </CardContent>
              </Card>

              {/* Total Subscriptions Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {subscriptionMetrics.data?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionMetrics.data?.churnRate || 0}% churn rate
                  </p>
                </CardContent>
              </Card>

              {/* Email Engagement Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {engagementMetrics.data?.emailOpenRate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {engagementMetrics.data?.activeUsers || 0} active users
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* User Growth Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth (Last 30 Days)</CardTitle>
                <CardDescription>Daily new signups and cumulative users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Chart visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Free Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {subscriptionMetrics.data?.free || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Free plan users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {subscriptionMetrics.data?.active || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Active paid plans
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Canceled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {subscriptionMetrics.data?.canceled || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Canceled subscriptions
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Churn Rate</span>
                  <span className="text-lg font-semibold">
                    {subscriptionMetrics.data?.churnRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="text-lg font-semibold">
                    {subscriptionMetrics.data?.conversionRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Trial</span>
                  <span className="text-lg font-semibold">
                    {subscriptionMetrics.data?.inTrial || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Email and platform activity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Users (7 days)</span>
                  <span className="text-lg font-semibold">
                    {engagementMetrics.data?.activeUsers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email Open Rate</span>
                  <span className="text-lg font-semibold">
                    {engagementMetrics.data?.emailOpenRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Rate</span>
                  <span className="text-lg font-semibold">
                    {engagementMetrics.data?.activeRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Sessions Per User</span>
                  <span className="text-lg font-semibold">
                    {engagementMetrics.data?.avgSessionsPerUser || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retention Tab */}
          <TabsContent value="retention" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention Analysis</CardTitle>
                <CardDescription>User retention by signup cohort (90 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Retention cohort table coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Export data for analysis and reporting</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => handleExport("users")}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Users
            </Button>
            <Button
              onClick={() => handleExport("emails")}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Email Campaigns
            </Button>
            <Button
              onClick={() => handleExport("subscriptions")}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Subscriptions
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          EDUCATIONAL CONTENT ONLY
        </p>
      </div>
    </div>
  );
}

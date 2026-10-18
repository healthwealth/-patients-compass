import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Share2,
  ArrowLeft,
  Calendar,
  Loader2,
  Download,
} from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { buildConversionFunnelCsv } from "@shared/conversionFunnelCsv";
import { SUPER_KIDS_PDF_FUNNEL } from "@/lib/superKidsFunnel";

const COLORS = {
  primary: "#7E9A85",
  secondary: "#D48C70",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export default function AdminAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  // Check if user is admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#2C2A29]">Access Denied</h1>
          <p className="text-[#5C5A59]">You must be an admin to view this dashboard.</p>
          <Link href="/">
            <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = trpc.analytics.getDashboard.useQuery();
  const { data: funnelData, isLoading: funnelLoading } = trpc.adminAnalytics.getConversionFunnel.useQuery({ days: Number(dateRange.slice(0, -1)) });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#7E9A85] animate-spin mx-auto" />
          <p className="text-[#5C5A59]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#2C2A29]">No Data Available</h1>
          <p className="text-[#5C5A59]">Analytics data is not yet available.</p>
        </div>
      </div>
    );
  }

  const {
    latestSnapshot,
    conversionMetrics,
    revenueMetrics,
    userGrowthMetrics,
  } = dashboardData;

  // Prepare chart data
  const conversionChartData = [
    {
      name: "Trial to Pro",
      value: conversionMetrics.trialToProConversionRate.toFixed(1),
    },
    {
      name: "Free to Pro",
      value: conversionMetrics.freeToProConversionRate.toFixed(1),
    },
    {
      name: "Referral",
      value: conversionMetrics.referralConversionRate.toFixed(1),
    },
  ];

  const userGrowthChartData = [
    { name: "Total Users", value: userGrowthMetrics.totalUsers },
    { name: "Active Users", value: userGrowthMetrics.activeUsers },
    { name: "Trial Users", value: userGrowthMetrics.trialUsers },
    { name: "Pro Users", value: userGrowthMetrics.proUsers },
    { name: "Free Users", value: userGrowthMetrics.freeUsers },
  ];

  const revenueChartData = [
    {
      name: "MRR",
      value: (revenueMetrics.monthlyRecurringRevenue / 100).toFixed(2),
    },
    {
      name: "ARR",
      value: (revenueMetrics.annualRecurringRevenue / 100).toFixed(2),
    },
  ];

  const handleExportCSV = () => {
    const csvRows = [
      ["The Patient's Compass - Analytics Report"],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Date Range: ${dateRange}`],
      [],
      ["KEY METRICS"],
      ["Total Users", userGrowthMetrics?.totalUsers || 0],
      ["Monthly Revenue (MRR)", `$${((revenueMetrics?.monthlyRecurringRevenue || 0) / 100).toFixed(2)}`],
      ["Annual Revenue (ARR)", `$${((revenueMetrics?.annualRecurringRevenue || 0) / 100).toFixed(2)}`],
      ["Trial to Pro Conversion", `${conversionMetrics?.trialToProConversionRate || 0}%`],
      ["Referral Conversion Rate", `${conversionMetrics?.referralConversionRate || 0}%`],
      [],
      ["USER METRICS"],
      ["Active Users", userGrowthMetrics?.activeUsers || 0],
      ["Trial Users", userGrowthMetrics?.trialUsers || 0],
      ["Pro Users", userGrowthMetrics?.proUsers || 0],
      ["Free Users", userGrowthMetrics?.freeUsers || 0],
      [],
      ["LATEST SNAPSHOT"],
      ["Snapshot Date", latestSnapshot?.snapshotDate || "N/A"],
      ["New Users Today", latestSnapshot?.newUsersToday || 0],
      ["Active Subscriptions", latestSnapshot?.activeSubscriptions || 0],
      ["Emails Sent Today", latestSnapshot?.emailsSentToday || 0],
      ["Email Open Rate", `${latestSnapshot?.emailOpenRate || 0}%`],
    ];

    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Analytics report exported as CSV");
  };

  const handleExportFunnelCSV = () => {
    if (!funnelData) return;
    const blob = new Blob([buildConversionFunnelCsv(funnelData)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `patients-compass-conversion-funnel-${funnelData.periodDays}d.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Conversion funnel exported as CSV");
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Admin Analytics Dashboard"
        description="Analytics dashboard for The Patient's Compass admins"
        path="/admin/analytics"
      />

      {/* Header */}
      <div className="bg-[#2C2A29] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#7E9A85] text-sm font-semibold hover:text-[#9ABBA2] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-[#D48C70] p-2 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#D48C70] text-xs font-bold uppercase tracking-widest">
              Admin Dashboard
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">
            Analytics Dashboard
          </h1>
          <p className="text-[#C5C0B5] text-base max-w-xl leading-relaxed">
            Real-time metrics for conversion rates, revenue, user growth, and referral program performance.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Date Range Selector */}
        <div className="flex gap-2 justify-between items-center">
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                className={`${
                  dateRange === range
                    ? "bg-[#7E9A85] text-white"
                    : "border-[#EBE6DC] text-[#5C5A59]"
                }`}
                onClick={() => setDateRange(range)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleExportCSV}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <Card className="border-[#D8E4D9] bg-[#F7FBF7]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-[#2C2A29]"><TrendingUp className="h-5 w-5 text-[#6F8D78]" />Super Kids PDF funnel</CardTitle>
            <p className="text-sm leading-6 text-[#6B6966]">GA4-ready aggregate events compare preview intent with completed download clicks without collecting visitor, child, or health data.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {SUPER_KIDS_PDF_FUNNEL.steps.map((step, index) => (
                <div key={step.key} className="rounded-xl border border-[#D8E4D9] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F8D78]">Step {index + 1}</p>
                  <p className="mt-1 font-semibold text-[#344B39]">{step.label}</p>
                  <code className="mt-2 block break-all text-xs text-[#7B766F]">{step.event}</code>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#7B766F]">In GA4 Explore, create a funnel using these events and filter by <code>{SUPER_KIDS_PDF_FUNNEL.name}</code> to compare step-two conversions.</p>
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card className="border-[#EBE6DC]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#5C5A59] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7E9A85]" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2C2A29]">
                {userGrowthMetrics.totalUsers}
              </div>
              <p className="text-xs text-[#9E9A90] mt-1">
                {userGrowthMetrics.activeUsers} active today
              </p>
            </CardContent>
          </Card>

          {/* MRR */}
          <Card className="border-[#EBE6DC]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#5C5A59] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#D48C70]" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2C2A29]">
                ${(revenueMetrics.monthlyRecurringRevenue / 100).toFixed(2)}
              </div>
              <p className="text-xs text-[#9E9A90] mt-1">
                {userGrowthMetrics.proUsers} active subscriptions
              </p>
            </CardContent>
          </Card>

          {/* Trial to Pro Conversion */}
          <Card className="border-[#EBE6DC]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#5C5A59] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                Trial Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2C2A29]">
                {conversionMetrics.trialToProConversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-[#9E9A90] mt-1">
                Trial to Pro rate
              </p>
            </CardContent>
          </Card>

          {/* Referral Conversions */}
          <Card className="border-[#EBE6DC]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#5C5A59] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#F59E0B]" />
                Referral Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2C2A29]">
                {conversionMetrics.referralConversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-[#9E9A90] mt-1">
                Referral conversion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <Card className="border-[#EBE6DC] bg-white">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#7E9A85]" />Application conversion funnel</CardTitle><Button size="sm" variant="outline" className="border-[#DCD3C7] text-[#51715B]" disabled={!funnelData} onClick={handleExportFunnelCSV}><Download className="mr-1.5 h-4 w-4" />Export funnel CSV</Button></div>
            <p className="text-sm font-normal leading-6 text-[#736E68]">Aggregate application milestones for the selected period. This view contains no names, emails, health data, or individual activity.</p>
          </CardHeader>
          <CardContent>
            {funnelLoading ? <div className="h-24 animate-pulse rounded-xl bg-[#F5F1EA]" /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {funnelData?.stages.map((stage, index) => (
                  <div key={stage.label} className="rounded-xl border border-[#E9E2D7] bg-[#FDFBF8] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#7E9A85]">Step {index + 1}</p>
                    <p className="mt-2 text-sm font-semibold text-[#34312E]">{stage.label}</p>
                    <p className="mt-3 font-serif text-3xl font-bold">{stage.count}</p>
                    <p className="mt-1 text-xs text-[#756F68]">{index === 0 ? "Starting cohort" : `${stage.conversionFromPrevious}% from previous step`}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Rates */}
          <Card className="border-[#EBE6DC]">
            <CardHeader>
              <CardTitle>Conversion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBE6DC" />
                  <XAxis dataKey="name" stroke="#9E9A90" />
                  <YAxis stroke="#9E9A90" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F9F6F0",
                      border: "1px solid #EBE6DC",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card className="border-[#EBE6DC]">
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userGrowthChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userGrowthChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            COLORS.primary,
                            COLORS.secondary,
                            COLORS.warning,
                            COLORS.success,
                            COLORS.danger,
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Metrics */}
          <Card className="border-[#EBE6DC]">
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBE6DC" />
                  <XAxis dataKey="name" stroke="#9E9A90" />
                  <YAxis stroke="#9E9A90" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F9F6F0",
                      border: "1px solid #EBE6DC",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `$${value}`}
                  />
                  <Bar dataKey="value" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card className="border-[#EBE6DC]">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5C5A59]">Free to Pro Conversion</span>
                  <span className="font-semibold text-[#2C2A29]">
                    {conversionMetrics.freeToProConversionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#EBE6DC] rounded-full h-2">
                  <div
                    className="bg-[#7E9A85] h-2 rounded-full"
                    style={{
                      width: `${Math.min(conversionMetrics.freeToProConversionRate, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5C5A59]">Trial Users</span>
                  <span className="font-semibold text-[#2C2A29]">
                    {userGrowthMetrics.trialUsers}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5C5A59]">Pro Users</span>
                  <span className="font-semibold text-[#2C2A29]">
                    {userGrowthMetrics.proUsers}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5C5A59]">Free Users</span>
                  <span className="font-semibold text-[#2C2A29]">
                    {userGrowthMetrics.freeUsers}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EBE6DC] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5C5A59]">ARR</span>
                  <span className="font-semibold text-[#2C2A29]">
                    ${(revenueMetrics.annualRecurringRevenue / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Snapshot Info */}
        {latestSnapshot && (
          <Card className="border-[#EBE6DC]">
            <CardHeader>
              <CardTitle>Latest Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">New Users Today</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.newUsersToday}</p>
                </div>
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">Active Trials</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.activeTrials}</p>
                </div>
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">Active Subscriptions</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.activeSubscriptions}</p>
                </div>
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">New Referrals</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.newReferralsToday}</p>
                </div>
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">Referral Conversions</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.referralConversionsToday}</p>
                </div>
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">Emails Sent</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.emailsSentToday}</p>
                </div>
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">Email Open Rate</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.emailOpenRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[#9E9A90] text-xs uppercase font-semibold">Churn Rate</p>
                  <p className="text-lg font-bold text-[#2C2A29]">{latestSnapshot.churnRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

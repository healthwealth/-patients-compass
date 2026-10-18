import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export function EmailAnalyticsDashboard() {
  const [, navigate] = useLocation();
  const [selectedCampaign, setSelectedCampaign] = useState<"trialExpiration" | "onboarding" | "reEngagement" | "weeklyDigest">("trialExpiration");

  // Fetch overall metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.emailPreferences.getCampaignMetrics.useQuery();

  // Fetch detailed stats for selected campaign
  const { data: campaignStats, isLoading: statsLoading } = trpc.emailPreferences.getCampaignStats.useQuery({
    campaign: selectedCampaign,
  });

  if (metricsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const campaigns = metrics?.campaigns;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor campaign performance and email engagement metrics</p>
      </div>

      {/* Overall Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {campaigns && (
          <>
            {/* Trial Expiration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Trial Expiration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.trialExpiration.sent}</div>
                <p className="text-xs text-gray-600 mt-1">Sent • {campaigns.trialExpiration.openRate}% opened</p>
              </CardContent>
            </Card>

            {/* Onboarding Average */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Onboarding (Avg)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.onboarding.average.sent}</div>
                <p className="text-xs text-gray-600 mt-1">Sent • {campaigns.onboarding.average.openRate}% opened</p>
              </CardContent>
            </Card>

            {/* Re-engagement */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Re-engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.reEngagement.sent}</div>
                <p className="text-xs text-gray-600 mt-1">Sent • {campaigns.reEngagement.openRate}% opened</p>
              </CardContent>
            </Card>

            {/* Weekly Digest */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Weekly Digest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.weeklyDigest.sent}</div>
                <p className="text-xs text-gray-600 mt-1">Sent • {campaigns.weeklyDigest.openRate}% opened</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Campaign Comparison */}
      {campaigns && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Campaign Performance Comparison</CardTitle>
            <CardDescription>Open rates across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: "Trial Expiration",
                    openRate: campaigns.trialExpiration.openRate,
                    sent: campaigns.trialExpiration.sent,
                  },
                  {
                    name: "Onboarding (Avg)",
                    openRate: campaigns.onboarding.average.openRate,
                    sent: campaigns.onboarding.average.sent,
                  },
                  {
                    name: "Re-engagement",
                    openRate: campaigns.reEngagement.openRate,
                    sent: campaigns.reEngagement.sent,
                  },
                  {
                    name: "Weekly Digest",
                    openRate: campaigns.weeklyDigest.openRate,
                    sent: campaigns.weeklyDigest.sent,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" label={{ value: "Open Rate (%)", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: "Emails Sent", angle: 90, position: "insideRight" }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="openRate" fill="#10b981" name="Open Rate (%)" />
                <Bar yAxisId="right" dataKey="sent" fill="#3b82f6" name="Emails Sent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Campaign Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Trend Analysis</CardTitle>
              <CardDescription>Select a campaign to view detailed performance trends</CardDescription>
            </div>
            <Select value={selectedCampaign} onValueChange={(value: any) => setSelectedCampaign(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trialExpiration">Trial Expiration</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="reEngagement">Re-engagement</SelectItem>
                <SelectItem value="weeklyDigest">Weekly Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : campaignStats ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">Total Sent</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">{campaignStats.totalSent}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-900">Total Opened</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">{campaignStats.totalOpened}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm font-medium text-purple-900">Open Rate</p>
                  <p className="mt-2 text-2xl font-bold text-purple-600">{campaignStats.overallOpenRate}%</p>
                </div>
              </div>

              {/* Trend Chart */}
              {campaignStats.trend && campaignStats.trend.length > 0 && (
                <div className="rounded-lg border bg-white p-4">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">Daily Performance Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={campaignStats.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" label={{ value: "Emails Sent", angle: -90, position: "insideLeft" }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: "Open Rate (%)", angle: 90, position: "insideRight" }} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="sent" stroke="#3b82f6" name="Emails Sent" />
                      <Line yAxisId="right" type="monotone" dataKey="openRate" stroke="#10b981" name="Open Rate (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {(!campaignStats.trend || campaignStats.trend.length === 0) && (
                <div className="rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-600">No data available for this campaign yet</p>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Educational Notice */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <p>
          <strong>EDUCATIONAL CONTENT ONLY:</strong> These analytics help us understand email engagement and improve our communication. All data is aggregated and anonymized to protect user privacy.
        </p>
      </div>
    </div>
  );
}

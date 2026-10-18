import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Save, Plus, X } from "lucide-react";

interface Biomarker {
  name: string;
  category: "cardiovascular" | "metabolic" | "immune" | "hormonal" | "nutritional";
  optimalMin: number;
  optimalMax: number;
  unit: string;
  description: string;
  interpretation: string;
  recommendations: string[];
}

export function BiomarkerEditor() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [biomarker, setBiomarker] = useState<Biomarker>({
    name: "",
    category: "metabolic",
    optimalMin: 0,
    optimalMax: 100,
    unit: "",
    description: "",
    interpretation: "",
    recommendations: [],
  });
  const [recommendationInput, setRecommendationInput] = useState("");

  if (user && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  const createBiomarker = trpc.contentManagement.createBiomarker.useMutation();

  const handleCreateBiomarker = async () => {
    try {
      const result = await createBiomarker.mutateAsync(biomarker);
      if (result?.success) {
        alert("Biomarker created successfully!");
        navigate("/admin/biomarkers");
      }
    } catch (error) {
      console.error("Failed to create biomarker:", error);
      alert("Failed to create biomarker");
    }
  };

  const handleAddRecommendation = () => {
    if (recommendationInput.trim() && biomarker.recommendations.length < 10) {
      setBiomarker({
        ...biomarker,
        recommendations: [...biomarker.recommendations, recommendationInput.trim()],
      });
      setRecommendationInput("");
    }
  };

  const handleRemoveRecommendation = (index: number) => {
    setBiomarker({
      ...biomarker,
      recommendations: biomarker.recommendations.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Biomarker</h1>
          <p className="text-muted-foreground">Add a new lab biomarker to the directory</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name */}
            <Card>
              <CardHeader>
                <CardTitle>Biomarker Name</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g., Hemoglobin A1C"
                  value={biomarker.name}
                  onChange={(e) => setBiomarker({ ...biomarker, name: e.target.value })}
                  className="text-lg"
                />
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={biomarker.category}
                  onChange={(e) => setBiomarker({ ...biomarker, category: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="cardiovascular">Cardiovascular</option>
                  <option value="metabolic">Metabolic</option>
                  <option value="immune">Immune</option>
                  <option value="hormonal">Hormonal</option>
                  <option value="nutritional">Nutritional</option>
                </select>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Explain what this biomarker measures..."
                  value={biomarker.description}
                  onChange={(e) => setBiomarker({ ...biomarker, description: e.target.value })}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Optimal Range */}
            <Card>
              <CardHeader>
                <CardTitle>Optimal Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Minimum</Label>
                    <Input
                      type="number"
                      value={biomarker.optimalMin}
                      onChange={(e) => setBiomarker({ ...biomarker, optimalMin: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Maximum</Label>
                    <Input
                      type="number"
                      value={biomarker.optimalMax}
                      onChange={(e) => setBiomarker({ ...biomarker, optimalMax: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input
                    placeholder="e.g., mg/dL, mmol/L"
                    value={biomarker.unit}
                    onChange={(e) => setBiomarker({ ...biomarker, unit: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Interpretation */}
            <Card>
              <CardHeader>
                <CardTitle>Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Explain how to interpret the results..."
                  value={biomarker.interpretation}
                  onChange={(e) => setBiomarker({ ...biomarker, interpretation: e.target.value })}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add recommendation..."
                    value={recommendationInput}
                    onChange={(e) => setRecommendationInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddRecommendation()}
                    className="text-sm"
                  />
                  <Button onClick={handleAddRecommendation} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {biomarker.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                      <span>{rec}</span>
                      <button onClick={() => handleRemoveRecommendation(idx)} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Create */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publish</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateBiomarker}
                  disabled={createBiomarker.isPending || !biomarker.name || !biomarker.description}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  {createBiomarker.isPending ? "Creating..." : "Create Biomarker"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          EDUCATIONAL CONTENT ONLY
        </p>
      </div>
    </div>
  );
}

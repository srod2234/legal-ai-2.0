/**
 * Personal Injury Practice Area Page
 *
 * Specialized interface for personal injury cases with:
 * - Medical records assessment
 * - Damages calculation
 * - Comparable case analysis
 * - Settlement estimation
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  DollarSign,
  FileText,
  Scale,
  TrendingUp,
  Download,
  RefreshCw,
} from 'lucide-react';
import MedicalAssessment from '@/components/practice/pi/MedicalAssessment';
import DamagesCalculator from '@/components/practice/pi/DamagesCalculator';
import ComparableCases from '@/components/practice/pi/ComparableCases';

interface CaseDocument {
  id: number;
  name: string;
  documentType: string;
  uploadDate: string;
}

export default function PersonalInjury() {
  const [selectedCase, setSelectedCase] = useState<CaseDocument | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Mock recent PI cases
  const recentCases: CaseDocument[] = [
    {
      id: 1,
      name: 'Smith v. TechCorp - Motor Vehicle Accident',
      documentType: 'Medical Records',
      uploadDate: '2025-09-25',
    },
    {
      id: 2,
      name: 'Johnson v. Metro Transit - Slip and Fall',
      documentType: 'Case File',
      uploadDate: '2025-09-20',
    },
    {
      id: 3,
      name: 'Martinez Personal Injury Claim',
      documentType: 'Medical Records',
      uploadDate: '2025-09-15',
    },
  ];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAnalyzing(false);
    setAnalysisComplete(true);
  };

  const handleRefresh = () => {
    setAnalysisComplete(false);
    handleAnalyze();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting PI analysis...');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Personal Injury Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Specialized tools for personal injury case evaluation and damages calculation
            </p>
          </div>
          <div className="flex items-center gap-2">
            {analysisComplete && (
              <>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-6">
          {/* Case Selection */}
          {!selectedCase && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Personal Injury Case</CardTitle>
                <CardDescription>
                  Choose a case to perform specialized personal injury analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCases.map((caseDoc) => (
                    <div
                      key={caseDoc.id}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedCase(caseDoc)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{caseDoc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {caseDoc.documentType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Uploaded: {new Date(caseDoc.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Analyze
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">What you can do:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Assess medical records and injury severity</li>
                    <li>• Calculate economic and non-economic damages</li>
                    <li>• Find comparable case outcomes</li>
                    <li>• Estimate settlement ranges</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Trigger */}
          {selectedCase && !analysisComplete && (
            <Card>
              <CardHeader>
                <CardTitle>Analyzing: {selectedCase.name}</CardTitle>
                <CardDescription>
                  Perform comprehensive personal injury case analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Activity className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Personal Injury Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Our specialized PI module will analyze:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Medical records and injury severity</li>
                        <li>• Economic damages (medical costs, lost wages)</li>
                        <li>• Non-economic damages (pain, suffering)</li>
                        <li>• Comparable case outcomes</li>
                        <li>• Settlement value estimation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex-1"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Start PI Analysis
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCase(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {selectedCase && analysisComplete && (
            <div className="space-y-6">
              {/* Case Info Bar */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedCase.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Personal Injury
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Analysis completed
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCase(null);
                        setAnalysisComplete(false);
                      }}
                    >
                      Select Different Case
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Injury Severity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">7.5/10</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Severe injuries
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Damages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$545K</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Economic + Non-economic
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Settlement Est.
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$435K</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected value
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Comparable Cases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Similar outcomes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis Tabs */}
              <Tabs defaultValue="medical" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="medical">
                    <Activity className="h-4 w-4 mr-2" />
                    Medical Assessment
                  </TabsTrigger>
                  <TabsTrigger value="damages">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Damages Calculator
                  </TabsTrigger>
                  <TabsTrigger value="comparable">
                    <FileText className="h-4 w-4 mr-2" />
                    Comparable Cases
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="medical" className="space-y-4 mt-4">
                  <MedicalAssessment caseId={selectedCase.id} />
                </TabsContent>

                <TabsContent value="damages" className="space-y-4 mt-4">
                  <DamagesCalculator caseId={selectedCase.id} />
                </TabsContent>

                <TabsContent value="comparable" className="space-y-4 mt-4">
                  <ComparableCases caseId={selectedCase.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

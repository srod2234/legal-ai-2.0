/**
 * Research Tools Component
 *
 * Provides additional research utilities:
 * - Citation generator
 * - Brief builder
 * - Case comparison tool
 * - Research memo generator
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Scale,
  BookOpen,
  FileSignature,
  Download,
  Plus,
} from 'lucide-react';

export default function ResearchTools() {
  const tools = [
    {
      id: 'citation-generator',
      title: 'Citation Generator',
      description: 'Generate properly formatted legal citations in multiple styles',
      icon: FileSignature,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: () => console.log('Citation Generator'),
    },
    {
      id: 'brief-builder',
      title: 'Research Brief Builder',
      description: 'Create comprehensive research briefs from your saved cases',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: () => console.log('Brief Builder'),
    },
    {
      id: 'case-comparison',
      title: 'Case Comparison',
      description: 'Compare multiple cases side-by-side to analyze similarities',
      icon: Scale,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: () => console.log('Case Comparison'),
    },
    {
      id: 'memo-generator',
      title: 'Research Memo Generator',
      description: 'Generate legal research memos with AI assistance',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      action: () => console.log('Memo Generator'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Research Tools</h2>
        <p className="text-muted-foreground">
          Advanced tools to enhance your legal research workflow
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={tool.action} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Open Tool
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used research tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Export All Saved Cases
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Generate Research Report
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Scale className="h-4 w-4 mr-2" />
            Create Case Summary Table
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

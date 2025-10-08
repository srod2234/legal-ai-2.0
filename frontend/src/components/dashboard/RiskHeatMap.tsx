/**
 * Risk Heat Map Component
 *
 * Visual heat map showing risk distribution across documents,
 * categories, or time periods
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

export interface HeatMapCell {
  id: string;
  label: string;
  value: number;
  count?: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal' | 'none';
  metadata?: Record<string, any>;
}

export interface HeatMapRow {
  id: string;
  label: string;
  cells: HeatMapCell[];
}

interface RiskHeatMapProps {
  title?: string;
  description?: string;
  rows: HeatMapRow[];
  columnLabels?: string[];
  showLegend?: boolean;
  onCellClick?: (cell: HeatMapCell, row: HeatMapRow) => void;
}

export default function RiskHeatMap({
  title = 'Risk Heat Map',
  description = 'Visual representation of risk distribution',
  rows,
  columnLabels,
  showLegend = true,
  onCellClick,
}: RiskHeatMapProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700';
      case 'high':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-blue-400 hover:bg-blue-500';
      case 'minimal':
        return 'bg-green-400 hover:bg-green-500';
      case 'none':
        return 'bg-gray-200 hover:bg-gray-300';
      default:
        return 'bg-gray-200 hover:bg-gray-300';
    }
  };

  const getRiskTextColor = (level: string): string => {
    switch (level) {
      case 'critical':
      case 'high':
      case 'medium':
        return 'text-white';
      default:
        return 'text-gray-900';
    }
  };

  const getRiskIntensity = (value: number): number => {
    // Normalize value to 0-1 range for opacity
    return Math.min(Math.max(value / 10, 0.1), 1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showLegend && (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-600"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-400"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-400"></div>
                <span>Minimal</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <TooltipProvider>
            <div className="min-w-full">
              {/* Column Headers */}
              {columnLabels && columnLabels.length > 0 && (
                <div className="flex mb-2">
                  <div className="w-32 flex-shrink-0"></div>
                  <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${columnLabels.length}, minmax(0, 1fr))` }}>
                    {columnLabels.map((label, index) => (
                      <div
                        key={index}
                        className="text-xs font-medium text-center text-muted-foreground px-1"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Heat Map Rows */}
              <div className="space-y-1">
                {rows.map((row) => (
                  <div key={row.id} className="flex items-center">
                    {/* Row Label */}
                    <div className="w-32 flex-shrink-0 pr-3">
                      <span className="text-sm font-medium truncate block">
                        {row.label}
                      </span>
                    </div>

                    {/* Cells */}
                    <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(0, 1fr))` }}>
                      {row.cells.map((cell) => (
                        <Tooltip key={cell.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                h-12 rounded cursor-pointer transition-all
                                ${getRiskColor(cell.riskLevel)}
                                ${hoveredCell === cell.id ? 'ring-2 ring-primary scale-105' : ''}
                                flex items-center justify-center
                              `}
                              style={{
                                opacity: getRiskIntensity(cell.value),
                              }}
                              onClick={() => onCellClick?.(cell, row)}
                              onMouseEnter={() => setHoveredCell(cell.id)}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              {cell.count !== undefined && (
                                <span
                                  className={`text-xs font-semibold ${getRiskTextColor(
                                    cell.riskLevel
                                  )}`}
                                >
                                  {cell.count}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div className="font-semibold">{cell.label}</div>
                              <div className="text-xs">
                                Risk Score: <span className="font-medium">{cell.value.toFixed(1)}</span>
                              </div>
                              {cell.count !== undefined && (
                                <div className="text-xs">
                                  Documents: <span className="font-medium">{cell.count}</span>
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {cell.riskLevel.toUpperCase()}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Total Categories</div>
            <div className="text-lg font-semibold">{rows.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Documents</div>
            <div className="text-lg font-semibold">
              {rows.reduce((sum, row) =>
                sum + row.cells.reduce((cellSum, cell) => cellSum + (cell.count || 0), 0), 0
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Avg Risk Score</div>
            <div className="text-lg font-semibold">
              {(
                rows.reduce((sum, row) =>
                  sum + row.cells.reduce((cellSum, cell) => cellSum + cell.value, 0), 0
                ) / rows.reduce((sum, row) => sum + row.cells.length, 0)
              ).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">High Risk+</div>
            <div className="text-lg font-semibold">
              {rows.reduce((sum, row) =>
                sum + row.cells.filter(cell =>
                  cell.riskLevel === 'critical' || cell.riskLevel === 'high'
                ).reduce((cellSum, cell) => cellSum + (cell.count || 0), 0), 0
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Example preset configurations
export const createTimeSeriesHeatMap = (
  data: { date: string; category: string; riskScore: number; count: number }[]
): { rows: HeatMapRow[]; columnLabels: string[] } => {
  // Group by category and date
  const categories = Array.from(new Set(data.map(d => d.category)));
  const dates = Array.from(new Set(data.map(d => d.date))).sort();

  const getRiskLevel = (score: number): HeatMapCell['riskLevel'] => {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    if (score >= 2) return 'low';
    return 'minimal';
  };

  const rows: HeatMapRow[] = categories.map(category => ({
    id: category,
    label: category,
    cells: dates.map(date => {
      const item = data.find(d => d.category === category && d.date === date);
      const riskScore = item?.riskScore || 0;
      return {
        id: `${category}-${date}`,
        label: `${category} - ${date}`,
        value: riskScore,
        count: item?.count || 0,
        riskLevel: getRiskLevel(riskScore),
      };
    }),
  }));

  return {
    rows,
    columnLabels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
  };
};

export const createCategoryHeatMap = (
  categories: { name: string; subcategories: { name: string; riskScore: number; count: number }[] }[]
): { rows: HeatMapRow[] } => {
  const getRiskLevel = (score: number): HeatMapCell['riskLevel'] => {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    if (score >= 2) return 'low';
    return 'minimal';
  };

  const rows: HeatMapRow[] = categories.map(cat => ({
    id: cat.name,
    label: cat.name,
    cells: cat.subcategories.map(sub => ({
      id: `${cat.name}-${sub.name}`,
      label: `${cat.name} - ${sub.name}`,
      value: sub.riskScore,
      count: sub.count,
      riskLevel: getRiskLevel(sub.riskScore),
    })),
  }));

  return { rows };
};

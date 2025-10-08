/**
 * Search Interface Component
 *
 * Advanced search form for legal case research with:
 * - Full-text search
 * - Jurisdiction filters
 * - Date range filters
 * - Court selection
 * - Practice area selection
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SearchFilters {
  query: string;
  jurisdiction?: string;
  dateFrom?: string;
  dateTo?: string;
  court?: string;
  practiceArea?: string;
}

interface SearchInterfaceProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  initialFilters?: SearchFilters;
}

export default function SearchInterface({
  onSearch,
  loading = false,
  initialFilters,
}: SearchInterfaceProps) {
  const [query, setQuery] = useState(initialFilters?.query || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<Omit<SearchFilters, 'query'>>({
    jurisdiction: initialFilters?.jurisdiction,
    dateFrom: initialFilters?.dateFrom,
    dateTo: initialFilters?.dateTo,
    court: initialFilters?.court,
    practiceArea: initialFilters?.practiceArea,
  });

  const jurisdictions = [
    'Federal - All Circuits',
    'Federal - 1st Circuit',
    'Federal - 2nd Circuit',
    'Federal - 3rd Circuit',
    'Federal - 4th Circuit',
    'Federal - 5th Circuit',
    'Federal - 6th Circuit',
    'Federal - 7th Circuit',
    'Federal - 8th Circuit',
    'Federal - 9th Circuit',
    'Federal - 10th Circuit',
    'Federal - 11th Circuit',
    'Federal - D.C. Circuit',
    'State - California',
    'State - New York',
    'State - Texas',
    'State - Florida',
  ];

  const practiceAreas = [
    'Contract Law',
    'Tort Law',
    'Corporate Law',
    'Employment Law',
    'Intellectual Property',
    'Real Estate',
    'Personal Injury',
    'Criminal Law',
  ];

  const courts = [
    'Supreme Court',
    'Court of Appeals',
    'District Court',
    'State Supreme Court',
    'State Appeals Court',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    onSearch({
      query,
      ...filters,
    });
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleRemoveFilter = (key: keyof typeof filters) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Main Search Input */}
          <div className="space-y-2">
            <Label htmlFor="query">Search Cases</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="query"
                  type="text"
                  placeholder="Enter case name, citation, or search terms..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: "indemnification clause technology services"
            </p>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.jurisdiction && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Jurisdiction: {filters.jurisdiction}
                  <button
                    type="button"
                    onClick={() => handleRemoveFilter('jurisdiction')}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.court && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Court: {filters.court}
                  <button
                    type="button"
                    onClick={() => handleRemoveFilter('court')}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.practiceArea && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Practice Area: {filters.practiceArea}
                  <button
                    type="button"
                    onClick={() => handleRemoveFilter('practiceArea')}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Date Range: {filters.dateFrom || 'Any'} - {filters.dateTo || 'Now'}
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveFilter('dateFrom');
                      handleRemoveFilter('dateTo');
                    }}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Advanced Filters Panel */}
          {showAdvanced && (
            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
              {/* Jurisdiction */}
              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Select
                  value={filters.jurisdiction}
                  onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, jurisdiction: value }))
                  }
                >
                  <SelectTrigger id="jurisdiction">
                    <SelectValue placeholder="All Jurisdictions" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Court */}
              <div className="space-y-2">
                <Label htmlFor="court">Court</Label>
                <Select
                  value={filters.court}
                  onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, court: value }))
                  }
                >
                  <SelectTrigger id="court">
                    <SelectValue placeholder="All Courts" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Practice Area */}
              <div className="space-y-2">
                <Label htmlFor="practiceArea">Practice Area</Label>
                <Select
                  value={filters.practiceArea}
                  onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, practiceArea: value }))
                  }
                >
                  <SelectTrigger id="practiceArea">
                    <SelectValue placeholder="All Practice Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    {practiceAreas.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                  }
                />
              </div>

              {/* Date To */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

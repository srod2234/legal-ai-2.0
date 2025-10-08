/**
 * Case Research Page
 *
 * Advanced legal case research interface with:
 * - Search with filters
 * - Case results display
 * - Case analytics
 * - Research tools (citations, briefs)
 * - Saved searches
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  BookmarkPlus,
  TrendingUp,
  Filter,
  Download,
  History,
  Loader2,
} from 'lucide-react';
import SearchInterface from '@/components/research/SearchInterface';
import CaseCard from '@/components/research/CaseCard';
import ResearchTools from '@/components/research/ResearchTools';
import SearchAnalytics from '@/components/research/SearchAnalytics';
import { useSavedCases, useCaseAnalytics } from '../hooks/useCaseResearch';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface SearchFilters {
  query: string;
  jurisdiction?: string;
  dateFrom?: string;
  dateTo?: string;
  court?: string;
  practiceArea?: string;
}

interface CaseResult {
  id: number;
  caseName: string;
  citation: string;
  court: string;
  jurisdiction: string;
  decisionDate: string;
  relevanceScore: number;
  outcome: string;
  summary: string;
  url?: string;
}

interface SearchHistory {
  id: number;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  timestamp: string;
}

export default function CaseResearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
  });
  const [results, setResults] = useState<CaseResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [searching, setSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [analyticsFilters, setAnalyticsFilters] = useState<any>(undefined);

  // Fetch saved cases using React Query
  const { data: savedCasesData, isLoading: savedCasesLoading } = useSavedCases();
  const { data: analyticsData, isLoading: analyticsLoading } = useCaseAnalytics(
    analyticsFilters,
    results.length > 0
  );

  const savedCases = savedCasesData?.cases?.map((c: any) => ({
    id: c.id,
    caseName: c.case_name,
    citation: c.citation,
    court: c.court,
    jurisdiction: c.jurisdiction,
    decisionDate: c.decision_date,
    relevanceScore: c.relevance_score || 0,
    outcome: c.outcome || 'Unknown',
    summary: c.summary || '',
    url: c.url,
  })) || [];

  const handleSearch = async (searchFilters: SearchFilters) => {
    if (!searchFilters.query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      setSearching(true);
      setFilters(searchFilters);

      // Call the actual API
      const response = await apiService.searchCases({
        query: searchFilters.query,
        jurisdiction: searchFilters.jurisdiction,
        practice_area: searchFilters.practiceArea,
        date_from: searchFilters.dateFrom,
        date_to: searchFilters.dateTo,
        limit: 50,
      });

      // Transform API response to match component format
      const caseResults: CaseResult[] = response.cases?.map((c: any, index: number) => ({
        id: c.id || index,
        caseName: c.case_name || c.caseName || 'Unknown Case',
        citation: c.citation || '',
        court: c.court || 'Unknown Court',
        jurisdiction: c.jurisdiction || searchFilters.jurisdiction || 'Unknown',
        decisionDate: c.decision_date || c.date_filed || '',
        relevanceScore: c.relevance_score || 0.5,
        outcome: c.outcome || 'Unknown',
        summary: c.summary || c.snippet || '',
        url: c.url || c.absolute_url,
      })) || [];

      setResults(caseResults);
      setTotalResults(response.count || caseResults.length);

      // Update analytics filters based on search
      setAnalyticsFilters({
        practice_area: searchFilters.practiceArea,
        jurisdiction: searchFilters.jurisdiction,
        date_from: searchFilters.dateFrom,
        date_to: searchFilters.dateTo,
      });

      // Add to search history
      setSearchHistory(prev => [{
        id: Date.now(),
        query: searchFilters.query,
        filters: searchFilters,
        resultCount: caseResults.length,
        timestamp: new Date().toISOString(),
      }, ...prev.slice(0, 9)]);

      toast.success(`Found ${caseResults.length} cases`);
      setSearching(false);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error(error.message || 'Search failed');
      setSearching(false);
    }
  };

  const handleSaveCase = async (caseResult: CaseResult) => {
    try {
      // TODO: Implement save/unsave case API when backend supports it
      toast.success('Case bookmarked (feature coming soon)');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save case');
    }
  };

  const isCaseSaved = (caseId: number): boolean => {
    return savedCases.some(c => c.id === caseId);
  };

  const handleExportResults = () => {
    // TODO: Implement export functionality
    console.log('Exporting results...');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6" />
              Case Research
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search and analyze legal precedents across jurisdictions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalResults > 0 && (
              <Badge variant="secondary">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleExportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="search" className="h-full flex flex-col">
          <div className="border-b px-6 bg-card sticky top-0 z-10">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <BookmarkPlus className="h-4 w-4" />
                Saved Cases ({savedCases.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History ({searchHistory.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Research Tools
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Search Tab */}
            <TabsContent value="search" className="mt-0 h-full">
              <div className="container max-w-6xl mx-auto p-6">
                <SearchInterface
                  onSearch={handleSearch}
                  loading={searching}
                  initialFilters={filters}
                />

                {searching && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Searching cases...</p>
                    </div>
                  </div>
                )}

                {!searching && results.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Search Results
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        Sorted by relevance
                      </span>
                    </div>
                    {results.map((result) => (
                      <CaseCard
                        key={result.id}
                        caseData={result}
                        isSaved={isCaseSaved(result.id)}
                        onSave={() => handleSaveCase(result)}
                      />
                    ))}
                  </div>
                )}

                {!searching && filters.query && results.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search query or filters
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Saved Cases Tab */}
            <TabsContent value="saved" className="mt-0">
              <div className="container max-w-6xl mx-auto p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Saved Cases</h2>
                  <p className="text-muted-foreground">
                    Cases you've bookmarked for future reference
                  </p>
                </div>
                {savedCasesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                      <p className="mt-4 text-muted-foreground">Loading saved cases...</p>
                    </div>
                  </div>
                ) : savedCases.length > 0 ? (
                  <div className="space-y-4">
                    {savedCases.map((caseData) => (
                      <CaseCard
                        key={caseData.id}
                        caseData={caseData}
                        isSaved={true}
                        onSave={() => handleSaveCase(caseData)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookmarkPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Saved Cases</h3>
                    <p className="text-muted-foreground">
                      Bookmark cases during your research to access them here
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0">
              <div className="container max-w-6xl mx-auto p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Search History</h2>
                  <p className="text-muted-foreground">
                    Your recent case searches
                  </p>
                </div>
                {searchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {searchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSearch(item.filters)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{item.query}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.resultCount} results • {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Repeat Search
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Search History</h3>
                    <p className="text-muted-foreground">
                      Your search history will appear here
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <div className="container max-w-6xl mx-auto p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                      <p className="mt-4 text-muted-foreground">Loading analytics...</p>
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <SearchAnalytics results={results} analyticsData={analyticsData} />
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
                    <p className="text-muted-foreground">
                      Perform a search to see analytics on the results
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Research Tools Tab */}
            <TabsContent value="tools" className="mt-0">
              <div className="container max-w-6xl mx-auto p-6">
                <ResearchTools />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

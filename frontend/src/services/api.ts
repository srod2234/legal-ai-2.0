// API configuration and base service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: 'admin' | 'standard' | 'partner' | 'senior_associate' | 'associate' | 'paralegal' | 'firm_admin' | 'analyst';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  phone?: string;
  department?: string;
  job_title?: string;
  timezone?: string;
  language?: string;
  theme?: string;
  last_login?: string;
  // LEGAL 3.0 additions
  firm_id?: number;
  firm_name?: string;
  permissions?: string;
  practice_areas?: string;
  bar_number?: string;
  bar_state?: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  role?: 'admin' | 'standard';
  phone?: string;
  department?: string;
  job_title?: string;
  timezone?: string;
  language?: string;
  theme?: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  timezone?: string;
  language?: string;
  theme?: string;
}

export interface UserUpdateAdmin {
  full_name?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  timezone?: string;
  language?: string;
  theme?: string;
  role?: 'admin' | 'standard';
  is_active?: boolean;
}

export interface Document {
  id: number;
  title?: string;
  description?: string;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  document_type?: string;
  tags?: string[];
  is_confidential: boolean;
  processing_status: 'uploading' | 'uploaded' | 'processing' | 'ocr_processing' | 'embedding' | 'ready' | 'failed' | 'deleted';
  processing_error?: string;
  page_count?: number;
  word_count?: number;
  language?: string;
  has_ocr: boolean;
  ocr_confidence?: number;
  chunk_count?: number;
  created_at: string;
  updated_at?: string;
  last_accessed?: string;
  access_count: number;
  legal_hold: boolean;
  user_id: number;
  confidence_score?: number;
}

export interface DocumentUploadResponse {
  document_id: number;
  filename: string;
  processing_status: 'uploading' | 'uploaded' | 'processing' | 'ocr_processing' | 'embedding' | 'ready' | 'failed' | 'deleted';
  message: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: string;
  confidence?: number;
  sources?: Array<{
    pageNumber: number;
    excerpt: string;
    relevanceScore: number;
  }>;
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  session_type: 'general' | 'document' | 'multi_document';
  document_id?: number;
  document?: Document;
}

// Analytics interfaces
export interface AICostMetrics {
  total_cost_today: number;
  total_cost_this_month: number;
  cost_per_message: number;
  cost_per_user: number;
  tokens_used_today: number;
  tokens_used_this_month: number;
  cost_trend_percent: number;
}

export interface SystemStats {
  // Core business metrics
  total_users: number;
  active_users: number;
  new_users_today: number;
  user_engagement_score: number;

  // Document metrics
  total_documents: number;
  documents_processed_today: number;
  document_processing_success_rate: number;
  avg_documents_per_user: number;

  // Chat & AI metrics
  total_chat_sessions: number;
  messages_today: number;
  ai_cost_metrics: AICostMetrics;

  // System performance summary
  system_uptime_hours: number;
  overall_system_status: string;

  // Security summary
  security_risk_level: string;
  failed_logins_today: number;
  active_sessions: number;
}

export interface SystemHealth {
  status: string;
  components: Record<string, Record<string, any>>;
  timestamp: string;
  uptime_seconds: number;
  version: string;
}

export interface UserActivity {
  user_id: number;
  user_email: string;
  last_login?: string;
  login_count_today: number;
  documents_uploaded: number;
  chat_messages_sent: number;
  last_activity?: string;
  risk_score: number;
}

export interface AuditLogResponse {
  id: number;
  user_id?: number;
  user_email?: string;
  user_role?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  status_code?: number;
  response_time_ms?: number;
  extra_data?: string;
  timestamp: string;
  session_id?: string;
  correlation_id?: string;
  risk_level?: string;
  is_sensitive: boolean;
  retention_date?: string;
}

export interface AuditLogListResponse {
  logs: AuditLogResponse[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SecuritySummary {
  total_audit_logs: number;
  high_risk_events: number;
  failed_logins_24h: number;
  suspicious_ips: string[];
  active_sessions: number;
  recent_admin_actions: AuditLogResponse[];
  security_alerts: number;
}

export interface PerformanceMetrics {
  // Core performance (user-facing)
  avg_response_time_ms: number;
  total_requests_24h: number;
  error_rate_percent: number;
  document_processing_avg_time: number;
  document_processing_success_rate: number;
  chat_response_avg_time: number;

  // Technical details (for expandable section)
  database_query_avg_time: number;
  vector_search_avg_time: number;
  cache_hit_rate_percent: number;

  // Overall system performance indicator
  system_performance_status: string;
}

export interface AdminDashboardData {
  system_stats: SystemStats;
  system_health: SystemHealth;
  security_summary: SecuritySummary;
  performance_metrics: PerformanceMetrics;
  recent_activities: UserActivity[];
  recent_alerts: Record<string, any>[];
  user_activity_trends: Array<{
    date: string;
    users: number;
    newUsers: number;
  }>;
  document_type_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithRefresh: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && retryWithRefresh && !endpoint.includes('/auth/')) {
        // Session might be expired, try to refresh
        try {
          await this.refreshToken();
          // Retry the original request
          return this.request<T>(endpoint, options, false); // Don't retry again to avoid infinite loop
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the default message
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        return text as unknown as T;
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      // Re-throw the error with more context
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Network error: ${String(error)}`);
      }
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Tokens are automatically stored as HTTP-only cookies by the backend
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
    // Cookies are automatically cleared by the backend
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  async verifyToken(): Promise<{ valid: boolean; user: User }> {
    return this.request('/api/auth/verify-token');
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/refresh', {
      method: 'POST',
    });

    // Tokens are automatically refreshed as HTTP-only cookies by the backend
    return response;
  }

  async getWebSocketToken(): Promise<{ token: string; user_id: number }> {
    // Get WebSocket token from backend using cookie authentication
    return this.request('/api/auth/websocket-token');
  }

  // Document methods
  async uploadDocument(
    file: File,
    metadata: {
      title?: string;
      description?: string;
      tags?: string;
      is_confidential?: boolean;
      session_id?: number;
    } = {}
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.tags) formData.append('tags', metadata.tags);
    if (metadata.session_id) formData.append('session_id', String(metadata.session_id));
    formData.append('is_confidential', String(metadata.is_confidential ?? true));

    const url = `${this.baseURL}/api/documents/upload`;

    const config: RequestInit = {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
      body: formData,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Session might be expired, try to refresh
        try {
          await this.refreshToken();
          // Retry the upload
          const retryResponse = await fetch(url, config);

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({ error: 'Upload failed after retry' }));
            throw new Error(errorData.detail || errorData.error || `HTTP ${retryResponse.status}`);
          }

          return retryResponse.json();
        } catch (refreshError) {
          console.error('Token refresh failed during upload:', refreshError);
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async getDocuments(): Promise<Document[]> {
    const response = await this.request<{ documents: Document[] }>('/api/documents/');
    return response.documents;
  }

  async getDocument(documentId: number): Promise<Document> {
    const response = await this.request<{ document: Document }>(`/api/documents/${documentId}`);
    return response.document;
  }

  async getAdminDocuments(): Promise<Document[]> {
    return this.request<Document[]>('/api/admin/documents');
  }

  async deleteDocument(documentId: number): Promise<void> {
    return this.request(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async getDocumentContent(documentId: number): Promise<{
    document_id: number;
    content: string;
    word_count: number;
    language: string;
    has_ocr: boolean;
  }> {
    return this.request(`/api/documents/${documentId}/content`);
  }

  async downloadDocument(documentId: number): Promise<Blob> {
    const url = `${this.baseURL}/api/documents/${documentId}/download`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.blob();
  }

  // Chat methods
  async getChatSessions(): Promise<ChatSession[]> {
    return this.request<ChatSession[]>('/api/chat/sessions');
  }

  async createChatSession(title: string = 'New Chat', documentId?: number): Promise<ChatSession> {
    const requestBody: {
      title: string;
      document_id?: number;
      session_type?: string;
    } = { title };
    if (documentId) {
      requestBody.document_id = documentId;
      requestBody.session_type = 'document';
    }

    return this.request<ChatSession>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async updateChatSession(sessionId: number, updates: {
    title?: string;
    document_id?: number;
    session_type?: string;
  }): Promise<ChatSession> {
    console.log('apiService.updateChatSession called with:', { sessionId, updates });
    const result = await this.request<ChatSession>(`/api/chat/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    console.log('apiService.updateChatSession result:', result);
    return result;
  }

  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    const response = await this.request<{ session: ChatSession; messages: ChatMessage[] }>(`/api/chat/sessions/${sessionId}/conversation`);
    return response.messages || [];
  }

  async deleteChatSession(sessionId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // WebSocket connection for real-time chat
  async createWebSocket(sessionId?: number): Promise<WebSocket> {
    try {
      // Get WebSocket token from the backend
      const tokenData = await this.getWebSocketToken();

      // If no sessionId provided, create a new session first
      let actualSessionId = sessionId;
      if (!actualSessionId) {
        console.log('No sessionId provided, creating new session...');
        const newSession = await this.createChatSession('New Chat');
        console.log('Created new session:', newSession);
        actualSessionId = newSession.id;
      } else {
        console.log('Using existing sessionId:', actualSessionId);
      }

      console.log('Using session ID:', actualSessionId);
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = this.baseURL.replace(/^https?:\/\//, '');
      const url = `${protocol}//${host}/api/chat/ws/${actualSessionId}?token=${encodeURIComponent(tokenData.token)}`;
      console.log('WebSocket URL:', url);

      return new WebSocket(url);
    } catch (error) {
      console.error('Failed to create WebSocket with authentication:', error);
      throw new Error('Authentication required for WebSocket connection');
    }
  }

  // Admin methods
  async getAdminStats(): Promise<Record<string, unknown>> {
    return this.request('/api/admin/stats');
  }

  getUsers = async (): Promise<User[]> => {
    return this.request<User[]>('/api/admin/users/list');
  }

  // User management methods
  async createUser(userData: UserCreate): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(userId: number): Promise<User> {
    return this.request<User>(`/api/auth/users/${userId}`);
  }

  async updateUser(userId: number, userData: UserUpdateAdmin): Promise<User> {
    return this.request<User>(`/api/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deactivateUser(userId: number): Promise<User> {
    return this.request<User>(`/api/admin/users/${userId}/deactivate`, {
      method: 'PUT',
    });
  }

  async activateUser(userId: number): Promise<User> {
    return this.request<User>(`/api/admin/users/${userId}/activate`, {
      method: 'PUT',
    });
  }

  async updateUserRole(userId: number, role: 'admin' | 'standard'): Promise<User> {
    return this.request<User>(`/api/admin/users/${userId}/role/${role}`, {
      method: 'PUT',
    });
  }

  // Analytics methods
  async getSystemStats(): Promise<SystemStats> {
    return this.request('/api/admin/stats');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.request('/api/admin/health');
  }

  async getAdminDashboard(): Promise<AdminDashboardData> {
    return this.request('/api/admin/dashboard');
  }

  async getUserActivities(params?: {
    limit?: number;
    offset?: number;
    sort_by?: string;
  }): Promise<UserActivity[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);

    const query = searchParams.toString();
    return this.request(`/api/admin/users${query ? `?${query}` : ''}`);
  }

  async searchAuditLogs(params?: {
    page?: number;
    per_page?: number;
    user_id?: number;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<AuditLogListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.user_id) searchParams.append('user_id', params.user_id.toString());
    if (params?.action) searchParams.append('action', params.action);
    if (params?.resource_type) searchParams.append('resource_type', params.resource_type);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);

    const query = searchParams.toString();
    return this.request(`/api/admin/audit-logs${query ? `?${query}` : ''}`);
  }

  async exportAuditLogs(params?: {
    format?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params?.format) searchParams.append('format', params.format);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);

    const query = searchParams.toString();
    const url = `${this.baseURL}/api/admin/audit-logs/export${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // ==================== LEGAL 3.0 API METHODS ====================

  // Risk Assessment methods
  async analyzeDocumentRisk(documentId: number, options?: {
    include_precedents?: boolean;
    force_reanalysis?: boolean;
  }): Promise<any> {
    return this.request(`/api/risk/${documentId}/analyze`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getRiskAssessment(documentId: number): Promise<any> {
    return this.request(`/api/risk/${documentId}/assessment`);
  }

  async getDocumentClauses(documentId: number, filters?: {
    risk_level?: string;
    clause_type?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (filters?.risk_level) searchParams.append('risk_level', filters.risk_level);
    if (filters?.clause_type) searchParams.append('clause_type', filters.clause_type);
    const query = searchParams.toString();
    return this.request(`/api/risk/${documentId}/clauses${query ? `?${query}` : ''}`);
  }

  async getRiskRecommendations(documentId: number): Promise<any> {
    return this.request(`/api/risk/${documentId}/recommendations`);
  }

  async getRiskSummary(documentId: number): Promise<any> {
    return this.request(`/api/risk/${documentId}/summary`);
  }

  async reanalyzeDocument(documentId: number): Promise<any> {
    return this.request(`/api/risk/${documentId}/reanalyze`, {
      method: 'POST',
    });
  }

  // Case Research methods
  async searchCases(params: {
    query: string;
    practice_area?: string;
    jurisdiction?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    if (params.practice_area) searchParams.append('practice_area', params.practice_area);
    if (params.jurisdiction) searchParams.append('jurisdiction', params.jurisdiction);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request(`/api/cases/search?${searchParams.toString()}`);
  }

  async getCaseDetails(caseId: string): Promise<any> {
    return this.request(`/api/cases/${caseId}`);
  }

  async getDocumentPrecedents(documentId: number): Promise<any> {
    return this.request(`/api/cases/precedents/${documentId}`);
  }

  async findRelevantCases(data: {
    document_id: number;
    legal_issue: string;
    practice_area?: string;
    jurisdiction?: string;
  }): Promise<any> {
    return this.request(`/api/cases/relevant`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCaseAnalytics(filters?: {
    practice_area?: string;
    jurisdiction?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (filters?.practice_area) searchParams.append('practice_area', filters.practice_area);
    if (filters?.jurisdiction) searchParams.append('jurisdiction', filters.jurisdiction);
    if (filters?.date_from) searchParams.append('date_from', filters.date_from);
    if (filters?.date_to) searchParams.append('date_to', filters.date_to);
    const query = searchParams.toString();
    return this.request(`/api/cases/analytics/outcomes${query ? `?${query}` : ''}`);
  }

  async getSavedCases(userId?: number): Promise<any> {
    const searchParams = new URLSearchParams();
    if (userId) searchParams.append('user_id', userId.toString());
    const query = searchParams.toString();
    return this.request(`/api/cases/saved${query ? `?${query}` : ''}`);
  }

  // Predictive Analytics methods
  async predictOutcome(data: {
    document_id: number;
    practice_area: string;
    case_type?: string;
    jurisdiction?: string;
  }): Promise<any> {
    return this.request(`/api/analytics/predict-outcome`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async estimateSettlement(data: {
    document_id: number;
    practice_area: string;
    claim_amount?: number;
    case_type?: string;
  }): Promise<any> {
    return this.request(`/api/analytics/estimate-settlement`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async predictTimeline(data: {
    practice_area: string;
    case_stage: string;
    case_type?: string;
    jurisdiction?: string;
  }): Promise<any> {
    return this.request(`/api/analytics/predict-timeline`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeCaseStrength(data: {
    document_id: number;
    practice_area: string;
    plaintiff_perspective: boolean;
  }): Promise<any> {
    return this.request(`/api/analytics/analyze-strength`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFullAnalysis(documentId: number): Promise<any> {
    return this.request(`/api/analytics/document/${documentId}/full-analysis`);
  }

  async getPracticeAreas(): Promise<any> {
    return this.request(`/api/analytics/practice-areas`);
  }

  async getCaseStages(): Promise<any> {
    return this.request(`/api/analytics/case-stages`);
  }

  // Firm Management methods
  async createFirm(data: {
    name: string;
    firm_code: string;
    subscription_tier?: string;
    max_users?: number;
    max_documents?: number;
  }): Promise<any> {
    return this.request(`/api/firms/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFirm(firmId: number): Promise<any> {
    return this.request(`/api/firms/${firmId}`);
  }

  async updateFirm(firmId: number, data: any): Promise<any> {
    return this.request(`/api/firms/${firmId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getFirmUsers(firmId: number): Promise<any> {
    return this.request(`/api/firms/${firmId}/users`);
  }

  async addFirmUser(firmId: number, userId: number): Promise<any> {
    return this.request(`/api/firms/${firmId}/users`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async removeFirmUser(firmId: number, userId: number): Promise<any> {
    return this.request(`/api/firms/${firmId}/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getFirmStatistics(firmId: number): Promise<any> {
    return this.request(`/api/firms/${firmId}/statistics`);
  }

  async checkFirmLimits(firmId: number): Promise<any> {
    return this.request(`/api/firms/${firmId}/limits`);
  }

  async listFirms(): Promise<any> {
    return this.request(`/api/firms/`);
  }

  async getFirmByCode(firmCode: string): Promise<any> {
    return this.request(`/api/firms/code/${firmCode}`);
  }
}

export const apiService = new ApiService();
import { getApiUrl } from '@/constants/api';

export interface IdeaAnalysis {
  problem_statement: string;
  summary: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  actionable_items: string[];
  validation_priority: string;
}

export interface Idea {
  id: number;
  user_id: string;
  project_id: number | null;
  transcribed_text: string;
  analysis: IdeaAnalysis;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeIdeaRequest {
  transcribed_text: string;
  project_id?: number | null;
}

export type AnalyzeIdeaResponse = Idea;

export interface Project {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication token if available
    // For now, we're using anonymous access, so no token needed
    // const token = await getAuthToken();
    // if (token) {
    //   headers['Authorization'] = `Bearer ${token}`;
    // }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async analyzeIdea(data: AnalyzeIdeaRequest): Promise<AnalyzeIdeaResponse> {
    return this.request<AnalyzeIdeaResponse>('/api/v1/ideas/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIdeas(projectId?: number): Promise<Idea[]> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.request<Idea[]>(`/api/v1/ideas${params}`);
  }

  async getIdea(ideaId: number): Promise<Idea> {
    return this.request<Idea>(`/api/v1/ideas/${ideaId}`);
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/v1/projects');
  }

  async getProject(projectId: number): Promise<Project> {
    return this.request<Project>(`/api/v1/projects/${projectId}`);
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health');
  }
}

export const apiService = new ApiService();


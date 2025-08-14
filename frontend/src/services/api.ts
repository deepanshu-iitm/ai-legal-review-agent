import axios from 'axios';

// API base URL - will use proxy in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for document processing
});

// Types
export interface Document {
  filename: string;
  original_name: string;
  file_size: number;
  upload_date: string;
  document_type: string;
  status: string;
}

export interface QueryRequest {
  filename: string;
  question: string;
}

export interface QueryResponse {
  answer: string;
  confidence?: number;
  sources?: string[];
}

export interface UploadResponse {
  message: string;
  filename: string;
  file_size?: number;
  document_type?: string;
}

// API Functions
export const fetchDocuments = async (): Promise<Document[]> => {
  const response = await api.get('/documents/');
  return response.data;
};

export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const queryDocument = async (filename: string, question: string): Promise<QueryResponse & { processing_time: number }> => {
  const response = await api.post('/ask/', { filename, question });
  return response.data;
};

export const fetchDocumentContent = async (filename: string) => {
  const response = await api.get(`/documents/${filename}/content`);
  return response.data;
};

export const deleteDocument = async (filename: string): Promise<void> => {
  await api.delete(`/documents/${filename}`);
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      throw new Error('Document not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error - please try again');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - document processing may take longer');
    } else if (!error.response) {
      throw new Error('Unable to connect to server');
    }
    throw error;
  }
);

export default api;

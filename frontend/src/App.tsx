import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from './components/Dashboard';
import DocumentUpload from './components/DocumentUpload';
import QueryInterface from './components/QueryInterface';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen">
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    onDocumentSelect={setSelectedDocument}
                    selectedDocument={selectedDocument}
                  />
                } 
              />
              <Route 
                path="/upload" 
                element={<DocumentUpload />} 
              />
              <Route 
                path="/query" 
                element={
                  <QueryInterface 
                    selectedDocument={selectedDocument}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

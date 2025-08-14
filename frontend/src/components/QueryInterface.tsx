import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation } from 'react-query';
import { queryDocument } from '../services/api';

interface QueryInterfaceProps {
  selectedDocument: string | null;
}

interface QueryResponse {
  answer: string;
  confidence?: number;
  sources?: string[];
  processing_time: number;
}

const QueryInterface: React.FC<QueryInterfaceProps> = ({ selectedDocument }) => {
  const [searchParams] = useSearchParams();
  const documentFromUrl = searchParams.get('document');
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<Array<{
    question: string;
    response: QueryResponse;
    timestamp: Date;
  }>>([]);

  const documentToQuery = documentFromUrl || selectedDocument;

  // Helper function to extract error message
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An error occurred while processing your query.';
  };

  const queryMutation = useMutation<
  QueryResponse,
  Error,       
  { document: string; question: string }
>(
  ({ document, question }) => queryDocument(document, question),
  {
    onSuccess: (response, variables) => {
      setQueryHistory(prev => [{
        question: variables.question,
        response,
        timestamp: new Date()
      }, ...prev]);
      setQuery('');
    },
  }
);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !documentToQuery) return;
    
    queryMutation.mutate({
      document: documentToQuery,
      question: query.trim()
    });
  };

  const suggestedQuestions = [
    "What are the key terms and conditions in this document?",
    "Who are the parties involved in this agreement?",
    "What are the important dates mentioned?",
    "Are there any liability clauses?",
    "What are the termination conditions?",
    "Summarize the main obligations of each party"
  ];

  if (!documentToQuery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Document Selected</h3>
          <p className="text-gray-600 mb-8">Select a document from the dashboard to start asking questions.</p>
          <Link to="/" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">Ask Questions</h2>
          <p className="text-gray-600 text-lg">
            Document: <span className="font-semibold text-blue-600">{documentToQuery}</span>
          </p>
        </div>

        {/* Query Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <textarea
                id="query"
                rows={4}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400 text-lg leading-relaxed transition-all duration-200"
                placeholder="What would you like to know about this document?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={queryMutation.isLoading}
              />
              <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
                {query.length}/500
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!query.trim() || queryMutation.isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {queryMutation.isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Ask Question'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {queryMutation.isError && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{getErrorMessage(queryMutation.error)}</p>
            </div>
          </div>
        )}

        {/* Suggested Questions */}
        {queryHistory.length === 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Try asking:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(question)}
                  className="text-left p-4 bg-white/80 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-gray-700 font-medium shadow-sm hover:shadow-md"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Query Results */}
        {queryHistory.length > 0 && (
          <div className="space-y-8">
            {queryHistory.map((item, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{item.question}</h4>
                    <span className="text-sm text-gray-500 font-medium">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-gray-800 leading-relaxed text-lg">{item.response.answer}</p>
                  </div>
                </div>
                
                {item.response.sources && item.response.sources.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sources:</h5>
                    {item.response.sources.map((source: string, sourceIndex: number) => (
                      <div key={sourceIndex} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-gray-700 leading-relaxed">{source}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryInterface;

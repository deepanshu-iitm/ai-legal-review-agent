import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { fetchDocuments } from '../services/api';
import DocumentList from './DocumentList';
import StatsCards from './StatsCards';

interface DashboardProps {
  onDocumentSelect: (filename: string) => void;
  selectedDocument: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onDocumentSelect, selectedDocument }) => {
  const { data: documents, isLoading, error } = useQuery('documents', fetchDocuments);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-legal-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading documents</h3>
          <p className="text-sm mt-1">Please check if the API server is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-legal-900 mb-2">
          Welcome to AI Legal Document Reviewer
        </h1>
        <p className="text-legal-600 max-w-2xl mx-auto">
          Upload legal documents and get intelligent analysis, risk assessment, and answers to your questions 
          using advanced AI technology.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards documents={documents || []} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/upload"
          className="card hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="font-semibold text-legal-900 mb-2">Upload Document</h3>
            <p className="text-sm text-legal-600">
              Upload PDF or DOCX files for AI analysis
            </p>
          </div>
        </Link>

        <Link
          to="/query"
          className="card hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-legal-900 mb-2">Ask Questions</h3>
            <p className="text-sm text-legal-600">
              Get AI-powered answers about your documents
            </p>
          </div>
        </Link>

        <div className="card bg-legal-50 border-legal-300">
          <div className="text-center">
            <div className="w-12 h-12 bg-legal-200 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-legal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-legal-600 mb-2">Analytics</h3>
            <p className="text-sm text-legal-500">
              Coming soon - Document insights and trends
            </p>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-legal-900">Recent Documents</h2>
          <Link
            to="/upload"
            className="btn-primary text-sm"
          >
            Upload New Document
          </Link>
        </div>

        <DocumentList
          documents={documents || []}
          selectedDocument={selectedDocument}
          onDocumentSelect={onDocumentSelect}
        />
      </div>
    </div>
  );
};

export default Dashboard;

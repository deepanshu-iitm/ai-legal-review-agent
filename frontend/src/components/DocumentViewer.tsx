import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { fetchDocumentContent } from '../services/api';

interface DocumentViewerProps {
  selectedDocument: string | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ selectedDocument }) => {
  const { filename } = useParams<{ filename: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  
  const documentToView = filename || selectedDocument;

  const { data: documentContent, isLoading, error } = useQuery(
    ['document-content', documentToView],
    () => fetchDocumentContent(documentToView!),
    {
      enabled: !!documentToView,
      retry: 1,
    }
  );

  if (!documentToView) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No document selected</h3>
        <p className="text-gray-500">Please select a document from the dashboard to view its contents.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
        <div className="text-red-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error loading document</h3>
        <p className="text-red-600">Unable to load the document content. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{documentToView}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Document viewer - {documentContent?.pages?.length || 0} pages
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {documentContent?.pages?.length || 1}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(documentContent?.pages?.length || 1, currentPage + 1))}
              disabled={currentPage >= (documentContent?.pages?.length || 1)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {documentContent?.pages && documentContent.pages.length > 0 ? (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono bg-gray-50 p-4 rounded-lg border">
              {documentContent.pages[currentPage - 1] || 'No content available for this page.'}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content available</h3>
            <p className="text-gray-500">This document appears to be empty or could not be processed.</p>
          </div>
        )}
      </div>

      {/* Footer with document metadata */}
      {documentContent?.metadata && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {documentContent.metadata.file_size && (
              <div>
                <span className="font-medium text-gray-600">File Size:</span>
                <span className="ml-2 text-gray-800">{documentContent.metadata.file_size}</span>
              </div>
            )}
            {documentContent.metadata.file_type && (
              <div>
                <span className="font-medium text-gray-600">Type:</span>
                <span className="ml-2 text-gray-800">{documentContent.metadata.file_type}</span>
              </div>
            )}
            {documentContent.metadata.upload_date && (
              <div>
                <span className="font-medium text-gray-600">Uploaded:</span>
                <span className="ml-2 text-gray-800">
                  {new Date(documentContent.metadata.upload_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {documentContent.metadata.word_count && (
              <div>
                <span className="font-medium text-gray-600">Words:</span>
                <span className="ml-2 text-gray-800">{documentContent.metadata.word_count}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;

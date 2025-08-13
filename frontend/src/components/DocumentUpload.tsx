import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from 'react-query';
import { uploadDocument } from '../services/api';

const DocumentUpload: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation(uploadDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries('documents');
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadProgress(10);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  React.useEffect(() => {
    if (uploadMutation.isLoading) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [uploadMutation.isLoading]);

  React.useEffect(() => {
    if (uploadMutation.isSuccess) {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [uploadMutation.isSuccess]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-legal-900 mb-2">Upload Legal Document</h1>
        <p className="text-legal-600">
          Upload PDF or DOCX files for AI-powered analysis and review
        </p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div
          {...getRootProps()}
          className={`upload-area border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : isDragReject
              ? 'border-red-500 bg-red-50'
              : 'border-legal-300 hover:border-primary-400 hover:bg-legal-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-legal-100 rounded-full flex items-center justify-center">
              <svg
                className={`w-8 h-8 ${
                  isDragActive ? 'text-primary-600' : isDragReject ? 'text-red-600' : 'text-legal-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-primary-600">Drop the file here</p>
                <p className="text-sm text-primary-500">Release to upload your document</p>
              </div>
            ) : isDragReject ? (
              <div>
                <p className="text-lg font-medium text-red-600">File type not supported</p>
                <p className="text-sm text-red-500">Please upload PDF or DOCX files only</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-legal-900">
                  Drag and drop your document here, or click to browse
                </p>
                <p className="text-sm text-legal-600">
                  Supports PDF and DOCX files up to 50MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {(uploadMutation.isLoading || uploadProgress > 0) && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-legal-700">
                {uploadMutation.isLoading ? 'Uploading...' : 'Upload Complete!'}
              </span>
              <span className="text-sm text-legal-500">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-legal-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadMutation.isSuccess && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Document uploaded successfully!</p>
                <p className="text-sm text-green-600">
                  File: {uploadMutation.data?.filename}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadMutation.isError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Upload failed</p>
                <p className="text-sm text-red-600">
                  {uploadMutation.error instanceof Error 
                    ? uploadMutation.error.message 
                    : 'An error occurred while uploading the file'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="card bg-legal-50 border-legal-200">
        <h3 className="font-semibold text-legal-900 mb-3">File Requirements</h3>
        <ul className="space-y-2 text-sm text-legal-600">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Supported formats: PDF (.pdf), Word Document (.docx)
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Maximum file size: 50MB
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Best results with text-based documents (not scanned images)
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            All data is processed securely and confidentially
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload;

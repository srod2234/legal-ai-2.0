import { Document } from '@/services/api';
import { FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface DocumentContextHeaderProps {
  document: Document;
}

const DocumentContextHeader = ({ document }: DocumentContextHeaderProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
      case 'embedding':
      case 'ocr_processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900 truncate">
              📄 {document.title || document.original_filename}
            </span>
            {getStatusIcon(document.processing_status)}
          </div>

          <div className="flex items-center space-x-3 text-xs text-blue-700 mt-1">
            <span>{formatFileSize(document.file_size)}</span>
            {document.page_count && <span>{document.page_count} pages</span>}
            {document.word_count && <span>{document.word_count.toLocaleString()} words</span>}
          </div>
        </div>
      </div>

      {document.processing_status === 'ready' && (
        <div className="mt-2 text-xs text-blue-700">
          This document is available as context for your questions
        </div>
      )}
    </div>
  );
};

export default DocumentContextHeader;
// resources/js/pages/vetmed/edit.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  X, 
  AlertCircle,
  Calendar,
  User,
  Building,
  FileSignature,
  Download,
  Save,
  RefreshCw
} from 'lucide-react';

interface VetmedClearance {
  id: number;
  clearance_number: string;
  document_type: string;
  veterinarian_name: string;
  license_number: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  remarks: string;
  status: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  rejection_reason?: string;
}

interface Props {
  clearance: VetmedClearance;
}

type ClearanceStatus = 'pending_review' | 'verified' | 'rejected' | 'expired' | 'needs_revision';

interface StatusConfig {
  color: string;
  label: string;
}

// Helper function to format date for input[type="date"]
const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

// Helper function to get image URL
const getImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `/storage/${path}`;
};

export default function EditVetmedClearance({ clearance }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    clearance_number: clearance.clearance_number || '',
    document_type: clearance.document_type || 'Veterinary Clearance',
    veterinarian_name: clearance.veterinarian_name || '',
    license_number: clearance.license_number || '',
    issued_by: clearance.issued_by || '',
    issue_date: formatDateForInput(clearance.issue_date),
    expiry_date: formatDateForInput(clearance.expiry_date),
    remarks: clearance.remarks || '',
    file: null as File | null,
  });

  const [existingFilePreview, setExistingFilePreview] = useState<string | null>(null);
  const [newFilePreview, setNewFilePreview] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing file preview if it's an image
  useEffect(() => {
    if (clearance.file_path && clearance.mime_type?.startsWith('image/')) {
      const imageUrl = getImageUrl(clearance.file_path);
      setExistingFilePreview(imageUrl);
    }
  }, [clearance]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('file', file);
      setIsReplacingFile(true);
      
      // Preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setNewFilePreview(null);
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const cancelFileReplacement = () => {
    setData('file', null);
    setNewFilePreview(null);
    setIsReplacingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFullScreen = () => {
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/vetmed-clearance/${clearance.id}`, {
      forceFormData: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<ClearanceStatus, StatusConfig> = {
      pending_review: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending Review' },
      verified: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Verified' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', label: 'Expired' },
      needs_revision: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'Needs Revision' },
    };
    
    const isValidStatus = (status: string): status is ClearanceStatus => {
      return ['pending_review', 'verified', 'rejected', 'expired', 'needs_revision'].includes(status);
    };
    
    const config = isValidStatus(status) ? statusConfig[status] : statusConfig.pending_review;
    
    return (
      <Badge className={`${config.color} px-3 py-1 text-sm`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edit Vetmed Clearance
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Update your veterinary health certificate information
                  </p>
                </div>
              </div>
              {getStatusBadge(clearance.status)}
            </div>
            
            {/* Revision Notice */}
            {clearance.status === 'needs_revision' && clearance.rejection_reason && (
              <Alert className="mt-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-sm text-orange-700 dark:text-orange-300">
                  <p className="font-medium mb-1">Revision Required:</p>
                  <p>{clearance.rejection_reason}</p>
                  <p className="mt-2 text-xs">Please update the information above and resubmit for review.</p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Main Form Card */}
            <Card>
              <CardHeader>
                <CardTitle>Clearance Information</CardTitle>
                <CardDescription>
                  Update the details from your veterinary health certificate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Type */}
                <div>
                  <Label htmlFor="document_type">Document Type *</Label>
                   <Input
                    id="clearance_number"
                    type="text"
                    placeholder="e.g., VET-2024-00123"
                    value={'Veterinary Clearance'}
                    onChange={(e) => setData('clearance_number', e.target.value)}
                  />
                  
                  {errors.document_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.document_type}</p>
                  )}
                </div>

                {/* Clearance Number */}
                <div>
                  <Label htmlFor="clearance_number">Clearance Number</Label>
                  <Input
                    id="clearance_number"
                    type="text"
                    placeholder="e.g., VET-2024-00123"
                    value={data.clearance_number}
                    onChange={(e) => setData('clearance_number', e.target.value)}
                  />
                  {errors.clearance_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.clearance_number}</p>
                  )}
                </div>

                {/* Veterinarian Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="veterinarian_name">Veterinarian Name</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="veterinarian_name"
                        className="pl-10"
                        placeholder="Dr. Juan Dela Cruz"
                        value={data.veterinarian_name}
                        onChange={(e) => setData('veterinarian_name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <div className="relative">
                      <FileSignature className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="license_number"
                        className="pl-10"
                        placeholder="PRC License #"
                        value={data.license_number}
                        onChange={(e) => setData('license_number', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Issued By */}
                <div>
                  <Label htmlFor="issued_by">Issued By (Clinic/Hospital)</Label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="issued_by"
                      className="pl-10"
                      placeholder="Name of Veterinary Clinic"
                      value={data.issued_by}
                      onChange={(e) => setData('issued_by', e.target.value)}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="issue_date"
                        type="date"
                        className="pl-10"
                        value={data.issue_date}
                        onChange={(e) => setData('issue_date', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="expiry_date"
                        type="date"
                        className="pl-10"
                        value={data.expiry_date}
                        onChange={(e) => setData('expiry_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <Label htmlFor="remarks">Additional Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any additional information about this clearance..."
                    rows={3}
                    value={data.remarks}
                    onChange={(e) => setData('remarks', e.target.value)}
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <Label>Document</Label>
                  <div className="mt-1">
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    
                    {!isReplacingFile ? (
                      <div className="rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            {existingFilePreview ? (
                              <img
                                src={existingFilePreview}
                                alt="Current document"
                                className="h-20 w-20 object-cover rounded-lg cursor-pointer"
                                onClick={openFullScreen}
                              />
                            ) : (
                              <FileText className="w-12 h-12 text-gray-400" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {clearance.file_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(clearance.file_size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={triggerFileUpload}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Replace File
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-green-500 p-4 bg-green-50 dark:bg-green-900/20">
                        {newFilePreview ? (
                          <div className="relative">
                            <img
                              src={newFilePreview}
                              alt="New preview"
                              className="max-h-48 mx-auto rounded-lg cursor-pointer"
                              onClick={openFullScreen}
                            />
                            <div className="absolute top-2 right-2">
                              <button
                                type="button"
                                onClick={cancelFileReplacement}
                                className="p-1 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-8 h-8 text-green-600" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {data.file?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {((data.file?.size || 0) / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={cancelFileReplacement}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition"
                            >
                              <X className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-green-600 mt-2 text-center">
                          New file ready to replace existing document
                        </p>
                      </div>
                    )}
                  </div>
                  {errors.file && (
                    <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                  )}
                </div>

                {/* Info Alert */}
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">📋 Note:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Updated clearances will need to be reviewed again</li>
                      <li>Any marketplace listings using this clearance will not be affected until re-verified</li>
                      <li>Make sure all information matches your document</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Link href="/vetmed-clearance">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={processing}>
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Clearance
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isFullScreen && (newFilePreview || existingFilePreview) && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeFullScreen}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={closeFullScreen}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <a
              href={newFilePreview || existingFilePreview || ''}
              download={data.file?.name || clearance.file_name}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
            >
              <Download className="w-6 h-6" />
            </a>
            
            <img
              src={newFilePreview || existingFilePreview || ''}
              alt="Full screen preview"
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 right-0 right-0 text-center text-white/60 text-sm">
              Click anywhere to close • {isReplacingFile ? data.file?.name : clearance.file_name}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
// resources/js/pages/vetmed/index.tsx

import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ViewClearanceDialog from './ViewClearanceDialog';
import { 
  Plus, 
  FileText, 
  Eye, 
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react';

// Make sure this matches the VetmedClearance interface exactly
interface Clearance {
  id: number;
  clearance_number: string;
  document_type: string;
  veterinarian_name: string; // Make required, not optional
  license_number: string; // Make required, not optional
  issued_by: string; // Make required, not optional
  issue_date: string;
  expiry_date: string;
  remarks: string;
  status: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  rejection_reason?: string;
  created_at: string;
}

interface Props {
  clearances: {
    data: Clearance[];
    links: any[];
  };
}

type ClearanceStatus = 'pending_review' | 'verified' | 'rejected' | 'expired' | 'needs_revision';

export default function VetmedClearanceIndex({ clearances }: Props) {
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<ClearanceStatus, { color: string; icon: any; label: string }> = {
      pending_review: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Pending Review' },
      verified: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Verified' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', icon: AlertTriangle, label: 'Expired' },
      needs_revision: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertTriangle, label: 'Needs Revision' },
    };
    
    const config = statusConfig[status as ClearanceStatus] || statusConfig.pending_review;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewClearance = (clearance: Clearance) => {
    setSelectedClearance(clearance);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this clearance?')) {
      router.delete(`/vetmed-clearance/${id}`);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Vetmed Clearances
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your veterinary health certificates
              </p>
            </div>
            <Link href="/vetmed-clearance/create">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                New Clearance
              </Button>
            </Link>
          </div>

          {/* Clearances List */}
          {clearances.data.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Clearances Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You haven't submitted any veterinary clearances yet.
                </p>
                <Link href="/vetmed-clearance/create">
                  <Button>Submit Your First Clearance</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {clearances.data.map((clearance) => (
                <Card key={clearance.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {clearance.clearance_number || `Clearance #${clearance.id}`}
                              </h3>
                              {getStatusBadge(clearance.status)}
                              {isExpired(clearance.expiry_date) && clearance.status === 'verified' && (
                                <Badge variant="outline" className="border-red-500 text-red-600">
                                  Expired
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {clearance.document_type}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              {clearance.issue_date && (
                                <span>Issued: {formatDate(clearance.issue_date)}</span>
                              )}
                              {clearance.expiry_date && (
                                <span>Expires: {formatDate(clearance.expiry_date)}</span>
                              )}
                              <span>Submitted: {formatDate(clearance.created_at)}</span>
                            </div>
                            {clearance.rejection_reason && (
                              <p className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                Reason: {clearance.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewClearance(clearance)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
               
                          <Link href={`/vetmed-clearance/${clearance.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                        
                        
                        <a
                          href={`/storage/${clearance.file_path}`}
                          download={clearance.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </a>
                        
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(clearance.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Dialog */}
      <ViewClearanceDialog
        clearance={selectedClearance}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedClearance(null);
        }}
      />
    </AppLayout>
  );
}
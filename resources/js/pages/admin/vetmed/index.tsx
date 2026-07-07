// resources/js/pages/admin/vetmed/index.tsx

import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ViewClearanceDialog from '@/pages/vetmed/ViewClearanceDialog';
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';

import AppLayout from "@/layouts/admin-layout";

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
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Props {
  clearances: {
    data: VetmedClearance[];
    links: any[];
  };
  filters: {
    status: string;
    search: string;
  };
}

type ClearanceStatus = 'pending_review' | 'verified' | 'rejected' | 'expired' | 'needs_revision';

export default function AdminVetmedIndex({ clearances, filters }: Props) {
  const [selectedClearance, setSelectedClearance] = useState<VetmedClearance | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState<VetmedClearance | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

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
      <Badge className={`${config.color} flex items-center gap-1 w-fit px-2 py-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleViewClearance = (clearance: VetmedClearance) => {
    setSelectedClearance(clearance);
    setIsViewDialogOpen(true);
  };

  const openStatusDialog = (clearance: VetmedClearance, status: string) => {
    setStatusToUpdate(clearance);
    setNewStatus(status);
    setRejectionReason(clearance.rejection_reason || '');
    setIsStatusDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (!statusToUpdate) return;

    setIsSubmitting(true);
    
    const data: any = {
      status: newStatus,
    };
    
    if (newStatus === 'rejected' || newStatus === 'needs_revision') {
      data.rejection_reason = rejectionReason;
    }
    
    router.patch(`/admin/vetmed-clearances/${statusToUpdate.id}/status`, data, {
      preserveScroll: true,
      onSuccess: () => {
        setIsStatusDialogOpen(false);
        setStatusToUpdate(null);
        setNewStatus('');
        setRejectionReason('');
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  };

  const handleSearch = () => {
    router.get('/admin/vetmed-clearances', 
      { search: searchTerm, status: statusFilter },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    router.get('/admin/vetmed-clearances', 
      { search: searchTerm, status: value },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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

  return (
    <AppLayout>
      <Head title="Admin - Vetmed Clearances" />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Veterinary Clearances Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review and manage farmer veterinary clearance submissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    router.get('/admin/vetmed-clearances', { search: '', status: 'all' });
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by clearance number, farmer name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={handleFilterChange}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="needs_revision">Needs Revision</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Clearances Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID / Clearance #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Farmer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Issue / Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {clearances.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No clearances found</p>
                      </td>
                    </tr>
                  ) : (
                    clearances.data.map((clearance) => (
                      <tr key={clearance.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              #{clearance.id}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {clearance.clearance_number || 'No number'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {clearance.user?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {clearance.user?.email || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900 dark:text-white">
                            {clearance.document_type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {clearance.veterinarian_name || 'No vet info'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {clearance.issue_date && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Issued:</span> {formatDate(clearance.issue_date)}
                              </p>
                            )}
                            {clearance.expiry_date && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Expires:</span> {formatDate(clearance.expiry_date)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(clearance.status)}
                          {clearance.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1 max-w-[200px] truncate">
                              {clearance.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(clearance.created_at)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewClearance(clearance)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {clearance.status !== 'verified' && clearance.status !== 'rejected' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => openStatusDialog(clearance, 'verified')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openStatusDialog(clearance, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {clearance.status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600 border-orange-600"
                                onClick={() => openStatusDialog(clearance, 'needs_revision')}
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Request Revision
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {clearances.links && clearances.links.length > 3 && (
            <div className="mt-6 flex justify-center">
              <div className="flex gap-2">
                {clearances.links.map((link: any, index: number) => (
                  <Button
                    key={index}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (link.url) {
                        router.get(link.url, {}, { preserveState: true, preserveScroll: true });
                      }
                    }}
                    disabled={!link.url}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Clearance Dialog */}
      <ViewClearanceDialog
        clearance={selectedClearance}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setSelectedClearance(null);
        }}
      />

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Clearance Status</DialogTitle>
            <DialogDescription>
              {newStatus === 'verified' && 'Verify this veterinary clearance. This will allow farmers to use it for listings.'}
              {newStatus === 'rejected' && 'Reject this clearance. Provide a reason for rejection.'}
              {newStatus === 'needs_revision' && 'Request revision. Provide details on what needs to be fixed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(newStatus === 'rejected' || newStatus === 'needs_revision') && (
              <div>
                <Label htmlFor="rejection_reason">
                  {newStatus === 'rejected' ? 'Rejection Reason *' : 'Revision Request *'}
                </Label>
                <Textarea
                  id="rejection_reason"
                  placeholder={newStatus === 'rejected' 
                    ? "Explain why this clearance is being rejected..." 
                    : "Explain what needs to be corrected..."}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be shown to the farmer.
                </p>
              </div>
            )}

            {newStatus === 'verified' && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Confirm Verification:</strong> This clearance will be marked as verified and can be used for marketplace listings.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isSubmitting || ((newStatus === 'rejected' || newStatus === 'needs_revision') && !rejectionReason)}
              className={newStatus === 'verified' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSubmitting ? 'Updating...' : `Confirm ${newStatus === 'verified' ? 'Verification' : newStatus === 'rejected' ? 'Rejection' : 'Revision Request'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
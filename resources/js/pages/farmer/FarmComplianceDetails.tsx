// resources/js/Pages/FarmComplianceDetails.tsx

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { router, Head, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  Building,
  FileText,
  Clock,
  User,
  UserCheck,
  MapPin,
  Hash,
  Droplets,
  Trash,
  Ruler,
  DoorClosed,
  Biohazard,
  Mail,
  Phone,
  Home,
  ChevronLeft,
  LogIn,
  FormInput,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Award,
  AlertTriangle,
  CalendarDays,
  Building2,
  ScrollText,
  Stamp,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Toaster, toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { route } from "ziggy-js";

interface FarmCompliance {
  id: number;
  user_id: number;
  registration_number: string;
  lgu_name: string;
  barangay_name: string;
  date_registered: string;
  valid_until: string;
  has_septic_tank: boolean;
  has_drainage: boolean;
  proper_waste_disposal: boolean;
  distance_from_residence: string;
  meets_distance_requirement: boolean;
  has_proper_pen: boolean;
  has_biosecurity: boolean;
  status: string;
  remarks: string | null;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;

    has_barangay_clearance: boolean;           // Add this
  has_business_permit: boolean;              // Add this
  barangay_clearance_number?: string | null; // Add this
  business_permit_number?: string | null;    // Add this
  barangay_clearance_date?: string | null;   // Add this
  business_permit_date?: string | null;      // Add this

  
  verifier?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    profile_picture?: string | null;
  };
}

interface Props {
  compliance: FarmCompliance;
  isAdmin?: boolean;
  auth?: {
    user: {
      id: number;
      role: string;
    };
  };
}

// Separate component for Admin Edit Form
const AdminEditFormComponent = memo(({ 
  formData, 
  errors, 
  onTextChange, 
  onCheckboxChange, 
  onStatusChange, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  verifiedAt,
  verifierName 
}: any) => (
  <form onSubmit={onSubmit}>
    <Card className="bg-white/95 pt-0 dark:bg-gray-800/95 border border-green-200/30 dark:border-gray-700">
      <CardHeader className="bg-gradient-to-r pt-2 from-green-50 to-green-100/50 dark:from-gray-700 dark:to-gray-800/50">
        <CardTitle className="text-green-900 dark:text-gray-100"> Farm Compliance</CardTitle>
        <CardDescription className="text-green-700/70 dark:text-gray-400">Admin: You can approve fields</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Farmer Information */}
        {formData.user && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-gray-700 pb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Farmer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Farmer Name</Label>
                <Input value={formData.user.name} disabled className="bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Email Address</Label>
                <Input value={formData.user.email} disabled className="bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300" />
              </div>
              {formData.user.phone && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Phone Number</Label>
                  <Input value={formData.user.phone} disabled className="bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300" />
                </div>
              )}
              {formData.user.address && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Address</Label>
                  <Input value={formData.user.address} disabled className="bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registration Information */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Registration Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registration_number" className="text-gray-700 dark:text-gray-300">Registration Number</Label>
              <Input
                id="registration_number"
                name="registration_number"
                value={formData.registration_number || ''}
                onChange={onTextChange}
                className={`mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.registration_number ? 'border-red-500' : ''}`}
              />
              {errors.registration_number && <p className="text-xs text-red-500 mt-1">{errors.registration_number}</p>}
            </div>
            <div>
              <Label htmlFor="lgu_name" className="text-gray-700 dark:text-gray-300">LGU Name</Label>
              <Input
                id="lgu_name"
                name="lgu_name"
                value={formData.lgu_name || ''}
                onChange={onTextChange}
                className={`mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.lgu_name ? 'border-red-500' : ''}`}
              />
              {errors.lgu_name && <p className="text-xs text-red-500 mt-1">{errors.lgu_name}</p>}
            </div>
            <div>
              <Label htmlFor="barangay_name" className="text-gray-700 dark:text-gray-300">Barangay Name</Label>
              <Input
                id="barangay_name"
                name="barangay_name"
                value={formData.barangay_name || ''}
                onChange={onTextChange}
                className={`mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.barangay_name ? 'border-red-500' : ''}`}
              />
              {errors.barangay_name && <p className="text-xs text-red-500 mt-1">{errors.barangay_name}</p>}
            </div>
            <div>
              <Label htmlFor="date_registered" className="text-gray-700 dark:text-gray-300">Date Registered</Label>
              <Input
                id="date_registered"
                name="date_registered"
                type="date"
                value={formData.date_registered || ''}
                onChange={onTextChange}
                className={`mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.date_registered ? 'border-red-500' : ''}`}
              />
              {errors.date_registered && <p className="text-xs text-red-500 mt-1">{errors.date_registered}</p>}
            </div>
            <div>
              <Label htmlFor="valid_until" className="text-gray-700 dark:text-gray-300">Valid Until</Label>
              <Input
                id="valid_until"
                name="valid_until"
                type="date"
                value={formData.valid_until || ''}
                onChange={onTextChange}
                className={`mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.valid_until ? 'border-red-500' : ''}`}
              />
              {errors.valid_until && <p className="text-xs text-red-500 mt-1">{errors.valid_until}</p>}
            </div>
          </div>
        </div>

        {/* Farm Facilities & Compliance */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Farm Facilities & Compliance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Droplets className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="admin_has_septic_tank" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Septic Tank</Label>
              </div>
              <input
                type="checkbox"
                id="admin_has_septic_tank"
                checked={formData.has_septic_tank || false}
                onChange={(e) => onCheckboxChange('has_septic_tank', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Droplets className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="admin_has_drainage" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Drainage System</Label>
              </div>
              <input
                type="checkbox"
                id="admin_has_drainage"
                checked={formData.has_drainage || false}
                onChange={(e) => onCheckboxChange('has_drainage', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Trash className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="admin_proper_waste_disposal" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Proper Waste Disposal</Label>
              </div>
              <input
                type="checkbox"
                id="admin_proper_waste_disposal"
                checked={formData.proper_waste_disposal || false}
                onChange={(e) => onCheckboxChange('proper_waste_disposal', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <DoorClosed className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="admin_has_proper_pen" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Proper Pen</Label>
              </div>
              <input
                type="checkbox"
                id="admin_has_proper_pen"
                checked={formData.has_proper_pen || false}
                onChange={(e) => onCheckboxChange('has_proper_pen', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Biohazard className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="admin_has_biosecurity" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Biosecurity</Label>
              </div>
              <input
                type="checkbox"
                id="admin_has_biosecurity"
                checked={formData.has_biosecurity || false}
                onChange={(e) => onCheckboxChange('has_biosecurity', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Ruler className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="admin_meets_distance_requirement" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Meets Distance Req</Label>
              </div>
              <input
                type="checkbox"
                id="admin_meets_distance_requirement"
                checked={formData.meets_distance_requirement || false}
                onChange={(e) => onCheckboxChange('meets_distance_requirement', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="admin_distance_from_residence" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Ruler className="h-4 w-4" />
              Distance from Residence (meters)
            </Label>
            <Input
              id="admin_distance_from_residence"
              name="distance_from_residence"
              type="number"
              value={formData.distance_from_residence || '0'}
              onChange={onTextChange}
              className="mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              placeholder="Enter distance in meters"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Application Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Status</Label>
              <Select value={formData.status || 'pending'} onValueChange={onStatusChange}>
                <SelectTrigger id="status" className="mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="approved">✓ Approved</SelectItem>
                  <SelectItem value="rejected">✗ Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {verifiedAt && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Verified By</span>
                </div>
                <div className="text-sm text-slate-800 dark:text-gray-200 font-medium">{verifierName || 'N/A'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Remarks / Notes
          </h3>
          <Textarea
            id="remarks"
            name="remarks"
            value={formData.remarks || ''}
            onChange={onTextChange}
            rows={3}
            placeholder="Any additional notes or comments..."
            className="mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          />
        </div>

        {/* Barangay Clearance & Business Permit (Optional) */}
<div className="space-y-3">
  <h3 className="text-base font-semibold text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-gray-700 pb-2 flex items-center gap-2">
    <FileCheck className="h-4 w-4" />
    Local Government Permits (Optional)
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Barangay Clearance */}
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <Label htmlFor="admin_has_barangay_clearance" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            Has Barangay Clearance
          </Label>
        </div>
        <input
          type="checkbox"
          id="admin_has_barangay_clearance"
          checked={formData.has_barangay_clearance || false}
          onChange={(e) => onCheckboxChange('has_barangay_clearance', e.target.checked)}
          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
        />
      </div>
      {formData.has_barangay_clearance && (
        <div className="grid grid-cols-2 gap-2 pl-3">
          <div>
            <Label htmlFor="barangay_clearance_number" className="text-xs text-gray-600 dark:text-gray-400">
              Clearance Number
            </Label>
            <Input
              id="barangay_clearance_number"
              name="barangay_clearance_number"
              value={formData.barangay_clearance_number || ''}
              onChange={onTextChange}
              className="mt-1 text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              placeholder="e.g., BC-2024-001"
            />
          </div>
          <div>
            <Label htmlFor="barangay_clearance_date" className="text-xs text-gray-600 dark:text-gray-400">
              Issue Date
            </Label>
            <Input
              id="barangay_clearance_date"
              name="barangay_clearance_date"
              type="date"
              value={formData.barangay_clearance_date || ''}
              onChange={onTextChange}
              className="mt-1 text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
        </div>
      )}
    </div>

    {/* Business Permit */}
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <Label htmlFor="admin_has_business_permit" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            Has Business Permit
          </Label>
        </div>
        <input
          type="checkbox"
          id="admin_has_business_permit"
          checked={formData.has_business_permit || false}
          onChange={(e) => onCheckboxChange('has_business_permit', e.target.checked)}
          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
        />
      </div>
      {formData.has_business_permit && (
        <div className="grid grid-cols-2 gap-2 pl-3">
          <div>
            <Label htmlFor="business_permit_number" className="text-xs text-gray-600 dark:text-gray-400">
              Permit Number
            </Label>
            <Input
              id="business_permit_number"
              name="business_permit_number"
              value={formData.business_permit_number || ''}
              onChange={onTextChange}
              className="mt-1 text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              placeholder="e.g., BP-2024-001"
            />
          </div>
          <div>
            <Label htmlFor="business_permit_date" className="text-xs text-gray-600 dark:text-gray-400">
              Issue Date
            </Label>
            <Input
              id="business_permit_date"
              name="business_permit_date"
              type="date"
              value={formData.business_permit_date || ''}
              onChange={onTextChange}
              className="mt-1 text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
        </div>
      )}
    </div>
  </div>
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
    Note: Barangay Clearance and Business Permit are optional but recommended for complete compliance documentation.
  </p>
</div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="dark:border-gray-600 dark:text-gray-300">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  </form>
));

AdminEditFormComponent.displayName = 'AdminEditFormComponent';

// Farmer Edit Dialog Component
const FarmerEditDialogComponent = memo(({ 
  open, 
  onOpenChange, 
  formData, 
  onTextChange, 
  onCheckboxChange, 
  onSubmit, 
  isSubmitting 
}: any) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-2xl dark:bg-gray-800 dark:border-gray-700">
      <form onSubmit={onSubmit}>
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Edit Farm Facilities & Compliance</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Update your farm facilities and compliance information below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Droplets className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="has_septic_tank" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Septic Tank</Label>
              </div>
              <input
                type="checkbox"
                id="has_septic_tank"
                checked={formData.has_septic_tank || false}
                onChange={(e) => onCheckboxChange('has_septic_tank', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Droplets className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="has_drainage" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Drainage System</Label>
              </div>
              <input
                type="checkbox"
                id="has_drainage"
                checked={formData.has_drainage || false}
                onChange={(e) => onCheckboxChange('has_drainage', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Trash className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="proper_waste_disposal" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Proper Waste Disposal</Label>
              </div>
              <input
                type="checkbox"
                id="proper_waste_disposal"
                checked={formData.proper_waste_disposal || false}
                onChange={(e) => onCheckboxChange('proper_waste_disposal', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <DoorClosed className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="has_proper_pen" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Proper Pen</Label>
              </div>
              <input
                type="checkbox"
                id="has_proper_pen"
                checked={formData.has_proper_pen || false}
                onChange={(e) => onCheckboxChange('has_proper_pen', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Biohazard className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="has_biosecurity" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Has Biosecurity</Label>
              </div>
              <input
                type="checkbox"
                id="has_biosecurity"
                checked={formData.has_biosecurity || false}
                onChange={(e) => onCheckboxChange('has_biosecurity', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Ruler className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <Label htmlFor="meets_distance_requirement" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Meets Distance Req</Label>
              </div>
              <input
                type="checkbox"
                id="meets_distance_requirement"
                checked={formData.meets_distance_requirement || false}
                onChange={(e) => onCheckboxChange('meets_distance_requirement', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
            </div>
          </div>
          <div className="mt-2">
            <Label htmlFor="distance_from_residence" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Ruler className="h-4 w-4" />
              Distance from Residence (meters)
            </Label>
            <Input
              id="distance_from_residence"
              name="distance_from_residence"
              type="number"
              value={formData.distance_from_residence || '0'}
              onChange={onTextChange}
              className="mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              placeholder="Enter distance in meters"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-gray-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
));

FarmerEditDialogComponent.displayName = 'FarmerEditDialogComponent';

// Comprehensive Information Component
// Comprehensive Information Component - Document/Paper Style
const ComprehensiveInfoCard = ({ compliance }: { compliance: FarmCompliance }) => {
  const farmerName = compliance.user?.name || "the farmer";
  const farmerAddress = `${compliance.barangay_name}, ${compliance.lgu_name}`;
  
  // Check if farmer has any compliance data
  const hasComplianceData = compliance.has_septic_tank !== undefined || 
    compliance.has_drainage !== undefined || 
    compliance.proper_waste_disposal !== undefined ||
    compliance.has_proper_pen !== undefined ||
    compliance.has_biosecurity !== undefined ||
    compliance.meets_distance_requirement !== undefined;

  // For Approved status - Show official certificate
  if (compliance.status === 'approved') {
    return (
      <div className="bg-white dark:bg-white rounded-none shadow-xl border-2 border-gray-300 overflow-hidden max-w-4xl mx-auto">
        {/* Document Header with Seal */}
        <div className="border-b-2 border-gray-300 p-6 text-center">
          {/* <div className="flex justify-between items-start mb-4">
            <div className="w-24 h-24 border-2 border-gray-400 rounded-full flex items-center justify-center">
              <Stamp className="h-12 w-12 text-gray-600" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Republic of the Philippines</p>
              <p className="text-sm font-semibold">Department of Agriculture</p>
              <p className="text-xs">Livestock Division - Bunawan Office</p>
            </div>
          </div> */}
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-800 mt-4">
            Certificate of Compliance & Clearance to Operate
          </h1>
          <p className="text-sm text-gray-600 mt-2">DA Livestock Registry & Compliance Certification</p>
        </div>

        {/* Document Body */}
        <div className="p-8 space-y-6">
          {/* Reference Number */}
          <div className="text-center border-b border-gray-200 pb-3">
            <p className="text-sm text-gray-500">Registration No.</p>
            <p className="font-mono font-bold text-gray-800">{compliance.registration_number || 'N/A'}</p>
          </div>

          {/* TO ALL CONCERNED */}
          <div>
            <p className="text-gray-700 leading-relaxed">
              <span className="font-bold">TO ALL CONCERNED:</span>
            </p>
            <p className="text-gray-700 leading-relaxed mt-2 indent-8">
              This is to <span className="font-bold">CERTIFY</span> that{' '}
              <span className="font-bold uppercase">{farmerName}</span> of{' '}
              <span className="font-semibold">{farmerAddress}</span>, holding Registration Number{' '}
              <span className="font-mono">{compliance.registration_number}</span>, has successfully 
              complied with all requirements under the DA Backyard Livestock Farming Ordinance and is hereby{' '}
              <span className="font-bold underline">GRANTED a Clearance to Operate</span> and raise swine 
              for agricultural purposes within the bounds of the municipality.
            </p>
          </div>

          {/* Compliance Summary */}
          <div className="border border-gray-300 p-4 mt-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3">
              ✓ COMPLIANCE VERIFICATION SUMMARY
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">FACILITY REQUIREMENTS:</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li className="flex items-start gap-2">
                    {compliance.has_proper_pen ? '✓' : '✗'} Properly constructed swine pen
                  </li>
                  <li className="flex items-start gap-2">
                    {compliance.has_septic_tank ? '✓' : '✗'} Functional septic tank system
                  </li>
                  <li className="flex items-start gap-2">
                    {compliance.has_drainage ? '✓' : '✗'} Proper drainage system
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700">HEALTH & SAFETY STANDARDS:</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li className="flex items-start gap-2">
                    {compliance.proper_waste_disposal ? '✓' : '✗'} Proper waste disposal system
                  </li>
                  <li className="flex items-start gap-2">
                    {compliance.has_biosecurity ? '✓' : '✗'} Biosecurity measures implemented
                  </li>
                  <li className="flex items-start gap-2">
                    {compliance.meets_distance_requirement ? '✓' : '✗'} Distance requirement: {compliance.distance_from_residence} meters
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Certification Benefits */}
          <div className="border border-gray-300 p-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3">
              📋 CERTIFICATION BENEFITS
            </h3>
            <p className="text-sm text-gray-700">
              By virtue of this clearance, <span className="font-bold">{farmerName}</span> is hereby:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
              <li>AUTHORIZED to operate and maintain a backyard swine farm</li>
              <li>ELIGIBLE to avail of DA Livestock programs (Stock dispersal, Veterinary services, Feed subsidies, Technical training, Insurance coverage)</li>
              <li>RECOGNIZED as a registered member of the DA Livestock Registry</li>
            </ul>
          </div>

          {/* Validity and Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-gray-300">
            <div>
              <p className="text-xs text-gray-500">VALIDITY PERIOD</p>
              <p className="font-semibold text-gray-800">
                {compliance.valid_until ? format(new Date(compliance.valid_until), 'MMMM d, yyyy') : 'N/A'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Subject to annual renewal</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">ISSUED BY</p>
              <p className="font-semibold text-gray-800">{compliance.verifier?.name || 'DA Livestock Officer'}</p>
              <p className="text-xs text-gray-400">
                {compliance.verified_at ? format(new Date(compliance.verified_at), 'MMMM d, yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Official Stamp */}
          {/* <div className="text-center mt-8 pt-4 border-t border-gray-300">
            <div className="inline-block border-2 border-gray-400 px-8 py-2">
              <p className="text-xs font-bold text-gray-600">OFFICIAL SEAL</p>
              <p className="text-[10px] text-gray-500">DA Livestock Division</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-4">
              This document is issued electronically and is valid without signature.
            </p>
          </div> */}
        </div>
      </div>
    );
  }

  // For Pending/Not Verified status - Show instructions to visit DA office
  if (compliance.status === 'pending' || (!hasComplianceData && compliance.status !== 'rejected')) {
    // Check what's missing
    const missingRequirements = [];
    if (!compliance.registration_number) missingRequirements.push("Complete registration form");
    if (!compliance.has_septic_tank) missingRequirements.push("Install septic tank");
    if (!compliance.has_drainage) missingRequirements.push("Install drainage system");
    if (!compliance.proper_waste_disposal) missingRequirements.push("Set up proper waste disposal");
    if (!compliance.has_proper_pen) missingRequirements.push("Construct proper swine pen");
    if (!compliance.has_biosecurity) missingRequirements.push("Implement biosecurity measures");
    if (!compliance.meets_distance_requirement) missingRequirements.push(`Adjust farm location (needs 20m from residence, currently ${compliance.distance_from_residence || 0}m)`);

    return (
      <div className="bg-white dark:bg-gray-900 rounded-none shadow-xl border-2 border-gray-300 overflow-hidden max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="border-b-2 border-gray-300 p-6 text-center bg-gray-50">
          <div className="flex justify-between items-start mb-4">
            <div className="w-20 h-20 border-2 border-gray-400 rounded-full flex items-center justify-center bg-white">
              <Building2 className="h-10 w-10 text-gray-500" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Republic of the Philippines</p>
              <p className="text-sm font-semibold">Department of Agriculture</p>
              <p className="text-xs">Livestock Division - Bunawan Office</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-800 mt-4">
            Membership Application Status
          </h1>
          <p className="text-sm text-gray-600 mt-2">DA Livestock Registry & Compliance Application</p>
        </div>

        {/* Document Body */}
        <div className="p-8 space-y-6">
          {/* Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <p className="text-yellow-800 font-semibold">⏳ APPLICATION PENDING VERIFICATION</p>
            <p className="text-yellow-700 text-sm mt-1">
              Your application for DA Livestock Registry Membership is currently under review.
            </p>
          </div>

          {/* Applicant Info */}
          <div className="border border-gray-300 p-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3">
              APPLICANT INFORMATION
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Name:</p>
                <p className="font-semibold text-gray-800">{farmerName}</p>
              </div>
              <div>
                <p className="text-gray-500">Address:</p>
                <p className="text-gray-800">{farmerAddress}</p>
              </div>
              <div>
                <p className="text-gray-500">Registration #:</p>
                <p className="text-gray-800">{compliance.registration_number || 'Pending'}</p>
              </div>
              <div>
                <p className="text-gray-500">Date Applied:</p>
                <p className="text-gray-800">{compliance.date_registered ? format(new Date(compliance.date_registered), 'MMMM d, yyyy') : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Requirements Status */}
          <div className="border border-gray-300 p-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3">
              REQUIREMENTS STATUS
            </h3>
            
            {missingRequirements.length > 0 ? (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  The following requirements need to be completed before membership can be approved:
                </p>
                <ul className="space-y-2">
                  {missingRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm">
                      <span className="text-red-500">✗</span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-gray-700">
                All requirements have been submitted and are awaiting verification by DA personnel.
              </p>
            )}
          </div>

          {/* NEXT STEPS - Important */}
          <div className="border-2 border-blue-500 p-5 bg-blue-50">
            <h3 className="font-bold text-blue-800 text-lg mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              NEXT STEPS - ACTION REQUIRED
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">1. VISIT THE DA BUNGWAN LIVESTOCK OFFICE</p>
                <p className="text-gray-700 text-sm">
                  Please proceed to the <span className="font-bold">DA Livestock Office located at Bunawan Municipal Hall</span> 
                  to personally discuss your application with our livestock personnel. Bring any supporting documents 
                  and identification.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  📍 Address: Municipal Hall, Bunawan, Agusan del Sur<br />
                  📞 Contact: (085) 123-4567<br />
                  🕐 Office Hours: Monday-Friday, 8:00 AM - 5:00 PM
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">2. SCHEDULE ON-SITE INSPECTION</p>
                <p className="text-gray-700 text-sm">
                  Request for a farm inspection to verify your compliance with distance requirements, 
                  waste management systems, and biosecurity measures. The inspection will be conducted 
                  by a DA Livestock Officer.
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">3. COMPLETE MISSING REQUIREMENTS</p>
                <p className="text-gray-700 text-sm">
                  Address any deficiencies identified during the inspection and submit documentation 
                  of completed corrective actions.
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">4. MEMBERSHIP APPROVAL</p>
                <p className="text-gray-700 text-sm">
                  Upon successful verification and completion of all requirements, your membership 
                  will be approved and you will receive your Official Certificate of Compliance.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border border-gray-300 p-4 text-center">
            <p className="text-sm text-gray-600">
              <span className="font-bold">For inquiries, please contact:</span><br />
              DA Bunawan Livestock Office<br />
              Municipal Hall, Bunawan, Agusan del Sur<br />
              Email: da.bunawan.livestock@da.gov.ph
            </p>
          </div>
        </div>
      </div>
    );
  }

  // For Rejected status
  if (compliance.status === 'rejected') {
    const failedItems = [];
    if (!compliance.has_septic_tank) failedItems.push("Missing septic tank installation");
    if (!compliance.has_drainage) failedItems.push("Inadequate drainage system");
    if (!compliance.proper_waste_disposal) failedItems.push("Improper waste disposal setup");
    if (!compliance.has_proper_pen) failedItems.push("Substandard swine pen construction");
    if (!compliance.has_biosecurity) failedItems.push("No biosecurity measures in place");
    if (!compliance.meets_distance_requirement) failedItems.push(`Distance violation: ${compliance.distance_from_residence}m (requires 20m minimum)`);

    return (
      <div className="bg-white dark:bg-gray-900 rounded-none shadow-xl border-2 border-gray-300 overflow-hidden max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="border-b-2 border-gray-300 p-6 text-center bg-red-50">
          <div className="flex justify-between items-start mb-4">
            <div className="w-20 h-20 border-2 border-gray-400 rounded-full flex items-center justify-center bg-white">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Republic of the Philippines</p>
              <p className="text-sm font-semibold">Department of Agriculture</p>
              <p className="text-xs">Livestock Division - Bunawan Office</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-red-800 mt-4">
            Compliance Deficiency Notice
          </h1>
          <p className="text-sm text-red-600 mt-2">Clearance Not Issued</p>
        </div>

        {/* Document Body */}
        <div className="p-8 space-y-6">
          <div className="border border-red-300 bg-red-50 p-4">
            <p className="text-red-800 leading-relaxed">
              After review of the application submitted by <span className="font-bold">{farmerName}</span>, 
              the following deficiencies were identified that prevent issuance of clearance.
            </p>
          </div>

          <div className="border border-gray-300 p-4">
            <h3 className="font-bold text-red-800 border-b border-gray-300 pb-2 mb-3">
              ❌ NON-COMPLIANT ITEMS
            </h3>
            <ul className="space-y-2">
              {failedItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-500">✗</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-gray-300 p-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3">
              📋 REQUIRED ACTIONS FOR REAPPLICATION
            </h3>
            <ol className="mt-2 space-y-2 text-gray-700 list-decimal list-inside">
              <li>Address all non-compliant items listed above</li>
              <li>Visit the DA Livestock Office to schedule a follow-up inspection</li>
              <li>Submit documentation of completed corrective actions</li>
              <li>Pay any applicable re-inspection fees</li>
            </ol>
          </div>

          {compliance.remarks && (
            <div className="border border-gray-300 p-4">
              <p className="font-semibold text-gray-800">📝 Officer's Remarks:</p>
              <p className="text-gray-700 mt-1">{compliance.remarks}</p>
            </div>
          )}

          <div className="border border-gray-300 p-4 text-center">
            <p className="text-sm text-gray-600">
              <span className="font-bold">For assistance, please contact:</span><br />
              DA Bunawan Livestock Office<br />
              Municipal Hall, Bunawan, Agusan del Sur
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default/No application state
  return (
    <div className="bg-white dark:bg-gray-900 rounded-none shadow-xl border-2 border-gray-300 overflow-hidden max-w-4xl mx-auto">
      <div className="border-b-2 border-gray-300 p-6 text-center bg-gray-50">
        <div className="flex justify-between items-start mb-4">
          <div className="w-20 h-20 border-2 border-gray-400 rounded-full flex items-center justify-center bg-white">
            <Building2 className="h-10 w-10 text-gray-500" />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Republic of the Philippines</p>
            <p className="text-sm font-semibold">Department of Agriculture</p>
            <p className="text-xs">Livestock Division - Bunawan Office</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-800 mt-4">
          Not Yet Registered
        </h1>
        <p className="text-sm text-gray-600 mt-2">DA Livestock Registry Membership Required</p>
      </div>

      <div className="p-8 space-y-6">
        <div className="border-2 border-blue-500 p-6 bg-blue-50 text-center">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-blue-800 mb-4">
            YOU ARE NOT YET A REGISTERED MEMBER
          </h2>
          <p className="text-gray-700 mb-4">
            To avail of DA Livestock programs and services, you must first register as a member.
          </p>
          
          <div className="bg-white p-4 rounded border border-blue-200 text-left mt-4">
            <p className="font-semibold text-blue-800 mb-2">HOW TO APPLY FOR MEMBERSHIP:</p>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Visit the <span className="font-bold">DA Livestock Office at Bunawan Municipal Hall</span></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Bring a valid ID and proof of residency</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Complete the registration form and submit farm compliance requirements</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>Schedule an on-site inspection of your farm facility</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">5.</span>
                <span>Upon approval, receive your Certificate of Compliance and Registration</span>
              </li>
            </ol>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-200">
            <p className="text-sm text-gray-600">
              📍 DA Bunawan Livestock Office, Municipal Hall, Bunawan, Agusan del Sur<br />
              🕐 Monday-Friday, 8:00 AM - 5:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FarmComplianceDetails({ compliance, isAdmin = false, auth }: Props) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPageHeader, setShowPageHeader] = useState(true);
  const [showComplianceDetails, setShowComplianceDetails] = useState(true);
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // Navigation items
  const navItems = [
    { name: 'Back to Main', href: route('cms.exit'), icon: LogIn },
    { name: 'Application Form', href: route('insurance.application.create'), icon: FormInput },
    { name: 'Farm Authorization', href: '#', icon: ShieldCheck, active: true },
  ];

  // Scroll listener for header hide/show
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        const scrollTop = mainContentRef.current.scrollTop;
        setShowPageHeader(scrollTop < 10);
      }
    };

    const currentRef = mainContentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  // Separate state for farmer edit (only facilities)
  const [farmerFormData, setFarmerFormData] = useState({
    has_septic_tank: compliance.has_septic_tank ?? false,
    has_drainage: compliance.has_drainage ?? false,
    proper_waste_disposal: compliance.proper_waste_disposal ?? false,
    distance_from_residence: compliance.distance_from_residence || '0',
    meets_distance_requirement: compliance.meets_distance_requirement ?? false,
    has_proper_pen: compliance.has_proper_pen ?? false,
    has_biosecurity: compliance.has_biosecurity ?? false,
  });

  // Separate state for admin edit (all fields)
  const [adminFormData, setAdminFormData] = useState({
    registration_number: compliance.registration_number || '',
    lgu_name: compliance.lgu_name || '',
    barangay_name: compliance.barangay_name || '',
    date_registered: compliance.date_registered || '',
    valid_until: compliance.valid_until || '',
    has_septic_tank: compliance.has_septic_tank ?? false,
    has_drainage: compliance.has_drainage ?? false,
    proper_waste_disposal: compliance.proper_waste_disposal ?? false,
    distance_from_residence: compliance.distance_from_residence || '0',
    meets_distance_requirement: compliance.meets_distance_requirement ?? false,
    has_proper_pen: compliance.has_proper_pen ?? false,
    has_biosecurity: compliance.has_biosecurity ?? false,
    remarks: compliance.remarks || '',
    status: compliance.status || 'pending',
    user: compliance.user || null,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Memoized handlers
  const handleFarmerTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFarmerFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFarmerCheckboxChange = useCallback((name: string, checked: boolean) => {
    setFarmerFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  const handleAdminTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleAdminCheckboxChange = useCallback((name: string, checked: boolean) => {
    setAdminFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  const handleAdminStatusChange = useCallback((value: string) => {
    setAdminFormData(prev => ({ ...prev, status: value }));
  }, []);

  // Submit handlers
  const handleFarmerSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submitData = {
      has_septic_tank: farmerFormData.has_septic_tank,
      has_drainage: farmerFormData.has_drainage,
      proper_waste_disposal: farmerFormData.proper_waste_disposal,
      distance_from_residence: farmerFormData.distance_from_residence,
      meets_distance_requirement: farmerFormData.meets_distance_requirement,
      has_proper_pen: farmerFormData.has_proper_pen,
      has_biosecurity: farmerFormData.has_biosecurity,
    };
    
    router.put(`/farm-compliance/${compliance.id}`, submitData, {
      onSuccess: () => {
        setIsEditing(false);
        setIsSubmitting(false);
        toast.success("Farm compliance updated successfully!");
        router.reload();
      },
      onError: (errors: any) => {
        console.error('Update failed:', errors);
        setErrors(errors);
        setIsSubmitting(false);
        toast.error("Failed to update compliance");
      },
    });
  }, [farmerFormData, compliance.id]);

  const handleAdminSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    const submitData = {
      registration_number: adminFormData.registration_number,
      lgu_name: adminFormData.lgu_name,
      barangay_name: adminFormData.barangay_name,
      date_registered: adminFormData.date_registered,
      valid_until: adminFormData.valid_until,
      has_septic_tank: adminFormData.has_septic_tank,
      has_drainage: adminFormData.has_drainage,
      proper_waste_disposal: adminFormData.proper_waste_disposal,
      distance_from_residence: adminFormData.distance_from_residence,
      meets_distance_requirement: adminFormData.meets_distance_requirement,
      has_proper_pen: adminFormData.has_proper_pen,
      has_biosecurity: adminFormData.has_biosecurity,
      remarks: adminFormData.remarks,
      status: adminFormData.status,
    };
    
    router.put(`/farm-compliance/${compliance.id}`, submitData, {
      onSuccess: () => {
        setIsEditing(false);
        setIsSubmitting(false);
        toast.success("Farm compliance updated successfully!");
        router.reload();
      },
      onError: (errors: any) => {
        console.error('Update failed:', errors);
        setErrors(errors);
        setIsSubmitting(false);
        toast.error("Failed to update compliance");
      },
    });
  }, [adminFormData, compliance.id]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setErrors({});
    setAdminFormData({
      registration_number: compliance.registration_number || '',
      lgu_name: compliance.lgu_name || '',
      barangay_name: compliance.barangay_name || '',
      date_registered: compliance.date_registered || '',
      valid_until: compliance.valid_until || '',
      has_septic_tank: compliance.has_septic_tank ?? false,
      has_drainage: compliance.has_drainage ?? false,
      proper_waste_disposal: compliance.proper_waste_disposal ?? false,
      distance_from_residence: compliance.distance_from_residence || '0',
      meets_distance_requirement: compliance.meets_distance_requirement ?? false,
      has_proper_pen: compliance.has_proper_pen ?? false,
      has_biosecurity: compliance.has_biosecurity ?? false,
      remarks: compliance.remarks || '',
      status: compliance.status || 'pending',
      user: compliance.user || null,
    });
  }, [compliance]);

  const getStatusBadge = () => {
    switch (compliance.status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">✓ Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">⏳ Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">✗ Rejected</Badge>;
      default:
        return <Badge variant="outline">{compliance.status}</Badge>;
    }
  };

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) => (
    <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-sm text-slate-800 dark:text-gray-200 font-medium">{value || '—'}</div>
    </div>
  );

  return (
    <TooltipProvider>
      <div
        className="min-h-screen bg-cover bg-center relative overflow-hidden dark:bg-gray-900"
        style={{
          backgroundImage: "url('/485800765_1117928273470191_4976529546870698484_n.jpg')",
        }}
      >
        <Toaster position="top-right" richColors />
        
        {/* Overlay for blur & readability */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"></div>

        {/* Main Navigation Header */}
        <header className="sticky top-0 z-50 w-full bg-green-900/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-green-800 dark:border-gray-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-white hover:text-green-200 dark:text-gray-100 dark:hover:text-green-400 transition-colors">
                  <span className="text-green-300 dark:text-green-500">Livestock</span> System
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm
                      ${item.active 
                        ? 'bg-green-700 dark:bg-green-800 text-white shadow-lg border border-green-600 dark:border-green-700' 
                        : 'text-green-100 dark:text-gray-300 hover:bg-green-800 dark:hover:bg-gray-800 hover:text-white border border-transparent hover:border-green-600 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <item.icon size={16} />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Page Header */}
        {showPageHeader && (
          <div className="relative z-10 w-full bg-gradient-to-b from-green-900/30 to-green-800/10 dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-sm py-6 border-b border-green-800/20 dark:border-gray-700/20 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-green-100 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-green-300 dark:text-green-500" />
                    Farm Authorization Details
                  </h1>
                  <p className="text-green-200/90 dark:text-gray-300">
                    DA Livestock Registry & Compliance Information
                  </p>
                </div>
                <Button 
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 bg-green-800/40 dark:bg-gray-700/40 hover:bg-green-700/60 dark:hover:bg-gray-600/60 text-white border border-green-700 dark:border-gray-600 self-start sm:self-center"
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft size={16} />
                  Back
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div 
          ref={mainContentRef}
          className={`absolute inset-x-0 bottom-0 overflow-y-auto transition-all duration-300 ${
            showPageHeader ? 'top-[160px]' : 'top-[64px]'
          }`}
        >
          <Head title="Farm Compliance Details" />

          <div className="max-w-7xl mx-auto py-20 sm:py-6 px-4">
            <div className="space-y-6">
              
              {/* Hero Message / Status Card */}
              <div className="bg-gradient-to-br from-blue-900/90 to-blue-800/90 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-blue-700/30 dark:border-gray-700 overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="bg-blue-500/20 dark:bg-blue-500/10 p-3 rounded-full">
                      <ShieldCheck className="w-12 h-12 text-blue-300 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-white dark:text-gray-100">
                          Registration Status
                        </h2>
                        {getStatusBadge()}
                        {isAdmin && (
                          <Badge variant="outline" className="border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                            Admin View
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-4 text-blue-100 dark:text-gray-300">
                        <p className="text-xl font-semibold">
                          {compliance.status === 'approved' ? '✓ Approved Member' : compliance.status === 'pending' ? '⏳ Pending Verification' : '✗ Not Approved'}
                        </p>
                        {compliance.verified_at && (
                          <div className="bg-blue-950/50 dark:bg-gray-800/50 p-4 rounded-lg border border-blue-700/50 dark:border-gray-700">
                            <p className="text-sm">
                              <span className="font-semibold text-white dark:text-gray-200">Verified on:</span>{' '}
                              {format(new Date(compliance.verified_at), 'MMMM d, yyyy')}
                              {compliance.verifier && ` by ${compliance.verifier.name}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Information Card - Shows for all statuses */}
              <ComprehensiveInfoCard compliance={compliance} />

              {/* Toggle Compliance Details Section */}
              <div className="bg-gradient-to-b from-green-900/80 to-green-800/80 dark:from-gray-800/95 dark:to-gray-900/95 rounded-xl shadow-lg border border-green-700/30 dark:border-gray-700 backdrop-blur-sm overflow-hidden">
                <button
                  onClick={() => setShowComplianceDetails(!showComplianceDetails)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-green-700/30 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-5 h-5 ${showComplianceDetails ? 'text-green-300 dark:text-green-400' : 'text-green-400 dark:text-green-500'}`} />
                    <span className="font-medium text-white dark:text-gray-100">
                      Detailed Compliance Information
                    </span>
                    <Badge variant="outline" className="bg-green-700/50 dark:bg-gray-700/50 text-green-100 dark:text-gray-300 border-green-500 dark:border-gray-600">
                      Technical Details
                    </Badge>
                  </div>
                  {showComplianceDetails ? (
                    <ChevronUp className="w-5 h-5 text-green-300 dark:text-green-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-green-400 dark:text-green-500" />
                  )}
                </button>

                {/* Compliance Details Section */}
                {showComplianceDetails && (
                  <div className="p-6 border-t border-green-700/30 dark:border-gray-700">
                    {/* Edit Button */}
                    {!isEditing && (
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Approval
                        </Button>
                      </div>
                    )}

                    {/* Show appropriate edit UI */}
                    {!isAdmin && (
                      <FarmerEditDialogComponent
                        open={isEditing}
                        onOpenChange={setIsEditing}
                        formData={farmerFormData}
                        onTextChange={handleFarmerTextChange}
                        onCheckboxChange={handleFarmerCheckboxChange}
                        onSubmit={handleFarmerSubmit}
                        isSubmitting={isSubmitting}
                      />
                    )}
                    
                    {isAdmin && isEditing && (
                      <AdminEditFormComponent
                        formData={adminFormData}
                        errors={errors}
                        onTextChange={handleAdminTextChange}
                        onCheckboxChange={handleAdminCheckboxChange}
                        onStatusChange={handleAdminStatusChange}
                        onSubmit={handleAdminSubmit}
                        onCancel={handleCancel}
                        isSubmitting={isSubmitting}
                        verifiedAt={compliance.verified_at}
                        verifierName={compliance.verifier?.name}
                      />
                    )}

                    {/* Display Mode */}
                    {!isEditing && (
                      <div className="space-y-6">
                        {/* Combined Farmer and Registration Info - One card for admin */}
                        <Card className="bg-white/95 dark:bg-gray-800/95 pt-0 border border-green-200/30 dark:border-gray-700">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50  pt-5 dark:from-gray-700 dark:to-gray-800/50">
                            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-gray-100">
                              <User className="h-5 w-5" />
                              Farmer & Registration Information
                            </CardTitle>
                            <CardDescription className="text-green-700/70 dark:text-gray-400">
                              Complete farmer profile and registration details
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Farmer Information Section */}
                              {isAdmin && compliance.user && (
                                <div className="pb-4 border-b border-slate-200 dark:border-gray-700">
                                  <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Farmer Profile
                                  </h4>
                                  <div className="flex items-start gap-4 mb-4">
                                    <Avatar className="w-16 h-16 border-2 border-green-500 dark:border-green-600 shadow-md">
                                      {compliance.user.profile_picture ? (
                                        <AvatarImage src={compliance.user.profile_picture} alt={compliance.user.name} />
                                      ) : null}
                                      <AvatarFallback className="bg-green-600 dark:bg-green-700 text-white text-lg">
                                        {getInitials(compliance.user.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{compliance.user.name}</h3>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">Farmer ID: #{compliance.user_id}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <InfoRow label="Email Address" value={compliance.user.email} icon={Mail} />
                                    {compliance.user.phone && (
                                      <InfoRow label="Phone Number" value={compliance.user.phone} icon={Phone} />
                                    )}
                                    {compliance.user.address && (
                                      <InfoRow label="Address" value={compliance.user.address} icon={Home} />
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Registration Information Section */}
                              <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Registration Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <InfoRow label="Registration Number" value={compliance.registration_number} icon={Hash} />
                                  <InfoRow label="Date Registered" value={compliance.date_registered ? format(new Date(compliance.date_registered), 'MMMM d, yyyy') : '—'} icon={Calendar} />
                                  <InfoRow label="Valid Until" value={compliance.valid_until ? format(new Date(compliance.valid_until), 'MMMM d, yyyy') : '—'} icon={Clock} />
                                  <InfoRow label="LGU Name" value={compliance.lgu_name} icon={Building} />
                                  <InfoRow label="Barangay Name" value={compliance.barangay_name} icon={MapPin} />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Farm Compliance Checklist */}
                        <Card className="bg-white/95 dark:bg-gray-800/95 pt-0 border border-green-200/30 dark:border-gray-700">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 pt-5 dark:from-gray-700 dark:to-gray-800/50">
                            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-gray-100">
                              <CheckCircle className="h-5 w-5" />
                              Farm Compliance Checklist
                            </CardTitle>
                            <CardDescription className="text-green-700/70 dark:text-gray-400">
                              Compliance with DA livestock farming standards
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/30 rounded">
                                <span className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"><Droplets className="h-4 w-4 flex-shrink-0" /> Has Septic Tank</span>
                                {compliance.has_septic_tank ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" /> : <X className="h-5 w-5 text-rose-500 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/30 rounded">
                                <span className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"><Droplets className="h-4 w-4 flex-shrink-0" /> Has Drainage System</span>
                                {compliance.has_drainage ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" /> : <X className="h-5 w-5 text-rose-500 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/30 rounded">
                                <span className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"><Trash className="h-4 w-4 flex-shrink-0" /> Proper Waste Disposal</span>
                                {compliance.proper_waste_disposal ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" /> : <X className="h-5 w-5 text-rose-500 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/30 rounded">
                                <span className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"><DoorClosed className="h-4 w-4 flex-shrink-0" /> Has Proper Pen</span>
                                {compliance.has_proper_pen ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" /> : <X className="h-5 w-5 text-rose-500 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/30 rounded">
                                <span className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"><Biohazard className="h-4 w-4 flex-shrink-0" /> Has Biosecurity</span>
                                {compliance.has_biosecurity ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" /> : <X className="h-5 w-5 text-rose-500 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/30 rounded">
                                <span className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"><Ruler className="h-4 w-4 flex-shrink-0" /> Meets Distance Req</span>
                                {compliance.meets_distance_requirement ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" /> : <X className="h-5 w-5 text-rose-500 flex-shrink-0" />}
                              </div>
                            </div>
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-gray-700/30 rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"><Ruler className="h-4 w-4 flex-shrink-0" /> Distance from Residence</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{compliance.distance_from_residence || '0'} meters</span>
                              </div>
                            </div>

                            {/* Local Permits Display */}
{(compliance.has_barangay_clearance || compliance.has_business_permit) && (
  <Card className="bg-white/95 dark:bg-gray-800/95 pt-0 border border-green-200/30 dark:border-gray-700">
    <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 pt-5 dark:from-gray-700 dark:to-gray-800/50">
      <CardTitle className="flex items-center gap-2 text-green-900 dark:text-gray-100">
        <FileCheck className="h-5 w-5" />
        Local Government Permits
      </CardTitle>
      <CardDescription className="text-green-700/70 dark:text-gray-400">
        Barangay and Business Permits (for reference only - not required for DA compliance)
      </CardDescription>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Barangay Clearance */}
        {compliance.has_barangay_clearance && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Barangay Clearance</h4>
              <Badge className="bg-green-100 text-green-700 ml-2">✓ Cleared</Badge>
            </div>
            <div className="space-y-2 text-sm">
              {compliance.barangay_clearance_number && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Clearance No.:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{compliance.barangay_clearance_number}</span>
                </div>
              )}
              {compliance.barangay_clearance_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Issued Date:</span>
                  <span className="text-gray-700 dark:text-gray-300">{format(new Date(compliance.barangay_clearance_date), 'MMMM d, yyyy')}</span>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Issued by Barangay {compliance.barangay_name}
              </div>
            </div>
          </div>
        )}

        {/* Business Permit */}
        {compliance.has_business_permit && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Business Permit</h4>
              <Badge className="bg-green-100 text-green-700 ml-2">✓ Permitted</Badge>
            </div>
            <div className="space-y-2 text-sm">
              {compliance.business_permit_number && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Permit No.:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{compliance.business_permit_number}</span>
                </div>
              )}
              {compliance.business_permit_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Issued Date:</span>
                  <span className="text-gray-700 dark:text-gray-300">{format(new Date(compliance.business_permit_date), 'MMMM d, yyyy')}</span>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Issued by LGU {compliance.lgu_name}
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Note: These permits are for documentation purposes only and are not required for Farm Operation but recommended.
      </p>
    </CardContent>
  </Card>
)}
                          </CardContent>
                        </Card>

                        {/* Remarks */}
                        {compliance.remarks && (
                          <Card className="bg-white/95 dark:bg-gray-800/95 border border-green-200/30 dark:border-gray-700">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-gray-700 dark:to-gray-800/50">
                              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-gray-100">
                                <AlertCircle className="h-5 w-5" />
                                Remarks
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-slate-700 dark:text-gray-300">{compliance.remarks}</p>
                            </CardContent>
                          </Card>
                        )}

                        {/* System Information */}
                        {/* <Card className="bg-white/95 dark:bg-gray-800/95 border border-green-200/30 dark:border-gray-700">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-gray-700 dark:to-gray-800/50">
                            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-gray-100">
                              <Clock className="h-5 w-5" />
                              System Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <InfoRow label="Created" value={format(new Date(compliance.created_at), 'MMMM d, yyyy h:mm a')} icon={Calendar} />
                            <InfoRow label="Last Updated" value={format(new Date(compliance.updated_at), 'MMMM d, yyyy h:mm a')} icon={Clock} />
                          </CardContent>
                        </Card> */}

                        
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
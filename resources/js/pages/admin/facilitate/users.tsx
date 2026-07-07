import React, { useState, useMemo, useEffect, useRef } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User as UserIcon, 
  Search, 
  Filter, 
  Plus, 
  Pencil, 
  Eye, 
  Calendar,
  MapPin,
  Home,
  Shield,
  Users as UsersIcon,
  ShoppingBag,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  RefreshCw,
  Mail as MailIcon,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import AppLayout from "@/layouts/admin-layout";
import { toast } from "sonner";
import { Toaster } from "sonner";

interface FarmComplianceData {
  id: number;
  status: string;
  verified_at: string | null;
  registration_number: string;
}

interface UserType {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  barangay: string;
  purok: string;
  profile: string;
  firstname: string;
  middlename: string;
  lastname: string;
  farm_compliance?: FarmComplianceData | null;
}

interface Props {
  users: {
    data: UserType[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    links?: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
  };
  overallStats?: {
    total: number;
    farmers: number;
    buyers: number;
    enforcers: number;
    admins: number;
  };
  flash?: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  };
}

export default function UsersPage({ users, overallStats, flash }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("farmer");
  const [isLoading, setIsLoading] = useState(false);
  
  // Create refs for scrolling
  const tableRef = useRef<HTMLDivElement>(null);
  const cardHeaderRef = useRef<HTMLDivElement>(null);

  // Enhanced search that includes firstname, middlename, lastname
  const filteredUsers = useMemo(() => {
    return users.data.filter((u) => {
      // Create full name combinations for searching
      const fullName = `${u.firstname} ${u.middlename} ${u.lastname}`.toLowerCase();
      const fullNameWithoutMiddle = `${u.firstname} ${u.lastname}`.toLowerCase();
      const reverseName = `${u.lastname} ${u.firstname}`.toLowerCase();
      
      const searchLower = search.toLowerCase();
      
      const matchesSearch =
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.barangay.toLowerCase().includes(searchLower) ||
        u.firstname.toLowerCase().includes(searchLower) ||
        u.middlename.toLowerCase().includes(searchLower) ||
        u.lastname.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower) ||
        fullNameWithoutMiddle.includes(searchLower) ||
        reverseName.includes(searchLower) ||
        (u.farm_compliance?.registration_number?.toLowerCase().includes(searchLower) || false);
      
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users.data, search, roleFilter]);

  const totalUsers = users.meta?.total ?? users.data.length;
  const currentPage = users.meta?.current_page ?? 1;
  const perPage = users.meta?.per_page ?? users.data.length;
  const totalPages = users.meta?.last_page ?? 1;

  const startRange = totalUsers === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endRange = Math.min(currentPage * perPage, totalUsers);

  // Use overall stats from backend if available, otherwise calculate from current page
  const stats = overallStats || {
    total: totalUsers,
    farmers: users.data.filter(u => u.role === 'farmer').length,
    buyers: users.data.filter(u => u.role === 'buyer').length,
    enforcers: users.data.filter(u => u.role === 'enforcer').length,
    admins: users.data.filter(u => u.role === 'admin').length,
  };

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    if (flash?.warning) toast.warning(flash.warning);
    if (flash?.info) toast.info(flash.info);
  }, [flash]);

  // Scroll to top function
  const scrollToTop = (smooth = true) => {
    if (cardHeaderRef.current) {
      cardHeaderRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'start'
      });
    } 
    else if (tableRef.current) {
      tableRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'start'
      });
    }
    else {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive", color: string }> = {
      admin: { 
        icon: <Shield className="w-3 h-3 mr-1" />, 
        variant: "default", 
        color: "bg-blue-100 text-blue-800 hover:bg-blue-200" 
      },
      farmer: { 
        icon: <UsersIcon className="w-3 h-3 mr-1" />, 
        variant: "outline", 
        color: "bg-green-100 text-green-800 hover:bg-green-200" 
      },
      buyer: { 
        icon: <ShoppingBag className="w-3 h-3 mr-1" />, 
        variant: "outline", 
        color: "bg-purple-100 text-purple-800 hover:bg-purple-200" 
      },
      enforcer: { 
        icon: <UserCog className="w-3 h-3 mr-1" />, 
        variant: "outline", 
        color: "bg-amber-100 text-amber-800 hover:bg-amber-200" 
      },
    };

    const config = roleConfig[role] || { 
      icon: <UserIcon className="w-3 h-3 mr-1" />, 
      variant: "outline" as const, 
      color: "bg-gray-100 text-gray-800 hover:bg-gray-200" 
    };

    return (
      <Badge variant={config.variant} className={`capitalize ${config.color}`}>
        {config.icon}
        {role}
      </Badge>
    );
  };

  const getComplianceStatusBadge = (status: string | undefined) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <Clock className="w-3 h-3 mr-1" />
          No Application
        </Badge>
      );
    }
    
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-100 text-rose-700">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (str: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleRefresh = () => {
    setIsLoading(true);
    router.reload({
      onFinish: () => setIsLoading(false)
    });
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      scrollToTop(false);
      router.visit(url, {
        preserveState: true,
        preserveScroll: false,
        replace: false,
        onStart: () => {
          setIsLoading(true);
        },
        onFinish: () => {
          setIsLoading(false);
        }
      });
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    scrollToTop(false);
  }, []);

  return (
    <AppLayout>
      <Head title="Manage Users" />
      <Toaster position="top-right" />

      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div ref={cardHeaderRef} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and view all registered users in the system
              </p>
            </div>
            <Link href="/facilitate/users/create">
              <Button className="dark:bg-sidebar-primary dark:hover:bg-sidebar-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </Link>
          </div>

          {/* Stats Cards - Showing OVERALL totals from database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Total Users Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                    <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Farmers Card */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Farmers</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                      {stats.farmers}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-lg">
                    <UsersIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyers Card */}
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Buyers</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                      {stats.buyers}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enforcers Card */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Enforcers</p>
                    <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                      {stats.enforcers}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-lg">
                    <UserCog className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admins Card */}
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Admins</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                      {stats.admins}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-lg">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  User List
                </CardTitle>
                <CardDescription>
                  Showing {startRange}-{endRange} of {totalUsers} users • Filtered: {filteredUsers.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Filters Section */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, barangay, registration number..."
                      className="pl-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <Select onValueChange={setRoleFilter} defaultValue="farmer">
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="Filter by role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="enforcer">Enforcer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              <div className="flex flex-wrap gap-2">
                {roleFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Role: {roleFilter}
                    <button
                      onClick={() => setRoleFilter('all')}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{search}"
                    <button
                      onClick={() => setSearch('')}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>

            {/* Users Table */}
            <div ref={tableRef} className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800">
                    <TableHead className="w-16"></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registration Number</TableHead>
                    <TableHead>Clearance Status</TableHead>
                    <TableHead>Verified Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="relative">
                            {user.profile ? (
                              <img
                                src={user.profile}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const initials = getUserInitials(user.name);
                                  const color = getRandomColor(user.name);
                                  target.outerHTML = `
                                    <div class="w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm shadow-sm border-2 border-white">
                                      ${initials}
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full ${getRandomColor(user.name)} flex items-center justify-center text-white font-semibold text-sm shadow-sm border-2 border-white`}>
                                {getUserInitials(user.name)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              ID: {user.id}
                            </p>
                            {user.role === 'farmer' && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {user.firstname} {user.lastname}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          
                          <div className="flex-1">
                          {user.role === 'farmer' && user.farm_compliance ? (
                            <div className="flex items-center gap-2">
                              
                              <span className="text-sm font-mono dark:text-gray-300">
                                {user.farm_compliance.registration_number || 'No Membership'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No Membership </span>
                          )}

     
    </div>
    <div className="flex-shrink-0">
      {user.role === 'farmer' && user.farm_compliance && (
        <Link
          href={`/farm-compliance/${user.farm_compliance.id}`}
          className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors group inline-flex"
          title="View Farm Compliance Details"
        >
          <ExternalLink className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
        </Link>
      )}
    </div>
                        </TableCell>
                        <TableCell>
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1">
      {user.role === 'farmer' ? (
        getComplianceStatusBadge(user.farm_compliance?.status)
      ) : (
        <span className="text-sm text-gray-400">—</span>
      )}
    </div>
    <div className="flex-shrink-0">
      {user.role === 'farmer' && user.farm_compliance && (
        <Link
          href={`/farm-compliance/${user.farm_compliance.id}`}
          className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors group inline-flex"
          title="View Farm Compliance Details"
        >
          <ExternalLink className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
        </Link>
      )}
    </div>
  </div>
</TableCell>
                        <TableCell>
                          {user.role === 'farmer' && user.farm_compliance?.verified_at ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="dark:text-gray-300">
                                {formatDate(user.farm_compliance.verified_at)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="dark:text-gray-300">{user.barangay}</span>
                            </div>
                            {user.purok && user.purok !== 'N/A' && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Home className="w-3 h-3" />
                                <span>Purok {user.purok}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                        
                            
                            {/* View User Button */}
                            <Link
                              href={`/facilitate/users/${user.id}`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                              title="View User"
                            >
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </Link>
                            
                            {/* Edit User Button */}
                            <Link
                              href={`/facilitate/users/${user.id}/edit`}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              title="Edit User"
                            >
                              <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <UserIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">No users found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {search || roleFilter !== 'all' 
                                ? 'Try adjusting your search or filters' 
                                : 'No users have been registered yet'}
                            </p>
                          </div>
                          {(search || roleFilter !== 'all') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearch('');
                                setRoleFilter('all');
                              }}
                              className="mt-2"
                            >
                              Clear all filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {users.links && users.links.length > 0 && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(users.links![0].url)}
                      disabled={!users.links![0].url || isLoading}
                    >
                      <ChevronFirst className="w-4 h-4" />
                    </Button>
                    
                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const prevLink = users.links!.find(link => link.label.includes('Previous'));
                        if (prevLink) handlePageChange(prevLink.url);
                      }}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 mx-2">
                      {users.links.slice(1, -1).map((link, idx) => (
                        <Button
                          key={idx}
                          variant={link.active ? "default" : "outline"}
                          size="sm"
                          className={`min-w-[2rem] h-8 ${link.active ? 'bg-sidebar-primary' : ''}`}
                          onClick={() => handlePageChange(link.url)}
                          disabled={!link.url || link.active || isLoading}
                        >
                          <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Button>
                      ))}
                    </div>
                    
                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const nextLink = users.links!.find(link => link.label.includes('Next'));
                        if (nextLink) handlePageChange(nextLink.url);
                      }}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(users.links![users.links!.length - 1].url)}
                      disabled={!users.links![users.links!.length - 1].url || isLoading}
                    >
                      <ChevronLast className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
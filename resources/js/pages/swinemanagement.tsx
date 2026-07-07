// File: resources/js/Pages/swinemanagement.tsx
import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { route } from 'ziggy-js';
import { 
    PiggyBank, 
    Calendar, 
    Wallet, 
    PlusCircle, 
    TrendingUp, 
    PhilippinePeso, 
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    TrendingDown,
    CreditCard,
    ShoppingCart,
    Users,
    Package,
    Store,
    Receipt,
    Activity,
    Clock,
    Filter,
    ArrowUp,
    ArrowDown,
    Siren,
    File
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { PigIcon } from '@/components/icons';
import { type BreadcrumbItem } from '@/types';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';
import { router } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Swine Management',
        href: "#",
    },
];

interface FinancialStats {
    totalExpenses: number;
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
    marketplaceRevenue: number;
    directSaleRevenue: number;
    marketplaceTransactions: number;
    directSales: number;
}

interface MonthlySummary {
    month: string;
    expenses: number;
    marketplace_revenue: number;
    direct_sale_revenue: number;
    total_revenue: number;
    profit: number;
}

interface Expense {
    id: number;
    category: string;
    description: string;
    amount: number;
    date: string;
    created_at: string;
}

interface MarketplaceTransaction {
    id: number;
    type: 'marketplace';
    amount: number;
    quantity: number;
    transaction_date: string;
    state: string;
    listing?: {
        title: string;
    };
    buyer?: {
        name: string;
    };
    created_at: string;
}

interface DirectSale {
    id: number;
    type: 'direct_sale';
    total_amount: number;
    price: number;
    quantity: number;
    sold_at: string;
    buyer_name: string;
    swine?: {
        tag_number: string;
    };
    created_at: string;
}

interface SwineManagementDashboardProps {
    financialStats: FinancialStats;
    selectedYear: number;
    monthlySummary: MonthlySummary[];
    expenseByCategory: Record<string, number>;
    recentExpenses: Expense[];
    recentMarketplaceTransactions: MarketplaceTransaction[];
    recentDirectSales: DirectSale[];
}

const SwineManagementDashboard = ({
    financialStats,
    selectedYear,
    monthlySummary,
    expenseByCategory,
    recentExpenses,
    recentMarketplaceTransactions,
    recentDirectSales
}: SwineManagementDashboardProps) => {
    
    const cards = [
        { 
            title: "Financial Performance", 
            description: "Track revenue, expenses, and profit by swine or group.",
            icon: BarChart3,
            link: "/swine-management/financial-performance",
            color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800"
        },
        { 
            title: "Swine", 
            description: "View and manage all swine records.",
            icon: PigIcon,
            link: "/swine-management/swine",
            color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
        },
        { 
            title: "Swine Scheduling", 
            description: "Monitor feeding, medication, and breeding schedules.",
            icon: Calendar,
            link: "/swine-management/schedules",
            color: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
        },
        { 
            title: "Expenses", 
            description: "Track costs and financial performance.",
            icon: Wallet,
            link: "/swine-management/expenses",
            color: "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800"
        },
        { 
            title: "Add Swine", 
            description: "Register new swine into your records.",
            icon: PlusCircle,
            link: "/swine-management/swine/multicreate",
            color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        },
         { 
            title: "VetMed Clearance", 
            description: "Register new swine into your records.",
            icon: File,
            link: "/vetmed-clearance",
            color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        },
    ];

    // Prepare data for pie chart
    const pieChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value
    }));

    // Color palette for charts
    const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const [year, setYear] = React.useState(Number(selectedYear));
    const [activityFilter, setActivityFilter] = React.useState<'all' | 'expenses' | 'revenue'>('all');

    React.useEffect(() => {
        setYear(Number(selectedYear));
    }, [selectedYear]);

    const changeYear = (newYear: number) => {
        setYear(newYear);
        router.get(
            route('swine.management.dashboard'),
            { year: newYear },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    // Combine all recent activities
    const allActivities = React.useMemo(() => {
        const activities: Array<{
            id: number;
            type: 'expense' | 'marketplace' | 'direct_sale';
            title: string;
            description: string;
            amount: number;
            date: string;
            created_at: string;
            category?: string;
            status?: string;
            buyer?: string;
            isNegative: boolean;
            icon: React.ReactNode;
            color: string;
        }> = [];

        // Add expenses
        recentExpenses.forEach(expense => {
            activities.push({
                id: expense.id,
                type: 'expense',
                title: `Expense - ${expense.category}`,
                description: expense.description || 'No description',
                amount: expense.amount,
                date: expense.date,
                created_at: expense.created_at,
                category: expense.category,
                isNegative: true,
                icon: <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />,
                color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
            });
        });

        // Add marketplace transactions
        recentMarketplaceTransactions.forEach(transaction => {
            activities.push({
                id: transaction.id,
                type: 'marketplace',
                title: transaction.listing?.title || 'Marketplace Sale',
                description: `Sold to ${transaction.buyer?.name || 'customer'}`,
                amount: transaction.amount,
                date: transaction.transaction_date,
                created_at: transaction.created_at,
                status: transaction.state,
                buyer: transaction.buyer?.name,
                isNegative: false,
                icon: <Store className="w-3 h-3 sm:w-4 sm:h-4" />,
                color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
            });
        });

        // Add direct sales
        recentDirectSales.forEach(sale => {
            activities.push({
                id: sale.id,
                type: 'direct_sale',
                title: `Direct Sale - ${sale.swine?.tag_number || 'Swine'}`,
                description: `Sold to ${sale.buyer_name}`,
                amount: sale.total_amount,
                date: sale.sold_at,
                created_at: sale.created_at,
                buyer: sale.buyer_name,
                isNegative: false,
                icon: <PhilippinePeso className="w-3 h-3 sm:w-4 sm:h-4" />,
                color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400'
            });
        });

        // Sort by date (newest first)
        return activities.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 8);
    }, [recentExpenses, recentMarketplaceTransactions, recentDirectSales]);

    // Filter activities based on selected filter
    const filteredActivities = React.useMemo(() => {
        if (activityFilter === 'all') return allActivities;
        if (activityFilter === 'expenses') return allActivities.filter(a => a.type === 'expense');
        if (activityFilter === 'revenue') return allActivities.filter(a => a.type === 'marketplace' || a.type === 'direct_sale');
        return allActivities;
    }, [allActivities, activityFilter]);

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-6">
                <Head title="Swine Management Dashboard" />
                
                {/* Header - Responsive */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Swine Management Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Track your swine operations, expenses, and profits from all sales channels
                    </p>
                </div>

                {/* Financial Overview Cards - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {/* Total Revenue Card */}
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <PhilippinePeso className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${
                                    financialStats.totalRevenue > 0 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                                }`}>
                                    {financialStats.totalTransactions} total sales
                                </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Revenue</h3>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {formatCurrency(financialStats.totalRevenue)}
                            </p>
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                                <div className="bg-green-50 dark:bg-green-900/20 p-1.5 sm:p-2 rounded border border-green-100 dark:border-green-800">
                                    <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-400 font-medium">Marketplace</p>
                                    <p className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-300">
                                        {formatCurrency(financialStats.marketplaceRevenue)}
                                    </p>
                                    <p className="text-[8px] sm:text-[10px] text-green-600 dark:text-green-500">
                                        {financialStats.marketplaceTransactions} sales
                                    </p>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-1.5 sm:p-2 rounded border border-indigo-100 dark:border-indigo-800">
                                    <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-400 font-medium">Direct Sales</p>
                                    <p className="text-xs sm:text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                                        {formatCurrency(financialStats.directSaleRevenue)}
                                    </p>
                                    <p className="text-[8px] sm:text-[10px] text-indigo-600 dark:text-indigo-500">
                                        {financialStats.directSales} sales
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Expenses Card */}
                    <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                    {recentExpenses.length} recent
                                </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Expenses</h3>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {formatCurrency(financialStats.totalExpenses)}
                            </p>
                            <div className="flex items-center mt-2">
                                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                                <span className="text-[10px] sm:text-sm text-red-600 dark:text-red-400 font-medium">
                                    Feed, medication, and operational costs
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Net Profit Card */}
                    <Card className={`border-l-4 ${
                        financialStats.totalProfit >= 0 
                            ? 'border-l-emerald-500' 
                            : 'border-l-rose-500'
                    } hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700`}>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${
                                    financialStats.totalProfit >= 0 
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                                        : 'bg-rose-100 dark:bg-rose-900/30'
                                }`}>
                                    <BarChart3 className={`w-4 h-4 sm:w-6 sm:h-6 ${
                                        financialStats.totalProfit >= 0 
                                            ? 'text-emerald-600 dark:text-emerald-400' 
                                            : 'text-rose-600 dark:text-rose-400'
                                    }`} />
                                </div>
                                {financialStats.totalProfit >= 0 ? (
                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                                        Profitable
                                    </span>
                                ) : (
                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400">
                                        Loss
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Net Profit</h3>
                            <p className={`text-xl sm:text-2xl font-bold ${
                                financialStats.totalProfit >= 0 
                                    ? 'text-emerald-700 dark:text-emerald-400' 
                                    : 'text-rose-700 dark:text-rose-400'
                            }`}>
                                {formatCurrency(financialStats.totalProfit)}
                            </p>
                            <div className="flex items-center mt-2">
                                {financialStats.totalProfit >= 0 ? (
                                    <>
                                        <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 mr-1" />
                                        <span className="text-[10px] sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                            {((financialStats.totalProfit / financialStats.totalRevenue) * 100 || 0).toFixed(1)}% margin
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500 mr-1" />
                                        <span className="text-[10px] sm:text-sm text-rose-600 dark:text-rose-400 font-medium">
                                            Operating at a loss
                                        </span>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity Summary Card */}
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                    {allActivities.length} activities
                                </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Recent Activity</h3>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-1.5 sm:mr-2"></div>
                                        <span className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Expenses</span>
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold dark:text-gray-300">{recentExpenses.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1.5 sm:mr-2"></div>
                                        <span className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Marketplace Sales</span>
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold dark:text-gray-300">{recentMarketplaceTransactions.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full mr-1.5 sm:mr-2"></div>
                                        <span className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Direct Sales</span>
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold dark:text-gray-300">{recentDirectSales.length}</span>
                                </div>
                            </div>
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                                <Link 
                                    href="/swine-management/activity-log"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[10px] sm:text-sm font-medium flex items-center justify-center"
                                >
                                    <Clock className="w-3 h-3 mr-1" />
                                    View Activity Log
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Recent Activity Section - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Monthly Performance Chart */}
                    <div className="lg:col-span-2">
                        <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 h-full">
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
                                <button
                                    onClick={() => changeYear(year - 1)}
                                    className="px-2 sm:px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs sm:text-sm dark:text-gray-300"
                                >
                                    ← {year - 1}
                                </button>
                                <h2 className="text-sm sm:text-base font-semibold dark:text-gray-200">{year} Revenue & Expenses</h2>
                                <button
                                    onClick={() => changeYear(year + 1)}
                                    className="px-2 sm:px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs sm:text-sm dark:text-gray-300"
                                >
                                    {year + 1} →
                                </button>
                            </div>
                            <CardContent className="p-0">
                                <div className="h-64 sm:h-80 p-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlySummary}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                                            <XAxis 
                                                dataKey="month" 
                                                stroke="#6b7280"   
                                                className="dark:stroke-gray-500"
                                                interval={0}
                                                fontSize={10}
                                                tick={{ fontSize: 10 }}
                                            />
                                            <YAxis 
                                                stroke="#6b7280" 
                                                className="dark:stroke-gray-500"
                                                tickFormatter={(value) => `₱${value/1000}k`}
                                                fontSize={10}
                                            />
                                            <Tooltip 
                                                formatter={(value, name) => {
                                                    const formattedValue = formatCurrency(Number(value));
                                                    if (name === 'marketplace_revenue') return [formattedValue, 'Marketplace'];
                                                    if (name === 'direct_sale_revenue') return [formattedValue, 'Direct Sales'];
                                                    if (name === 'total_revenue') return [formattedValue, 'Total Revenue'];
                                                    if (name === 'expenses') return [formattedValue, 'Expenses'];
                                                    if (name === 'profit') return [formattedValue, 'Profit'];
                                                    return [formattedValue, name];
                                                }}
                                                labelFormatter={(label) => `Month: ${label}`}
                                                contentStyle={{ 
                                                    fontSize: '11px',
                                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e5e7eb'
                                                }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar 
                                                dataKey="marketplace_revenue" 
                                                name="Marketplace" 
                                                fill="#10b981" 
                                                stackId="revenue"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar 
                                                dataKey="direct_sale_revenue" 
                                                name="Direct Sales" 
                                                fill="#8b5cf6" 
                                                stackId="revenue"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar 
                                                dataKey="expenses" 
                                                name="Expenses" 
                                                fill="#ef4444" 
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar 
                                                dataKey="profit" 
                                                name="Profit" 
                                                fill="#3b82f6" 
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity Feed - Responsive */}
                    <div>
                        <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 h-full">
                            <CardHeader className="p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center text-sm sm:text-base dark:text-gray-200">
                                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-blue-600 dark:text-blue-400" />
                                        Recent Activity
                                    </CardTitle>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => setActivityFilter('all')}
                                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                                                activityFilter === 'all' 
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setActivityFilter('expenses')}
                                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                                                activityFilter === 'expenses' 
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            Expenses
                                        </button>
                                        <button
                                            onClick={() => setActivityFilter('revenue')}
                                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                                                activityFilter === 'revenue' 
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            Revenue
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4">
                                <div className="space-y-3 sm:space-y-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
                                    {filteredActivities.length > 0 ? (
                                        filteredActivities.map((activity) => (
                                            <div 
                                                key={`${activity.type}-${activity.id}`}
                                                className={`p-2 sm:p-3 rounded-lg transition-colors border-l-4 border-l-gray-200 dark:border-l-gray-700 cursor-pointer
                                                    ${activity.type === 'expense' || activity.type === 'marketplace' || activity.type === 'direct_sale'
                                                        ? 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        : 'bg-gray-50 dark:bg-gray-700/50'
                                                    }`}
                                                onClick={() => {
                                                    if (activity.type === 'expense') {
                                                        router.get('/swine-management/expenses', {
                                                            expense_id: activity.id,
                                                            highlight: true,
                                                        });
                                                    } else if (activity.type === 'direct_sale') {
                                                        router.get(`/marketplace/seller/direct-sale/${activity.id}/edit`);
                                                    } else if (activity.type === 'marketplace') {
                                                        router.get(`/marketplace/transaction/${activity.id}/setup`);
                                                    }
                                                }}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                    <div className="flex items-start space-x-2 sm:space-x-3">
                                                        <div className={`p-1 sm:p-1.5 rounded-full flex-shrink-0 ${activity.color}`}>
                                                            {activity.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
                                                                {activity.title}
                                                            </h4>
                                                            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                                {activity.description}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500">
                                                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5" />
                                                                    {formatDate(activity.date)}
                                                                </span>
                                                                {activity.category && (
                                                                    <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                                                                        {activity.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <span className={`font-semibold text-xs sm:text-sm ${
                                                            activity.isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                                        }`}>
                                                            {activity.isNegative ? '-' : '+'}{formatCurrency(activity.amount)}
                                                        </span>
                                                        <div className="mt-0.5">
                                                            <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full ${
                                                                activity.type === 'expense' 
                                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                                    : activity.type === 'marketplace'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                                    : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400'
                                                            }`}>
                                                                {activity.type === 'expense' ? 'Expense' : 
                                                                 activity.type === 'marketplace' ? 'Marketplace' : 'Direct Sale'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 sm:py-8">
                                            <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-1">No activities found</p>
                                            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                                                {activityFilter === 'all' 
                                                    ? 'Start by adding expenses or making sales'
                                                    : activityFilter === 'expenses'
                                                    ? 'No expenses recorded yet'
                                                    : 'No revenue generated yet'
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <Link 
                                            href="/swine-management/activity-log"
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[10px] sm:text-sm font-medium flex items-center"
                                        >
                                            View All Activity
                                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                        </Link>
                                        <span className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-500">
                                            Showing {filteredActivities.length} of {allActivities.length}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Quick Access Cards and Expense Breakdown - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Quick Access Cards */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">Quick Access</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {cards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <Link key={card.title} href={card.link}>
                                        <Card className={`hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${card.color} hover:scale-[1.02] dark:bg-gray-800`}>
                                            <CardContent className="p-3 sm:p-6">
                                                <div className="flex items-center">
                                                    <div className="p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm mr-3 sm:mr-4">
                                                        <Icon className="w-5 h-5 sm:w-8 sm:h-8 text-sidebar-primary dark:text-sidebar-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-lg">
                                                            {card.title}
                                                        </h3>
                                                        <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                                                            {card.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Expense Breakdown by Category */}
                    <div>
                        <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 h-full">
                            <CardHeader className="p-3 sm:p-4">
                                <CardTitle className="flex items-center text-sm sm:text-base dark:text-gray-200">
                                    <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-purple-600 dark:text-purple-400" />
                                    Expense Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4">
                                {pieChartData.length > 0 ? (
                                    <>
                                        <div className="h-48 sm:h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={pieChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                                                        outerRadius={60}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {pieChartData.map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={COLORS[index % COLORS.length]} 
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                                                        contentStyle={{ 
                                                            fontSize: '11px',
                                                            backgroundColor: 'rgba(255,255,255,0.95)',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e5e7eb'
                                                        }}
                                                    />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                                            {pieChartData.slice(0, 3).map((item, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div 
                                                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2" 
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                        <span className="text-[10px] sm:text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                                                    </div>
                                                    <span className="text-[10px] sm:text-sm font-semibold dark:text-gray-300">
                                                        {formatCurrency(item.value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6 sm:py-8">
                                        <Wallet className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-1">No expense data available</p>
                                        <Link 
                                            href="/swine-management/expenses" 
                                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-[10px] sm:text-sm font-medium mt-1 inline-block"
                                        >
                                            Add your first expense →
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Performance Summary - Responsive */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-800">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">
                                    Financial Performance Summary
                                </h3>
                                <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">
                                    {financialStats.totalProfit >= 0 
                                        ? `You're making a profit of ${formatCurrency(financialStats.totalProfit)} from all sales channels.`
                                        : `You're operating at a loss of ${formatCurrency(-financialStats.totalProfit)}. Consider reviewing expenses or adjusting pricing.`
                                    }
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
    {/* ROI - Standard Calculation */}
    <div className="text-center">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">ROI</p>
        <p className={`text-sm sm:text-base md:text-xl font-bold ${
            financialStats.totalProfit >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
        }`}>
            {financialStats.totalExpenses > 0 
                ? ((financialStats.totalProfit / financialStats.totalExpenses) * 100).toFixed(1)
                : '0.0'}%
        </p>
        <p className="text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
            Return on Investment
        </p>
    </div>
    
    {/* Profit Margin - The 90.6% you asked about */}
    <div className="text-center">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Profit Margin</p>
        <p className={`text-sm sm:text-base md:text-xl font-bold ${
            financialStats.totalRevenue > 0 && (financialStats.totalProfit / financialStats.totalRevenue) > 0.2
                ? 'text-green-600 dark:text-green-400' 
                : financialStats.totalProfit < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400'
        }`}>
            {financialStats.totalRevenue > 0 
                ? ((financialStats.totalProfit / financialStats.totalRevenue) * 100).toFixed(1)
                : '0.0'}%
        </p>
        <p className="text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
            Net Profit ÷ Revenue
        </p>
    </div>
    
    {/* Average Sale Value */}
    <div className="text-center">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Avg. Sale Value</p>
        <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800 dark:text-gray-200">
            {formatCurrency(financialStats.totalRevenue / (financialStats.totalTransactions || 1))}
        </p>
        <p className="text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
            Per Transaction
        </p>
    </div>
    
    {/* Activities Today */}
    <div className="text-center">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Activities Today</p>
        <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800 dark:text-gray-200">
            {allActivities.filter(a => 
                new Date(a.created_at).toDateString() === new Date().toDateString()
            ).length}
        </p>
        <p className="text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
            Last 24 Hours
        </p>
    </div>
</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default SwineManagementDashboard;
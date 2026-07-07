import React, { useState, useRef, useEffect } from "react";
import { useForm, usePage, Link } from "@inertiajs/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import axios from 'axios'; // Add this import
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { 
  PiggyBank, 
  Rocket, 
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Tag,
  Scale,
  Sparkles,
  ChevronRight,
  X,
  Upload,
  FileText,
  Grid3x3,
  Plus,
  Layers,
  TrendingDown,
  TrendingUp,
  PhilippinePeso
} from "lucide-react";
import AppLayout from "@/layouts/marketplaceLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PigIcon } from "@/components/icons";

interface Swine {
  id: number;
  name: string;
  tag_number: string;
  sex: string;
  birthdate: string;
  breed_name: string;
  weight?: number;
  category: string;
  status: string;
}

interface VetmedClearance {
  id: number;
  clearance_number: string;
  updated_at: string;
  issue_date: string;
  expiry_date: string;
}

interface Props {
  availableSwine?: Swine[];
  selectedSwineIds?: number[];
    vetmedClearances?: VetmedClearance[]; // Add this
     latestClearanceId?: number | null; // Add this
       priceControls?: Record<string, { price: number; unit: string; category: string }>; // Add this
     
}

const CreateListing: React.FC<Props> = ({ availableSwine = [], selectedSwineIds = [],  vetmedClearances = [],
  latestClearanceId = null,  priceControls = {} // Add priceControls here with default empty object
 }) => {
  const [selectedCount, setSelectedCount] = useState(selectedSwineIds.length);
  const [activeTab, setActiveTab] = useState<'details' | 'swine'>('details');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
   const [averageExpensePerHead, setAverageExpensePerHead] = useState(0);

 const { auth, authUser } = usePage().props as any;
const userRole = auth?.role || authUser?.role;
const isFarmer = userRole === "farmer";


  const { data, setData, post, errors, processing } = useForm({
    title: "",
    category: "fattening",
    description: "",
    price_per_unit: "",
    price_unit_type: "per_head",
    image: null as File | null,
    images: [] as File[],
    swine_ids: selectedSwineIds,
   vetmed_clearance_id: latestClearanceId, // Auto-select the latest clearance
  });

   // Calculate profitability metrics
  // Calculate profitability metrics
const calculateProfitability = () => {
  if (selectedCount === 0 || totalExpenses === 0) return null;
  
  const averageExpense = totalExpenses / selectedCount;
  const currentPrice = parseFloat(data.price_per_unit);
  
  if (isNaN(currentPrice) || currentPrice === 0) return null;
  
  if (data.price_unit_type === "per_head") {
    const profitPerHead = currentPrice - averageExpense;
    const totalProfit = profitPerHead * selectedCount;
    const profitMargin = (profitPerHead / currentPrice) * 100;
    
    return {
      averageExpense,
      currentPrice,
      profitPerHead: profitPerHead, // ✅ Defined for per_head
      totalProfit: totalProfit, // ✅ Defined for per_head
      profitMargin,
      isProfitable: profitPerHead > 0,
      isBreakEven: Math.abs(profitPerHead) < 0.01,
      suggestedMinPrice: averageExpense,
      suggestedGoodPrice: averageExpense * 1.2,
      suggestedIdealPrice: averageExpense * 1.3,
    };
  } else if (data.price_unit_type === "per_kg") {
    // For per kg, we need average weight of selected swine
    const selectedSwineData = availableSwine.filter(s => data.swine_ids.includes(s.id));
    const totalWeight = selectedSwineData.reduce((sum, swine) => sum + (swine.weight || 0), 0);
    
    if (totalWeight === 0) return null; // Prevent division by zero
    
    const averageWeight = totalWeight / selectedCount;
    const totalValueAtPrice = currentPrice * totalWeight;
    const profitMargin = ((totalValueAtPrice - totalExpenses) / totalExpenses) * 100;
    const totalProfit = totalValueAtPrice - totalExpenses;
    
    return {
      averageExpense,
      currentPrice,
      averageWeight,
      totalValue: totalValueAtPrice,
      totalProfit: totalProfit, // ✅ Defined for per_kg
      profitMargin,
      isProfitable: totalValueAtPrice > totalExpenses,
      isBreakEven: Math.abs(totalValueAtPrice - totalExpenses) < 0.01,
      suggestedMinPrice: totalExpenses > 0 ? totalExpenses / totalWeight : 0,
      suggestedGoodPrice: totalExpenses > 0 ? (totalExpenses * 1.2) / totalWeight : 0,
      suggestedIdealPrice: totalExpenses > 0 ? (totalExpenses * 1.3) / totalWeight : 0,
      // Note: profitPerHead is NOT defined for per_kg mode
    };
  }
  
  return null;
};


// Add this new function after calculateProfitability
// Update calculatePerKgProfitability to ensure all values are numbers
// Calculate per kg profitability - based on target weight only
const calculatePerKgProfitability = () => {
  if (selectedCount === 0 || totalExpenses === 0) return null;
  
  const currentPrice = parseFloat(data.price_per_unit);
  if (isNaN(currentPrice) || currentPrice === 0) return null;
  
  // Calculate minimum total weight needed to break even
  // Formula: totalExpenses / price_per_kg = minimum total kg needed
  const minTotalWeightNeeded = totalExpenses / currentPrice;
  const minAvgWeightPerSwine = minTotalWeightNeeded / selectedCount;
  
  // Calculate potential profit at target weight
  const potentialRevenueAtTarget = currentPrice * minTotalWeightNeeded;
  const potentialProfit = potentialRevenueAtTarget - totalExpenses;
  
  return {
    currentPrice,
    totalExpenses,
    selectedCount,
    minTotalWeightNeeded,
    minAvgWeightPerSwine,
    potentialRevenue: potentialRevenueAtTarget,
    potentialProfit,
    isProfitable: true, // At target weight it's break-even, above is profitable
    suggestedPricePerKg: currentPrice,
  };
};


  const profitability = calculateProfitability();

  // Get color and message for price input based on profitability
 // Get color and message for price input based on profitability
// Update getPriceInputStyle to handle per_kg and per_head separately
// Update getPriceInputStyle to handle per_kg with target weight
const getPriceInputStyle = () => {
  // Handle per_kg pricing separately
  if (data.price_unit_type === "per_kg") {
    if (!data.price_per_unit || selectedCount === 0 || totalExpenses === 0) {
      return { className: "", message: null, color: "gray" };
    }
    
    const perKgData = calculatePerKgProfitability();
    if (!perKgData) {
      return { className: "", message: null, color: "gray" };
    }
    
    const formatNumber = (value: any, decimals: number = 1): string => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      return num.toFixed(decimals);
    };
    
    const formatCurrency = (value: any): string => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      return `₱${num.toLocaleString()}`;
    };
    
    // Always show the target weight message for per_kg
    return {
      className: "border-blue-500 focus:border-blue-500 focus:ring-blue-500/20 bg-blue-50 dark:bg-blue-900/10",
      message: {
        type: "info",
        title: "📊 Target Weight for Profitability",
        description: `At ${formatCurrency(perKgData.currentPrice)}/kg, your selected swine need to weigh at least ${formatNumber(perKgData.minTotalWeightNeeded)} kg total to cover your expenses of ${formatCurrency(perKgData.totalExpenses)}.`,
        suggestion: `Each swine should average ${formatNumber(perKgData.minAvgWeightPerSwine)} kg or more.`,
        targetWeight: perKgData.minTotalWeightNeeded,
        avgTargetWeight: perKgData.minAvgWeightPerSwine,
      },
      color: "blue"
    };
  }
  
  // Handle per_head pricing (keep existing logic)
  if (!profitability || !data.price_per_unit) {
    return { className: "", message: null, color: "gray" };
  }
  
  if (!profitability.isProfitable && !profitability.isBreakEven) {
    return {
      className: "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/10",
      message: {
        type: "loss",
        title: "⚠️ Price Below Break-even Point",
        description: `Your price of ₱${profitability.currentPrice.toLocaleString()} is ₱${(profitability.averageExpense - profitability.currentPrice).toLocaleString()} below the average expense of ₱${profitability.averageExpense.toLocaleString()} per head. You'll lose money on this sale.`,
        suggestedPrice: profitability.suggestedMinPrice,
      },
      color: "red"
    };
  } else if (profitability.isBreakEven) {
    return {
      className: "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10",
      message: {
        type: "break-even",
        title: "💰 Break-even Point",
        description: `Your price exactly covers the average expense of ₱${profitability.averageExpense.toLocaleString()} per head. Consider adding a small markup for profit.`,
        suggestedPrice: profitability.suggestedGoodPrice,
      },
      color: "yellow"
    };
  } else if (profitability.profitMargin < 10) {
    return {
      className: "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10",
      message: {
        type: "low-profit",
        title: "📈 Low Profit Margin",
        description: `Your profit margin is only ${profitability.profitMargin.toFixed(1)}% (₱${profitability.profitPerHead?.toLocaleString()} per head). Consider increasing price for better returns.`,
        suggestedPrice: profitability.suggestedGoodPrice,
      },
      color: "yellow"
    };
  } else {
    return {
      className: "border-green-500 focus:border-green-500 focus:ring-green-500/20 bg-green-50 dark:bg-green-900/10",
      message: {
        type: "profitable",
        title: "✅ Profitable Listing!",
        description: `Great! You'll earn ₱${profitability.profitPerHead?.toLocaleString()} profit per head (${profitability.profitMargin.toFixed(1)}% margin). Total profit: ₱${profitability.totalProfit?.toLocaleString()}`,
      },
      color: "green"
    };
  }
};



  
  const priceInputStyle = getPriceInputStyle();

  
   const fetchTotalExpenses = async (swineIds: number[]) => {
    if (swineIds.length === 0) {
      setTotalExpenses(0);
      setAverageExpensePerHead(0);
      return;
    }

    setIsLoadingExpenses(true);
    try {
      const response = await axios.get('/marketplace/seller/swine/total-expenses', {
        params: { swine_ids: swineIds }
      });
      setTotalExpenses(response.data.total_expenses);
      setAverageExpensePerHead(response.data.total_expenses / swineIds.length);
    } catch (error) {
      console.error('Failed to fetch total expenses:', error);
      setTotalExpenses(0);
      setAverageExpensePerHead(0);
    } finally {
      setIsLoadingExpenses(false);
    }
  };


 
  const toggleSwine = (id: number) => {
    const newSelected = data.swine_ids.includes(id)
      ? data.swine_ids.filter((s) => s !== id)
      : [...data.swine_ids, id];
    setData("swine_ids", newSelected);
    setSelectedCount(newSelected.length);
    fetchTotalExpenses(newSelected); // Fetch expenses for updated selection
  };

  const handleUncheckAll = () => {
    setData("swine_ids", []);
    setSelectedCount(0);
    setTotalExpenses(0); // Reset expenses
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/marketplace/seller", {
      forceFormData: true,
      onError: () => console.log("Validation failed"),
    });
  };

  const formRef = useRef<HTMLFormElement | null>(null);
  const swineListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const firstErrorKey = Object.keys(errors)[0];
    const smoothScrollTo = (element: HTMLElement) => {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    if (firstErrorKey && formRef.current) {
      const el = formRef.current.querySelector(`[name="${firstErrorKey}"]`);
      if (el) {
        smoothScrollTo(el as HTMLElement);
        (el as HTMLElement).focus();
        return;
      }
    }

    if (errors.swine_ids && swineListRef.current) {
      setActiveTab('swine');
      smoothScrollTo(swineListRef.current);
      swineListRef.current.classList.add("ring-2", "ring-red-500", "ring-offset-2");
      setTimeout(() => {
        swineListRef.current?.classList.remove("ring-2", "ring-red-500", "ring-offset-2");
      }, 1500);
    }
  }, [errors]);

  const calculateAgeInDays = (birthdate: string): number => {
    const birth = new Date(birthdate);
    const today = new Date();
    const diffInTime = today.getTime() - birth.getTime();
    return Math.floor(diffInTime / (1000 * 60 * 60 * 24));
  };

  const getAgeColor = (days: number) => {
    if (days < 60) return "text-blue-600 dark:text-blue-400";
    if (days < 180) return "text-green-600 dark:text-green-400";
    return "text-amber-600 dark:text-amber-400";
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, bg: string }> = {
      active: { color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/30" },
      available: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
      sold: { color: "text-gray-700 dark:text-gray-300", bg: "bg-gray-100 dark:bg-gray-800" },
      reserved: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    };
    
    const style = statusMap[status.toLowerCase()] || { color: "text-gray-700", bg: "bg-gray-100" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>
        {status}
      </span>
    );
  };

  useEffect(() => {
    if (selectedSwineIds && selectedSwineIds.length > 0) {
      const availableIds = availableSwine.map((s) => s.id);
      const numericIds = selectedSwineIds
        .map((id) => Number(id))
        .filter((id) => availableIds.includes(id));
      setData("swine_ids", numericIds);
      setSelectedCount(numericIds.length);
      fetchTotalExpenses(numericIds); // Fetch expenses for initial selection
    }
  }, [selectedSwineIds, availableSwine]);


    const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

 useEffect(() => {
    if (data.category && priceControls[data.category]) {
      const priceData = priceControls[data.category];
      setData({
        ...data,
        price_per_unit: priceData.price.toString(),
        price_unit_type: priceData.unit
      });
    }
  }, [data.category, priceControls]); // Run when category changes or priceControls loads

  return (
    <AppLayout>

        {!isFarmer ? (


  <>
        {/* KEEP EVERYTHING YOU ALREADY HAVE BELOW */}
      {/* Main Container */}
{/*      
      /* NON-FARMER VIEW */ }
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-lg w-full p-6 sm:p-8 text-center shadow-sm border">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-amber-500" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            Farmer Registration Required
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            You need to be a registered farmer in DA Livestock to create marketplace listings.
            Please complete your farmer information to continue. Inquiry to DA Bunawan Office
          </p>

          <Link href="/user-informations/create">
            <Button className="w-full">
              Register as Farmer
            </Button>
          </Link>
        </Card>
      </div>
            </>

            
    ) : (
      /* FARMER VIEW (YOUR EXISTING CODE) */
    

           <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 
                      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        
        {/* Header Hero Section - Optimized for Mobile */}
        <div className="bg-gradient-to-r from-green-800 via-green-700 to-green-900 
                        dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
                        text-white py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
  {/* Left side: Icon and Title */}
  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
    <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0">
      <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
    </div>
    <div className="flex-1 min-w-0">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
        Create New Listing
      </h1>
      <p className="text-green-100/80 dark:text-gray-300 text-sm sm:text-base lg:text-lg">
        Showcase your livestock to buyers
      </p>
    </div>
  </div>

  {/* Right side: Links - On mobile they appear below, on sm+ they appear to the right */}
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
    <Link
      href="/marketplace/seller/direct-sale"
      className="inline-flex items-center justify-center sm:justify-start gap-2 
                 text-sm font-semibold text-white 
                 bg-white/20 hover:bg-white/30 
                 px-4 py-2.5 sm:py-2 rounded-lg transition
                 w-full sm:w-auto text-center sm:text-left"
    >
      Direct Sale
    </Link>
    <Link
      href="/swine-management/swine/multicreate"
      className="inline-flex items-center justify-center sm:justify-start gap-2 
                 text-sm font-semibold text-white 
                 bg-white/20 hover:bg-white/30 
                 px-4 py-2.5 sm:py-2 rounded-lg transition
                 w-full sm:w-auto text-center sm:text-left"
    >
      <Plus className="w-4 h-4" />
      Record Swine
    </Link>
  </div>
</div>
              
              <div className="flex items-center justify-between sm:justify-center gap-4 
                              bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm 
                              rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 
                              dark:border-gray-700 w-full sm:w-auto">
                <div className="text-center flex-1 sm:flex-none">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">{availableSwine.length}</div>
                  <div className="text-xs sm:text-sm text-green-100/80 dark:text-gray-400">Available</div>
                </div>
                <div className="h-8 sm:h-12 w-px bg-white/30 dark:bg-gray-600"></div>
                <div className="text-center flex-1 sm:flex-none">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">{selectedCount}</div>
                  <div className="text-xs sm:text-sm text-green-100/80 dark:text-gray-400">Selected</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Tab Navigation - Optimized */}
          <div className="mb-4 sm:mb-6 lg:mb-8 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl 
                          shadow-sm sm:shadow-lg p-1 sm:p-2 border border-gray-200 dark:border-gray-700">
            <div className="flex space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 
                          px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium 
                          transition-all text-sm sm:text-base ${
                  activeTab === 'details'
                    ? 'bg-green-600 text-white shadow-sm sm:shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Details</span>
                {activeTab === 'details' && <ChevronRight className="hidden sm:block ml-auto" size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('swine')}
                className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 
                          px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium 
                          transition-all text-sm sm:text-base ${
                  activeTab === 'swine'
                    ? 'bg-green-600 text-white shadow-sm sm:shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Swine</span>
                <Badge variant="secondary" className="ml-1 sm:ml-2 bg-white/20 text-white 
                                                      text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
                  {selectedCount}
                </Badge>
                {activeTab === 'swine' && <ChevronRight className="hidden sm:block ml-auto" size={16} />}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* LEFT PANEL - Form */}
            <div className={`space-y-4 sm:space-y-6 lg:space-y-8 ${activeTab !== 'details' && 'lg:block hidden'}`}>
              {/* Form Card */}
              <Card className="rounded-xl sm:rounded-2xl overflow-hidden 
                              bg-gradient-to-br from-white via-green-50/30 to-white
                              dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900
                              border border-green-100/50 dark:border-gray-700
                              shadow-sm sm:shadow-lg shadow-green-100/20 dark:shadow-gray-900/30">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                        Listing Information
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Fill in the details for your marketplace listing
                      </p>
                    </div>
                  </div>

                  <form ref={formRef} onSubmit={submit} className="space-y-4 sm:space-y-6">
  {/* Title */}
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
      <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>Listing Title</span>
      <span className="text-xs text-gray-500 ml-1">(Required)</span>
      {!data.vetmed_clearance_id && errors.vetmed_clearance_id && (
  <div className="text-xs text-red-600 mt-1">
    Please select a Vetmed Clearance

  </div>
)}

    </label>
    <Input
      placeholder="e.g., Premium Fattening Pigs - Ready for Market"
      value={data.title}
      onChange={(e) => setData("title", e.target.value)}
      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 
                focus:border-green-500 focus:ring-green-500/20 
                dark:focus:ring-green-500/30 text-sm sm:text-base"
    />
    {errors.title && (
      <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-2 sm:p-3 
                    bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{errors.title}</span>
      </div>
    )}
  </div>

  {/* Category, Price & Unit Row - RESPONSIVE 3-COLUMN LAYOUT */}
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Pricing & Details
      </label>
      <span className="text-xs text-gray-500">All fields required</span>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Category - Column 1 */}
      {/* Category - Column 1 with price display */}
<div className="space-y-2">
  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
    <Grid3x3 className="w-3.5 h-3.5" />
    <span>Category</span>
  </label>
  <Select
    value={data.category}
    onValueChange={(value: string) => setData("category", value)}
  >
    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 
                            dark:border-gray-700 focus:border-green-500
                            text-sm h-11 sm:h-12 w-full">
      <SelectValue placeholder="Category" />
    </SelectTrigger>
    <SelectContent className="bg-white dark:bg-gray-800 border-green-200 
                            dark:border-gray-700">
      {/* <SelectItem value="breeder" className="hover:bg-green-50 dark:hover:bg-gray-700 text-sm">
        <div className="flex justify-between items-center w-full">
          <span>Breeder</span>
          {priceControls['breeder'] && (
            <span className="text-xs text-gray-500 ml-2">
              ₱{priceControls['breeder'].price}/{priceControls['breeder'].unit === 'per_head' ? 'head' : 'kg'}
            </span>
          )}
        </div>
      </SelectItem> */}
      <SelectItem value="piglet" className="hover:bg-green-50 dark:hover:bg-gray-700 text-sm">
        <div className="flex justify-between items-center w-full">
          <span>Piglet</span>
          {priceControls['piglet'] && (
            <span className="text-xs text-gray-500 ml-2">
              ₱{priceControls['piglet'].price}/{priceControls['piglet'].unit === 'per_head' ? 'head' : 'kg'}
            </span>
          )}
        </div>
      </SelectItem>
      <SelectItem value="fattening" className="hover:bg-green-50 dark:hover:bg-gray-700 text-sm">
        <div className="flex justify-between items-center w-full">
          <span>Fattening</span>
          {priceControls['fattening'] && (
            <span className="text-xs text-gray-500 ml-2">
              ₱{priceControls['fattening'].price}/{priceControls['fattening'].unit === 'per_head' ? 'head' : 'kg'}
            </span>
          )}
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
  
  {/* Show price info when category is selected */}
  {data.category && priceControls[data.category] && (
    <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
     
      <span>Assigned Price by DA: ₱{priceControls[data.category].price} per {priceControls[data.category].unit === 'per_head' ? 'head' : 'kg'}</span>
    </div>
  )}
</div>

      {/* Price Input - Column 2 */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
          <PigIcon className="w-3.5 h-3.5" />
          <span>Price</span>
        </label>
        <div className="relative">
          <span className="absolute right-8 top-1/2 transform -translate-y-1/2 
                         text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
            ₱
          </span>
          <Input
            type="number"
            disabled
            placeholder="0.00"
            value={data.price_per_unit}
            onChange={(e) => setData("price_per_unit", e.target.value)}
            className={`pl-8 sm:pl-30 bg-white dark:bg-gray-800 
                      ${priceInputStyle.className}
                      text-sm h-11 sm:h-12 w-full transition-all duration-300`}
          />
        </div>
        
       
        
        {/* Show average expense even when no price is set */}
       {/* Show expense info when no price is set */}
{selectedCount > 0 && totalExpenses > 0 && !data.price_per_unit && (
  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <p className="text-xs text-blue-700 dark:text-blue-300">
      <PhilippinePeso className="w-3 h-3 inline mr-1" />
      {data.price_unit_type === "per_head" ? (
        <>Average expense per head: ₱{averageExpensePerHead.toLocaleString()}</>
      ) : (
        <>
          <span className="font-medium">Total expenses: ₱{totalExpenses.toLocaleString()}</span> for {selectedCount} swine
          <br />
          <span className="text-xs text-gray-500">Enter a price per kg to see the minimum weight needed for profitability</span>
          <br />
          <span className="text-xs text-gray-500 mt-1 block">
            Formula: Total expenses ÷ Price per kg = Minimum kg needed
          </span>
        </>
      )}
    </p>
  </div>
)}
        
        {errors.price_per_unit && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            {errors.price_per_unit}
          </div>
        )}
      </div>

      {/* Unit Selector - Column 3 */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
          <Scale className="w-3.5 h-3.5" />
          <span>Unit</span>
        </label>
        <Select
          value={data.price_unit_type}
          onValueChange={(value: string) => setData("price_unit_type", value)}
        >
          <SelectTrigger className="bg-white dark:bg-gray-800 
                                  border-gray-300 dark:border-gray-700
                                  text-sm h-11 sm:h-12 w-full">
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-green-200 
                                  dark:border-gray-700">
            <SelectItem value="per_head" className="hover:bg-green-50 dark:hover:bg-gray-700 text-sm">Per Head</SelectItem>
            <SelectItem value="per_kg" className="hover:bg-green-50 dark:hover:bg-gray-700 text-sm">Per Kg</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>

  <div>
     {/* Profitability Message */}
        {/* Profitability Message */}
{/* Profitability Message */}
{/* Profitability Message */}
{data.price_per_unit && selectedCount > 0 && totalExpenses > 0 && (
  <div className={`mt-2 p-3 rounded-lg border ${
    priceInputStyle.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
    priceInputStyle.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
    priceInputStyle.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
    priceInputStyle.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
    'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
  }`}>
    <div className="flex items-start gap-2">
      {priceInputStyle.color === 'red' && <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
      {priceInputStyle.color === 'yellow' && <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />}
      {priceInputStyle.color === 'green' && <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />}
      {priceInputStyle.color === 'blue' && <Scale className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />}
      
      <div className="flex-1">
        <p className={`text-sm font-semibold ${
          priceInputStyle.color === 'red' ? 'text-red-700 dark:text-red-300' :
          priceInputStyle.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
          priceInputStyle.color === 'green' ? 'text-green-700 dark:text-green-300' :
          priceInputStyle.color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
          'text-gray-700 dark:text-gray-300'
        }`}>
          {priceInputStyle.message?.title}
        </p>
        <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
          {priceInputStyle.message?.description}
        </p>
        
        {/* Show suggestion/target weight info */}
        {priceInputStyle.message?.suggestion && (
          <p className="text-xs mt-1 text-blue-600 dark:text-blue-400 font-medium">
            💡 {priceInputStyle.message.suggestion}
          </p>
        )}
        
        {/* Show additional target weight details for per_kg */}
        {data.price_unit_type === "per_kg" && priceInputStyle.message?.targetWeight && (
          <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-md">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              📌 To achieve profitability:
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Minimum total weight:</span>
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {(priceInputStyle.message.targetWeight as number).toFixed(1)} kg
                </p>
              </div>
              <div>
                <span className="text-gray-500">Minimum per swine:</span>
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {(priceInputStyle.message.avgTargetWeight as number).toFixed(1)} kg each
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Suggested Price Buttons for per_head */}
        {data.price_unit_type === "per_head" && priceInputStyle.message?.suggestedPrice !== undefined && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Suggested price:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setData("price_per_unit", priceInputStyle.message!.suggestedPrice!.toString())}
              className="text-xs h-7 px-2 bg-white dark:bg-gray-800 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
            >
              ₱{priceInputStyle.message.suggestedPrice.toLocaleString()}/head
            </Button>
            
            {profitability?.suggestedGoodPrice !== undefined && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setData("price_per_unit", profitability.suggestedGoodPrice!.toString())}
                className="text-xs h-7 px-2 bg-white dark:bg-gray-800 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
              >
                Good: ₱{profitability.suggestedGoodPrice.toLocaleString()}/head
              </Button>
            )}
          </div>
        )}
        
        {/* Additional metrics for per_head */}
        {data.price_unit_type === "per_head" && profitability && (
          <div className="mt-2 flex gap-3 text-xs flex-wrap">
            <span className="text-gray-500">Avg expense/head:</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              ₱{averageExpensePerHead.toLocaleString()}
            </span>
            <span className="text-gray-500">| Profit/head:</span>
            <span className={`font-medium ${(profitability.profitPerHead || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(profitability.profitPerHead || 0) > 0 ? '+' : ''}₱{(profitability.profitPerHead || 0).toLocaleString()}
            </span>
            <span className="text-gray-500">| Margin:</span>
            <span className={`font-medium ${(profitability.profitMargin || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(profitability.profitMargin || 0).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
)}
  </div>

  {/* Description */}
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>Description</span>
      {/* <span className="text-xs text-gray-500 ml-1">()</span> */}
    </label>
    <Textarea
      placeholder="Describe your swine, including health status, diet, and any special features..."
      value={data.description}
      onChange={(e) => setData("description", e.target.value)}
      className="min-h-[100px] sm:min-h-[120px] bg-white dark:bg-gray-800 
                border-gray-300 dark:border-gray-700 focus:border-green-500 
                resize-none text-sm sm:text-base"
      rows={4}
    />
  </div>

  {/* Image Uploads */}
  <div className="space-y-4 sm:space-y-6">
    {/* Thumbnail */}
    {/* Thumbnail */}
<div className="space-y-2">
  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    <span>Thumbnail Image</span>
    <span className="text-xs text-gray-500 ml-1">(Required)</span>
  </label>
  
  {/* Show preview if image is selected */}
  {data.image ? (
    <div className="relative rounded-lg sm:rounded-xl overflow-hidden border-2 border-green-500">
      <img
        src={URL.createObjectURL(data.image)}
        alt="Thumbnail preview"
        className="w-full h-48 sm:h-64 object-cover"
      />
      <button
        type="button"
        onClick={() => setData("image", null)}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full 
                 p-1.5 hover:bg-red-600 transition-colors shadow-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <div 
      onClick={() => document.getElementById('thumbnail-upload')?.click()}
      className="border-2 border-dashed border-gray-300 dark:border-gray-700 
                rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-green-500 
                transition-colors cursor-pointer bg-white/50 dark:bg-gray-800/50"
    >
      <Upload className="mx-auto text-gray-400 dark:text-gray-500 mb-2 sm:mb-3" size={20} />
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
        PNG, JPG, GIF up to 5MB
      </p>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setData("image", e.target.files[0]);
          }
        }}
        className="hidden"
        id="thumbnail-upload"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation(); // Prevent the div's onClick from firing
          document.getElementById('thumbnail-upload')?.click();
        }}
        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 
                 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
      >
        Choose File
      </Button>
    </div>
  )}
  
  {/* Show filename if selected */}
  {data.image && (
    <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
      <CheckCircle className="w-3 h-3" />
      Selected: {data.image.name}
    </p>
  )}
  
  {errors.image && (
    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-2 sm:p-3 
                  bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{errors.image}</span>
    </div>
  )}
</div>

    {/* Additional Images */}
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Additional Photos</span>
        <span className="text-xs text-gray-500 ml-1">(Optional)</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {data.images.map((file, i) => (
          <div key={i} className="relative aspect-square">
            <img
              src={URL.createObjectURL(file)}
              alt={`preview-${i}`}
              className="w-full h-full object-cover rounded-lg border-2 
                       border-gray-200 dark:border-gray-700 group-hover:border-green-500 
                       transition-colors"
            />
            <button
              type="button"
              onClick={() => {
                const newImages = [...data.images];
                newImages.splice(i, 1);
                setData("images", newImages);
              }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full 
                       p-0.5 sm:p-1 hover:bg-red-600 transition-colors shadow-sm sm:shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {data.images.length < 5 && (
          <label className="cursor-pointer">
            <div className="aspect-square border-2 border-dashed border-gray-300 
                          dark:border-gray-700 rounded-lg flex flex-col items-center 
                          justify-center hover:border-green-400 dark:hover:border-green-600 
                          transition-colors group bg-gray-50/50 dark:bg-gray-800/50">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-green-500 
                             dark:group-hover:text-green-400 mb-1" />
              <span className="text-xs text-gray-500 group-hover:text-green-600 
                             dark:group-hover:text-green-400">
                Add Photo
              </span>
            </div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                setData("images", [...data.images, ...files.slice(0, 5 - data.images.length)]);
              }}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  </div>

  
{/* Vetmed Clearance Section - Modified */}
<div className="space-y-2">
  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    <span>Vetmed Clearance</span>
    <span className="text-xs text-red-500 ml-1">(Required)</span>
  </label>
  
  <Select
    value={data.vetmed_clearance_id?.toString() || "none"}
    onValueChange={(value) => setData("vetmed_clearance_id", value === "none" ? null : parseInt(value))}
  >
    <SelectTrigger className={`bg-white dark:bg-gray-800 border-gray-300 
                              dark:border-gray-700 focus:border-green-500
                              text-sm h-11 sm:h-12 w-full ${
      !data.vetmed_clearance_id && errors.vetmed_clearance_id ? 'border-red-500' : ''
    }`}>
      <SelectValue placeholder="Select Vetmed Clearance" />
    </SelectTrigger>
    <SelectContent className="bg-white dark:bg-gray-800 border-green-200 
                            dark:border-gray-700">
      <SelectItem value="none" className="hover:bg-green-50 dark:hover:bg-gray-700 text-sm">
        None (Not Recommended)
      </SelectItem>
      {vetmedClearances.map((clearance) => (
        <SelectItem 
          key={clearance.id} 
          value={clearance.id.toString()}
          className="hover:bg-green-50 dark:hover:bg-gray-700"
        >
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {clearance.clearance_number}
              </span>
              <span className="text-xs text-gray-500">
                Updated: {formatDate(clearance.updated_at)}
              </span>
            </div>
            <div className="flex gap-2 text-xs text-gray-500">
              <span>Issued: {formatDate(clearance.issue_date)}</span>
              {clearance.expiry_date && (
                <span className="text-orange-600">
                  Expires: {formatDate(clearance.expiry_date)}
                </span>
              )}
            </div>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  {/* Show warning when "None" is selected */}
  {data.vetmed_clearance_id === null && (
    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
            ⚠️ No Vetmed Clearance Selected
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Vetmed Clearance is required for listing. Please select a valid clearance or 
            <Link href="/vetmed-clearance/create" className="text-blue-600 hover:underline ml-1">
              upload one now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )}
  
  {/* Show success message when valid clearance is selected */}
  {data.vetmed_clearance_id && (
    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-start gap-2">
        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            ✅ Verified Clearance Selected
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            This listing will display your verified Vetmed Clearance, increasing buyer confidence.
          </p>
        </div>
      </div>
    </div>
  )}
  
  {errors.vetmed_clearance_id && (
    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-2 sm:p-3 
                  bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{errors.vetmed_clearance_id}</span>
    </div>
  )}
</div>

{/* Show warning when NO clearances exist at all */}
{vetmedClearances.length === 0 && (
  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <div className="flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          ⛔ No Valid Vetmed Clearance Found
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          You need a valid Vetmed Clearance to create a listing. 
          <Link href="/vetmed-clearance/create" className="text-blue-600 hover:underline ml-1">
            Upload one now →
          </Link>
        </p>
      </div>
    </div>
  </div>
)}

{/* Submit Button - Disabled if no clearance selected OR no clearances available */}
<Button
  type="submit"
  disabled={processing || !data.vetmed_clearance_id || vetmedClearances.length === 0}
  className="w-full bg-gradient-to-r from-green-600 to-green-700 
            hover:from-green-700 hover:to-green-800 
            dark:from-green-700 dark:to-green-800 
            dark:hover:from-green-600 dark:hover:to-green-700 
            text-white py-4 sm:py-6 rounded-lg sm:rounded-xl text-base sm:text-lg 
            font-semibold shadow-sm sm:shadow-lg hover:shadow-md sm:hover:shadow-xl 
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed 
            mt-4 sm:mt-6"
>
  {processing ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
      <span className="text-sm sm:text-base">Creating Listing...</span>
    </>
  ) : (
    <>
      <Rocket className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-sm sm:text-base">Submit Listing</span>
    </>
  )}
</Button>

{/* Show helper text when button is disabled */}
{(!data.vetmed_clearance_id || vetmedClearances.length === 0) && (
  <p className="text-xs text-red-500 text-center mt-2">
    * Please select a valid Vetmed Clearance to submit your listing
  </p>
)}
</form>
                </div>
              </Card>

              {/* Tips Card */}
              <Card className="rounded-xl sm:rounded-2xl overflow-hidden 
                              bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50
                              dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900
                              border border-blue-100/50 dark:border-gray-700">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                      Tips for Success
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Use clear, well-lit photos",
                      "Include accurate weights and health records",
                      "Set competitive prices",
                      "Provide detailed descriptions",
                      "Respond promptly to inquiries"
                    ].map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>

            {/* RIGHT PANEL - Swine Selection */}
            <div className={`${activeTab !== 'swine' && 'lg:block hidden'}`}>
              <Card className="rounded-xl sm:rounded-2xl overflow-hidden 
                              bg-gradient-to-br from-white via-green-50/30 to-white
                              dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900
                              border border-green-100/50 dark:border-gray-700
                              shadow-sm sm:shadow-lg shadow-green-100/20 dark:shadow-gray-900/30
                              lg:sticky lg:top-4">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                        <Grid3x3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                          Select Your Swine
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          Choose swine to include
                        </p>
                      </div>
                    </div>
                    {selectedCount > 0 && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 
                                                              text-green-700 dark:text-green-400 
                                                              text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-2">
                          {selectedCount} selected
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUncheckAll}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 
                                   dark:hover:bg-red-900/20 dark:text-red-400 
                                   border-red-200 dark:border-red-800 text-xs sm:text-sm"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>

                  <div ref={swineListRef} className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 pb-2">
                    {availableSwine.length > 0 ? (
                      availableSwine.map((s) => {
                        const isSelected = data.swine_ids.includes(s.id);
                        const ageInDays = calculateAgeInDays(s.birthdate);
                        
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleSwine(s.id)}
                            className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all 
                                      cursor-pointer group hover:shadow-sm ${
                              isSelected
                                ? "border-green-500 bg-gradient-to-r from-green-50/50 to-green-100/30 dark:from-green-900/20 dark:to-green-900/10"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 
                                                flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isSelected 
                                    ? 'border-green-500 bg-green-500' 
                                    : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
                                }`}>
                                  {isSelected && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                                      {s.name || `Swine #${s.id}`}
                                    </span>
                                    {getStatusBadge(s.status)}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                      <Tag className="w-3 h-3" />
                                      {s.tag_number}
                                    </span>
                                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                      <Calendar className="w-3 h-3" />
                                      <span className={getAgeColor(ageInDays)}>
                                        {ageInDays}d
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right pl-2">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {s.sex}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px] sm:max-w-[100px]">
                                  {s.breed_name}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-xl 
                                      bg-gray-100 dark:bg-gray-800 
                                      flex items-center justify-center">
                          <AlertCircle className="text-gray-400 dark:text-gray-500 w-8 h-8" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          No Swine Available
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto px-4">
                          All your swine are currently listed or unavailable.
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedCount > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Selected Count */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Selected</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedCount}
                  </span>
                </div>

                {/* Total Expenses - NEW SECTION */}
                <div className="flex items-center justify-between mb-2 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</span>
                    {isLoadingExpenses && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                    )}
                  </div>
                  <span className="text-base font-semibold text-red-600 dark:text-red-400">
                    ₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                

                {/* Estimated Value */}
                {data.price_per_unit && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Value</span>
                    <span className="text-xl font-bold text-green-700 dark:text-green-400">
                      ₱{(parseFloat(data.price_per_unit) * selectedCount).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Net Value (Estimated Value - Total Expenses) - OPTIONAL */}
                {data.price_per_unit && totalExpenses > 0 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Net Value
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₱{((parseFloat(data.price_per_unit) * selectedCount) - totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            )}

                  

                  {/* Mobile Navigation Button */}
                  <div className="lg:hidden mt-6">
                    <Button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'details' ? 'swine' : 'details')}
                      variant="outline"
                      className="w-full py-4 text-sm border-gray-300 dark:border-gray-600 
                               hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {activeTab === 'details' ? (
                        <>
                          <ChevronRight className="mr-2" />
                          Continue to Swine Selection
                        </>
                      ) : (
                        <>
                          <ChevronRight className="mr-2 rotate-180" />
                          Back to Details
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )}
    </AppLayout>
  );
};

export default CreateListing;
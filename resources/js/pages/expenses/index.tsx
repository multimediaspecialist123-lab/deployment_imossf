import React, { useEffect, useState, useRef } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { route } from "ziggy-js";
import AppLayout from "@/layouts/app-layout";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trash } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  quantity: string;
  unit: string;
  date: string;
  swine_ids: number[];
  group_id: number | null;
}

type Swine = {
  id: number;
  name: string;
  tag_number: string;
  status: string;
  group_id?: number | null;
  created_at: string;
  total_expense: number;
  final_amount: number;
};

type Group = {
  id: number;
  name: string;
  swine: Swine[];
};

type Expense = {
  id: number;
  category: string;
  description: string;
  amount: string;
  quantity: string;
  unit: string;
  date: string;
  swine_ids: number[];
  swine_group_id: number | null;
};

// Helper function to safely convert to number and format
const safeNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Helper function to format currency
const formatCurrency = (value: any): string => {
  const num = safeNumber(value);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ExpenseIndex() {
  const { swine, groups, expenses: allExpenses } = usePage().props as any;
  const { selected_group_id, selected_swine_ids, selected_expense } = usePage().props as any;
  
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<ExpenseFormData>({
    category: "feed",
    description: "",
    quantity: "",
    unit: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    swine_ids: [],
    group_id: null,
  });

  const { data, setData, post, put, reset, processing } = form;

  // Filter swine to only show those belonging to selected group
  const filteredSwine = React.useMemo((): Swine[] => {
    if (!swine) return [];
    
    if (selectedGroup) {
      const group = groups.find((g: Group) => g.id === selectedGroup);
      return group?.swine || [];
    }
    
    return [];
  }, [swine, selectedGroup, groups]);

  // Calculate sold swine statistics with safe number conversion
  const soldSwineStats = React.useMemo(() => {
    const soldSwine = filteredSwine.filter((s: Swine) => s.status?.toLowerCase() === 'sold');
    const totalSoldAmount = soldSwine.reduce((sum: number, s: Swine) => sum + safeNumber(s.final_amount), 0);
    const totalExpensesOfSold = soldSwine.reduce((sum: number, s: Swine) => sum + safeNumber(s.total_expense), 0);
    
    return {
      count: soldSwine.length,
      totalAmount: totalSoldAmount,
      totalExpenses: totalExpensesOfSold
    };
  }, [filteredSwine]);

  // Calculate active swine statistics with safe number conversion
  const activeSwineStats = React.useMemo(() => {
    const activeSwine = filteredSwine.filter((s: Swine) => s.status?.toLowerCase() !== 'sold');
    const totalExpensesOfActive = activeSwine.reduce((sum: number, s: Swine) => sum + safeNumber(s.total_expense), 0);
    
    return {
      count: activeSwine.length,
      totalExpenses: totalExpensesOfActive
    };
  }, [filteredSwine]);

  // Filter expenses to only show those belonging to selected group
  const filteredExpenses = React.useMemo((): Expense[] => {
    if (!allExpenses) return [];
    
    if (selectedGroup) {
      return allExpenses.filter((expense: Expense) => expense.swine_group_id === selectedGroup);
    }
    
    return [];
  }, [allExpenses, selectedGroup]);

  // Summary calculations based on filtered expenses with safe number conversion
  const summary = React.useMemo(() => {
    const total = filteredExpenses?.reduce((sum: number, exp: Expense) => sum + safeNumber(exp.amount), 0) || 0;
    const deductedTotal = total - soldSwineStats.totalExpenses;
    
    const breakdownMap = filteredExpenses?.reduce((acc: Record<string, number>, exp: Expense) => {
      const category = exp.category;
      const amount = safeNumber(exp.amount);
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>) || {};
    
    const breakdown = Object.entries(breakdownMap).map(([category, amount]: [string, number]) => ({
      category,
      amount,
      percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : "0",
    }));
    
    const latest = filteredExpenses?.slice(0, 5) || [];
    
    return {
      total,
      deductedTotal: Math.max(0, deductedTotal),
      breakdown,
      latest,
    };
  }, [filteredExpenses, soldSwineStats.totalExpenses]);

  // Handle selected props from parent
  useEffect(() => {
    if (selected_group_id) {
      setSelectedGroup(Number(selected_group_id));
      setData("group_id", Number(selected_group_id));
    }

    if (selected_swine_ids?.length) {
      if (selectedGroup) {
        const group = groups.find((g: Group) => g.id === selectedGroup);
        const groupSwineIds = group?.swine.map((s: Swine) => s.id) || [];
        const validSwineIds = selected_swine_ids
          .map((id: string | number) => Number(id))
          .filter((id: number) => groupSwineIds.includes(id));
        setData("swine_ids", validSwineIds);
      }
    }
  }, [selected_group_id, selected_swine_ids, selectedGroup, groups]);

  // Handle selected expense for editing
  useEffect(() => {
    if (selected_expense) {
      const groupId = selected_expense.swine_group_id || null;
      setData({
        category: selected_expense.category,
        description: selected_expense.description,
        quantity: selected_expense.quantity,
        unit: selected_expense.unit,
        amount: String(safeNumber(selected_expense.amount)),
        date: selected_expense.date,
        swine_ids: selected_expense.swine_ids || [],
        group_id: groupId,
      });
      setSelectedGroup(groupId);
      setEditingExpenseId(selected_expense.id);
    }
  }, [selected_expense]);

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'available':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sold':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleGroupChange = (groupId: number | null): void => {
    setSelectedGroup(groupId);
    setData("group_id", groupId);
    // When group changes, automatically select all active swine (not sold)
    if (groupId) {
      const group = groups.find((g: Group) => g.id === groupId);
      if (group) {
        const activeSwineIds = group.swine
          .filter((s: Swine) => s.status?.toLowerCase() !== 'sold')
          .map((s: Swine) => s.id);
        setData("swine_ids", activeSwineIds);
        
        if (activeSwineIds.length < group.swine.length) {
          toast.info(`${group.swine.length - activeSwineIds.length} sold swine(s) were excluded from auto-selection.`);
        }
      }
    } else {
      setData("swine_ids", []);
    }
    
    console.log("Group changed to:", groupId);
  };

  const handleSubmit = (e: React.FormEvent): void => {
  e.preventDefault();
  
  // Ensure group_id is set before submitting
  const submitData = {
    ...data,
    group_id: selectedGroup,
  };
  
  console.log("Submitting with data:", submitData);
  console.log("Selected group:", selectedGroup);
  
  if (editingExpenseId) {
    put(route("expenses.update", editingExpenseId), {
      ...submitData,
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Expense updated successfully!");
        setEditingExpenseId(null);
        // Reset form but keep the group selected
        setData({
          category: "feed",
          description: "",
          quantity: "",
          unit: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          swine_ids: [],
          group_id: selectedGroup, // Keep the current group
        });
      },
      onError: (errors: any) => {
        toast.error("Failed to update expense.");
        console.error(errors);
      },
    });
  } else {
    post(route("expenses.store"), {
      ...submitData,
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Expense recorded successfully!");
        // Reset form but keep the group selected
        setData({
          category: "feed",
          description: "",
          quantity: "",
          unit: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          swine_ids: [], // Clear selected swine
          group_id: selectedGroup, // Keep the current group
        });
        
        // Optionally, auto-select all active swine again
        if (selectedGroup) {
          const group = groups.find((g: Group) => g.id === selectedGroup);
          if (group) {
            const activeSwineIds = group.swine
              .filter((s: Swine) => s.status?.toLowerCase() !== 'sold')
              .map((s: Swine) => s.id);
            setData("swine_ids", activeSwineIds);
          }
        }
      },
      onError: (errors: any) => {
        toast.error("Failed to save expense. Please check your input.");
        console.error(errors);
      },
    });
  }
};

  const clearForm = (): void => {
    reset();
    setSelectedGroup(null);
    setEditingExpenseId(null);
    setData("group_id", null);
    setData("swine_ids", []);
  };

  const handleDeleteExpense = (expenseId: number): void => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    axios
      .delete(route("expenses.destroy", expenseId))
      .then((res) => {
        if (res.data.success) {
          toast.success(res.data.message);
          window.location.reload();
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((error) => {
        console.error(error.response?.data || error);
        toast.error("Failed to delete expense.");
      });
  };

  const handleEditExpense = (exp: any): void => {
    const groupId = exp.swine_group_id || null;
    setData({
      category: exp.category,
      description: exp.description,
      quantity: exp.quantity,
      unit: exp.unit,
      amount: String(safeNumber(exp.amount)),
      date: exp.date,
      swine_ids: exp.swine_ids || [],
      group_id: groupId,
    });
    setSelectedGroup(groupId);
    setEditingExpenseId(exp.id);
    
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
    if (viewport) viewport.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedCount = data.swine_ids.length;

  return (
    <AppLayout>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-2">
        {/* LEFT SIDE: QUICK SUMMARY PANEL */}
        <div className="col-span-1 space-y-4">
          <Card className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
            <CardHeader className="text-lg font-bold text-green-700 dark:text-green-400">
              Quick Expense Summary
              {selectedGroup && (
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                  for {groups.find((g: Group) => g.id === selectedGroup)?.name}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Total Expenses
                </h3>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  ₱{formatCurrency(summary.total)}
                </p>
              </div>

              {soldSwineStats.count > 0 && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Deducted Total Expenses
                    </h3>
                    <p className="text-2xl font-bold text-green-700/70 dark:text-green-400">
                      ₱{formatCurrency(summary.deductedTotal)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (Total Expenses - ₱{formatCurrency(soldSwineStats.totalExpenses)} from sold swine)
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Latest Expenses
                </h3>
                <ul className="space-y-2 max-h-56 overflow-y-auto">
                  {summary.latest.length > 0 ? (
                    summary.latest.map((exp: Expense, idx: number) => (
                      <li
                        key={idx}
                        className="p-2 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
                        onClick={() => handleEditExpense(exp)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize font-semibold">{exp.category}</span>
                              <span className="text-green-700 dark:text-green-400 font-medium">
                                ₱{formatCurrency(exp.amount)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{exp.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                              {exp.quantity} {exp.unit} • {new Date(exp.date).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExpense(exp.id);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 font-bold text-sm"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No recent expenses
                    </div>
                  )}
                </ul>
              </div>

              {summary.breakdown.length > 0 ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Category Breakdown (%)
                    </h3>
                    <div
                      className={`grid ${
                        summary.breakdown.length > 4
                          ? "grid-cols-2 gap-x-6 gap-y-3"
                          : "grid-cols-1 gap-y-3"
                      }`}
                    >
                      {summary.breakdown.map((cat: any) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize text-gray-700 dark:text-gray-300">
                              {cat.category}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {cat.percentage}%
                            </span>
                          </div>
                          <Progress
                            value={parseFloat(cat.percentage)}
                            className="h-2 bg-gray-200 dark:bg-gray-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No expenses for this group yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: EXPENSE FORM */}
        <div className="col-span-2">
          <ScrollArea ref={scrollAreaRef} className="h-[100vh] pt-2 pb-1">
            <div className="">
              <Card>
                <CardHeader className="font-bold text-lg">
                  {editingExpenseId ? "Edit Expense" : "Add New Expense"}
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-4">
                        <Select
                          value={data.category}
                          onValueChange={(value) => setData("category", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="feed">Feed</SelectItem>
                            <SelectItem value="medicine">Medicine</SelectItem>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Description"
                          value={data.description}
                          onChange={(e) => setData("description", e.target.value)}
                          className="w-full"
                        />

                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Quantity"
                            value={data.quantity}
                            onChange={(e) => setData("quantity", e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="text"
                            placeholder="Unit"
                            value={data.unit}
                            onChange={(e) => setData("unit", e.target.value)}
                            className="flex-1"
                          />
                        </div>

                        <Input
                          type="number"
                          placeholder="Amount"
                          value={data.amount}
                          onChange={(e) => setData("amount", e.target.value)}
                          className="w-full"
                        />

                        <Input
                          type="date"
                          value={data.date}
                          onChange={(e) => setData("date", e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">
                            Batch/Group
                          </label>
                          <Select
                            value={selectedGroup ? String(selectedGroup) : "none"}
                            onValueChange={(value) =>
                              handleGroupChange(value === "none" ? null : parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- Select Group --</SelectItem>
                              {groups?.map((g: Group) => (
                                <SelectItem key={g.id} value={String(g.id)}>
                                  {g.name} ({g.swine.length} swine)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedGroup && (
                          <>
                            <div className="flex justify-between items-center mb-2 mt-4">
                              <label className="block font-medium text-gray-800 dark:text-gray-200">
                                Swine in {groups.find((g: Group) => g.id === selectedGroup)?.name}
                              </label>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  Total: {filteredSwine.length} swine
                                </span>
                              </div>
                            </div>

                            <div className="ml-1 grid grid-cols-1 gap-3 max-h-64 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                              {filteredSwine.map((s: Swine) => {
                                const isSold = s.status?.toLowerCase() === 'sold';
                                return (
                                  <div
                                    key={s.id}
                                    className={`grid grid-cols-1 items-center gap-2 p-2 rounded-lg border ${
                                      isSold ? 'bg-gray-100 dark:bg-gray-800 opacity-75' : 'bg-white dark:bg-gray-800'
                                    } border-gray-300 dark:border-gray-700`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-col">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                          Tag: {s.tag_number}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                          Cost: ₱{formatCurrency(s.total_expense)}
                                        </div>
                                        {isSold && (
                                          <div className="text-xs text-green-600">
                                            Sold Amount: ₱{formatCurrency(s.final_amount)}
                                          </div>
                                        )}
                                      </div>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                                        {s.status || 'Unknown'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {filteredSwine.length === 0 && (
                                <div className="text-center text-gray-500 py-4">
                                  No swine in this group
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-500 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1">
                              {/* <div className="flex justify-between">
                                <span>Total Swine:</span>
                                <span className="font-semibold">{filteredSwine.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Active Swine:</span>
                                <span className="font-semibold text-green-600">{activeSwineStats.count}</span>
                              </div> */}
                              <div className="flex justify-between">
                                <span>Total Sold:</span>
                                <span className="font-semibold text-red-600">{soldSwineStats.count}</span>
                              </div>
                              {soldSwineStats.count > 0 && (
                                <>
                                  <Separator className="my-1" />
                                  <div className="flex justify-between">
                                    <span>Total Sold Amount:</span>
                                    <span className="font-semibold text-green-600/50">₱{formatCurrency(soldSwineStats.totalAmount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Expenses of Sold:</span>
                                    <span className="font-semibold text-red-600/50">₱{formatCurrency(soldSwineStats.totalExpenses)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Net from Sold:</span>
                                    <span className="font-semibold text-blue-600/50">₱{formatCurrency(soldSwineStats.totalAmount - soldSwineStats.totalExpenses)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Active Swine Expenses:</span>
                                    <span className="font-semibold text-orange-600">₱{formatCurrency(activeSwineStats.totalExpenses)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}

                        {!selectedGroup && (
                          <div className="text-center text-gray-500 py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            Please select a group/batch first to add expenses
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mt-6">
                      {editingExpenseId && (
                        <Button
                          type="button"
                          className="bg-gray-300 text-gray-800 hover:bg-gray-400 flex-1"
                          onClick={clearForm}
                        >
                          Cancel Editing
                        </Button>
                      )}

                      <Button
                        type="submit"
                        className="btn btn-primary flex-1"
                        disabled={processing || !selectedGroup}
                      >
                        {processing
                          ? editingExpenseId
                            ? "Updating..."
                            : "Saving..."
                          : editingExpenseId
                          ? "Update Expense"
                          : "Add Expense"}
                      </Button>
                    </div>
                    {!selectedGroup && (
                      <p className="text-sm text-red-500 mt-2 text-center">
                        Please select a group/batch before adding an expense
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="font-bold text-lg">
                  Recent Expenses
                  {selectedGroup && (
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                      for {groups.find((g: Group) => g.id === selectedGroup)?.name}
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  {filteredExpenses.length > 0 ? (
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Category</th>
                          <th className="p-2 text-left">Amount</th>
                          <th className="p-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((exp: Expense) => (
                          <tr key={exp.id} className="border-b dark:border-gray-700">
                            <td className="p-2">{exp.date}</td>
                            <td className="p-2 capitalize">{exp.category}</td>
                            <td className="p-2">₱{formatCurrency(exp.amount)}</td>
                            <td className="p-2">{exp.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No expenses recorded for this group yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    </AppLayout>
  );
}
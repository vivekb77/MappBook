import React, { useState, useEffect } from 'react';
import { useReportContext } from '@/context/ReportContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface Order {
  purchase_date: string;
  product_name: string;
  item_price: number;
  currency: string;
}

interface ReportData {
  orders: Order[];
  [key: string]: any;
}

interface OrderStats {
  count: number;
  totals: { [key: string]: number };
}

interface ReportContextType {
  reportData: ReportData | null;
  setReportData: (data: ReportData) => void;
}

const OrderFilters: React.FC = () => {
  const { reportData, setReportData } = useReportContext() as ReportContextType;
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [originalData, setOriginalData] = useState<ReportData | null>(null);
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (reportData && !originalData) {
      setOriginalData(reportData);
    }
  }, [reportData]);

  // Rest of the existing functions...
  
  const getFilteredProducts = (): string[] => {
    if (!originalData?.orders) return [];

    let filteredOrders = [...originalData.orders];
    if (dateRange?.from && dateRange?.to) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.purchase_date);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }
    return filteredOrders.map(order => order.product_name).filter((value, index, self) => self.indexOf(value) === index);
  };

  const getFilteredOrdersStats = (): OrderStats => {
    if (!originalData?.orders) return { count: 0, totals: {} };

    let filteredOrders = [...originalData.orders];
    if (dateRange?.from && dateRange?.to) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.purchase_date);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    if (selectedProducts.length > 0) {
      filteredOrders = filteredOrders.filter(order => selectedProducts.includes(order.product_name));
    }

    const totals = filteredOrders.reduce((acc: { [key: string]: number }, order) => {
      const currency = order.currency || '?';
      acc[currency] = (acc[currency] || 0) + (order.item_price || 0);
      return acc;
    }, {});

    return {
      count: filteredOrders.length,
      totals: totals
    };
  };

  const uniqueProducts = getFilteredProducts();
  const orderStats = getFilteredOrdersStats();

  const filterData = (): void => {
    if (!originalData) return;

    let filteredOrders = [...originalData.orders];

    if (dateRange?.from && dateRange?.to) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.purchase_date);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    if (selectedProducts.length > 0) {
      filteredOrders = filteredOrders.filter(order => selectedProducts.includes(order.product_name));
    }

    setReportData({
      ...originalData,
      orders: filteredOrders
    });
  };

  useEffect(() => {
    filterData();
    const availableProducts = getFilteredProducts();
    setSelectedProducts(prev => prev.filter(p => availableProducts.includes(p)));
  }, [dateRange]);

  useEffect(() => {
    filterData();
  }, [selectedProducts]);

  const handleReset = (): void => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedProducts([]);
    if (originalData) {
      setReportData(originalData);
    }
  };

  const handleSelectAll = (): void => {
    setSelectedProducts(uniqueProducts);
  };

  const handleDeselectAll = (): void => {
    setSelectedProducts([]);
  };

  return (
    <>
      <div className={`absolute bottom-[7%] left-0 right-0 flex justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-[80%] bg-white shadow-lg rounded-lg p-6">
          {((dateRange?.from && dateRange?.to) || selectedProducts.length > 0) && (
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm font-medium text-gray-700">
                Total Orders: {orderStats.count}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {Object.entries(orderStats.totals).map(([currency, amount]) => {
                  const formattedAmount = currency !== '?'
                    ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency
                    }).format(amount)
                    : `${amount}`;

                  return (
                    <div key={currency} className="py-1">
                      {currency}: {formattedAmount}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range || undefined)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">Products</label>
              <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedProducts.length > 0 ? (
                      `${selectedProducts.length} selected`
                    ) : (
                      <span>Select products</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex justify-between pb-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAll}
                        className="text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {uniqueProducts.map((product) => (
                        <div key={product} className="flex items-center">
                          <input
                            type="checkbox"
                            id={product}
                            checked={selectedProducts.includes(product)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(p => p !== product));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor={product} className="ml-2 text-sm">
                            {product}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {((dateRange?.from && dateRange?.to) || selectedProducts.length > 0) && (
            <div className="mt-4 flex items-end">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute bottom-10 right-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
      >
        {isVisible ? <EyeOff className="h-7 w-7" /> : <Eye className="h-7 w-7" />}
      </button>
    </>
  );
};

export default OrderFilters;
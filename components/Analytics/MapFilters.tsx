import React, { useState, useEffect } from 'react';
import { useReportContext } from '@/context/ReportContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const MapFilters = () => {
  const { reportData, setReportData } = useReportContext();
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);

  useEffect(() => {
    if (reportData && !originalData) {
      setOriginalData(reportData);
    }
  }, [reportData]);

  const getFilteredProducts = () => {
    if (!originalData?.orders) return [];
    
    let filteredOrders = [...originalData.orders];
    if (dateRange.from && dateRange.to) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.purchase_date);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0,0,0,0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23,59,59,999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }
    return [...new Set(filteredOrders.map(order => order.product_name))];
  };

  const uniqueProducts = getFilteredProducts();

  const filterData = () => {
    if (!originalData) return;

    let filteredOrders = [...originalData.orders];

    if (dateRange.from && dateRange.to) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.purchase_date);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0,0,0,0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23,59,59,999);
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
    // Reset selected products if they're no longer available in the date range
    const availableProducts = getFilteredProducts();
    setSelectedProducts(prev => prev.filter(p => availableProducts.includes(p)));
  }, [dateRange]);

  useEffect(() => {
    filterData();
  }, [selectedProducts]);

  const handleReset = () => {
    setDateRange({ from: null, to: null });
    setSelectedProducts([]);
    if (originalData) {
      setReportData(originalData);
    }
  };

  return (
    <div className="absolute bottom-[10%] left-0 right-0 flex justify-center">
      <div className="w-[80%] bg-white shadow-lg rounded-lg p-6">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-gray-700">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
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
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={setDateRange}
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
                  <div className="grid gap-2">
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

        {((dateRange.from && dateRange.to) || selectedProducts.length > 0) && (
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
  );
};

export default MapFilters;
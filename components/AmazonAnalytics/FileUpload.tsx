import React, { useState } from 'react';
import { Loader2, Upload, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useMappbookUser } from '@/context/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderData {
  amazon_order_id: string;
  merchant_order_id: string;
  purchase_date: string;
  last_updated_date: string;
  order_status: string;
  fulfillment_channel: string;
  sales_channel: string;
  order_channel: string;
  ship_service_level: string;
  product_name: string;
  sku: string;
  asin: string;
  item_status: string;
  quantity: number;
  currency: string;
  item_price: number;
  item_tax: number;
  shipping_price: number;
  shipping_tax: number;
  gift_wrap_price: number;
  gift_wrap_tax: number;
  item_promotion_discount: number;
  ship_promotion_discount: number;
  ship_city: string;
  ship_state: string;
  ship_postal_code: string;
  ship_country: string;
  promotion_ids: string;
  is_business_order: boolean;
  purchase_order_number: string;
  price_designation: string;
}

interface ProcessedData {
  orders: OrderData[];
  metadata: {
    total_orders: number;
    unique_locations: number;
    processing_timestamp: string;
  };
}

interface GeocodingSummary {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

const FileUpload: React.FC = () => {
  const { mappbookUser } = useMappbookUser();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [geocodingSummary, setGeocodingSummary] = useState<GeocodingSummary | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [totalOrdersInReport, setTotalOrdersInReport] = useState(0);

  const processOrderData = (data: Record<string, string>[]): ProcessedData => {
    try {
      const orders = data.map((row, index) => {
        // Validate required fields
        if (!row['amazon-order-id']) {
          throw new Error(`Row ${index + 1}: Missing amazon-order-id`);
        }
        if (!row['ship-postal-code'] || !row['ship-country']) {
          throw new Error(`Row ${index + 1}: Missing shipping information`);
        }

        return {
          amazon_order_id: row['amazon-order-id'],
          merchant_order_id: row['merchant-order-id'] || '',
          purchase_date: row['purchase-date'] || '',
          last_updated_date: row['last-updated-date'] || '',
          order_status: row['order-status'] || '',
          fulfillment_channel: row['fulfillment-channel'] || '',
          sales_channel: row['sales-channel'] || '',
          order_channel: row['order-channel'] || '',
          ship_service_level: row['ship-service-level'] || '',
          product_name: row['product-name'] || '',
          sku: row['sku'] || '',
          asin: row['asin'] || '',
          item_status: row['item-status'] || '',
          quantity: parseInt(row['quantity']) || 0,
          currency: row['currency'] || '',
          item_price: parseFloat(row['item-price']) || 0,
          item_tax: parseFloat(row['item-tax']) || 0,
          shipping_price: parseFloat(row['shipping-price']) || 0,
          shipping_tax: parseFloat(row['shipping-tax']) || 0,
          gift_wrap_price: parseFloat(row['gift-wrap-price']) || 0,
          gift_wrap_tax: parseFloat(row['gift-wrap-tax']) || 0,
          item_promotion_discount: parseFloat(row['item-promotion-discount']) || 0,
          ship_promotion_discount: parseFloat(row['ship-promotion-discount']) || 0,
          ship_city: row['ship-city'] || '',
          ship_state: row['ship-state'] || '',
          ship_postal_code: row['ship-postal-code'] || '',
          ship_country: row['ship-country'] || '',
          promotion_ids: row['promotion-ids'] || '',
          is_business_order: typeof row['is-business-order'] === 'string' 
            ? row['is-business-order'].toLowerCase() === 'true'
            : Boolean(row['is-business-order']),
          purchase_order_number: row['purchase-order-number'] || '',
          price_designation: row['price-designation'] || ''
        };
      });

      return {
        orders,
        metadata: {
          total_orders: orders.length,
          unique_locations: new Set(orders.map(o => `${o.ship_postal_code}-${o.ship_country}`)).size,
          processing_timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error processing order data:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.csv', '.txt'];
    const fileExtension = file.name.toLowerCase().slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2);

    if (!allowedTypes.includes(`.${fileExtension}`)) {
      setError('Please upload only CSV or TXT files');
      return;
    }

    setIsUploading(true);
    setError('');
    setGeocodingSummary(null);
    setShowSummary(true);

    try {
      const text = await file.text();
      
      // Analyze the first few lines to detect the delimiter
      const sampleLines = text.split('\n').slice(0, 5);
      
      // Count occurrences of potential delimiters
      const delimiterCounts = {
        tab: sampleLines.every(line => line.includes('\t')),
        comma: sampleLines.every(line => line.includes(',')),
      };
      
      let delimiter = ','; // default
      if (delimiterCounts.tab && !delimiterCounts.comma) {
        delimiter = '\t';
      } else if (delimiterCounts.comma && !delimiterCounts.tab) {
        delimiter = ',';
      } else if (delimiterCounts.tab && delimiterCounts.comma) {
        // If both are present, prefer tab for Amazon reports
        delimiter = '\t';
      }
      
      // Clean up the header line to ensure proper tab delimitation
      const lines = text.split('\n');
      const fixedHeader = lines[0]
        .replace(/amazon-order-id merchant-order-id/, 'amazon-order-id\tmerchant-order-id')
        .replace(/\s+/g, '\t');
      const fixedText = [fixedHeader, ...lines.slice(1)].join('\n');

      Papa.parse<Record<string, string>>(fixedText, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter: delimiter,
        dynamicTyping: true,
        transformHeader: (header) => {
          const cleaned = header.trim().toLowerCase();
          return cleaned;
        },
        complete: async (results: Papa.ParseResult<Record<string, string>>) => {
          if (results.errors.length > 0) {
            
            const errorDetails = results.errors[0];
            let errorMessage = `Error parsing file: ${errorDetails.message} at row ${errorDetails.row}`;
            
            setError(errorMessage);
            setIsUploading(false);
            return;
          }

          if (results.data.length === 0) {
            setError('No data found in file');
            setIsUploading(false);
            return;
          }

          // Validate headers
          const requiredHeaders = ['amazon-order-id', 'ship-postal-code', 'ship-country'];
          const headers = Object.keys(results.data[0]);
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            setError(`Missing required columns: ${missingHeaders.join(', ')}`);
            setIsUploading(false);
            return;
          }

          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', mappbookUser?.mappbook_user_id || '');

            // Upload raw file
            await fetch('/api/amazon-upload-raw', {
              method: 'POST',
              body: formData
            });

            const processedData = processOrderData(results.data);
            setTotalOrdersInReport(processedData.metadata.total_orders);

            const response = await fetch('/api/amazon-upload-orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                mappbook_user_id: mappbookUser?.mappbook_user_id,
                report_date: new Date().toISOString(),
                order_data: processedData
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to upload data');
            }

            const result = await response.json();
            setGeocodingSummary(result.geocoding_summary);

            event.target.value = '';
            setIsUploading(false);
            const event1 = new CustomEvent('ReportAdded');
            window.dispatchEvent(event1);
          } catch (error) {
            console.error('Processing error:', error);
            setError(error instanceof Error ? error.message : 'Failed to process data');
            setIsUploading(false);
          }
        },
        error: (error: Error, file?: Papa.LocalFile) => {
          console.error('Parse error:', error);
          setError(`Error parsing file: ${error.message}`);
          setIsUploading(false);
        }
      });
    } catch (error) {
      console.error('File reading error:', error);
      setError('Error reading file');
      setIsUploading(false);
    }
  };

  // ... rest of the component (renderGeocodingSummary and return statement) remains the same

  const renderGeocodingSummary = () => {
    if (!geocodingSummary || !showSummary) return null;

    const { total, successful, failed } = geocodingSummary;
    const successRate = totalOrdersInReport > 0 ? Math.round((successful / totalOrdersInReport) * 100) : 0;

    return (
      <div className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                Geocoding Results
              {failed === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              </div>
              <button 
                onClick={() => setShowSummary(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold">{totalOrdersInReport}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Successfully Geocoded</p>
                <p className="text-2xl font-semibold text-green-500">{successful}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-semibold text-red-500">{failed}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <p className="text-sm text-center mt-1 text-gray-500">
                {successRate}% Success Rate
              </p>
            </div>
          </CardContent>
        </Card>

        { failed > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="mt-2">
                <p className="font-semibold mb-2">Some orders could not be geocoded because their postal codes were not found in our database.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4">
      <label
        htmlFor="file-upload"
        className="flex items-center justify-center px-4 py-2 border border-gray-700 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
      >
        <input
          id="file-upload"
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        {isUploading ? (
          <Loader2 className="w-5 h-5 mr-2 text-blue-500 animate-spin" />
        ) : (
          <Upload className="w-5 h-5 mr-2 text-blue-500" />
        )}
        <span className="text-sm text-gray-200">
          {isUploading ? 'Processing...' : 'Upload Order Report'}
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
      {renderGeocodingSummary()}
    </div>
  );
};

export default FileUpload;
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
// import { useToast } from '@/components/ui/use-toast';
import { useMappbookUser } from '@/context/UserContext';

const FileUpload = () => {
  // const { toast } = useToast();
  const { mappbookUser } = useMappbookUser();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const processOrderData = (data) => {
    const orders = data.map(row => ({
      amazon_order_id: row['amazon-order-id'],
      merchant_order_id: row['merchant-order-id'],
      purchase_date: row['purchase-date'],
      order_status: row['order-status'],
      fulfillment_channel: row['fulfillment-channel'],
      sales_channel: row['sales-channel'],
      order_channel: row['order-channel'],
      ship_service_level: row['ship-service-level'],
      product_name: row['product-name'],
      sku: row['sku'],
      asin: row['asin'],
      item_status: row['item-status'],
      quantity: parseInt(row['quantity']) || 0,
      currency: row['currency'],
      item_price: parseFloat(row['item-price']) || 0,
      item_tax: parseFloat(row['item-tax']) || 0,
      shipping_price: parseFloat(row['shipping-price']) || 0,
      shipping_tax: parseFloat(row['shipping-tax']) || 0,
      ship_city: row['ship-city'],
      ship_state: row['ship-state'],
      ship_postal_code: row['ship-postal-code'],
      ship_country: row['ship-country'],
      ship_from_postal_code: row['actual-ship-from-address-postal-code'],
      ship_from_country: row['actual-ship-from-address-country']
    }));

    return {
      orders,
      metadata: {
        total_orders: orders.length,
        unique_locations: new Set(orders.map(o => `${o.ship_postal_code}-${o.ship_country}`)).size,
        processing_timestamp: new Date().toISOString()
      }
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['.csv', '.txt'];
    const fileExtension = file.name.toLowerCase().slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2);

    if (!allowedTypes.includes(`.${fileExtension}`)) {
      setError('Please upload only CSV or TXT files');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            setError('Error parsing file');
            setIsUploading(false);
            return;
          }

          const processedData = processOrderData(results.data);

          try {
            const response = await fetch('/api/upload-orders', {
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

            event.target.value = '';
            setIsUploading(false);
            const event1 = new CustomEvent('ReportAdded');
            window.dispatchEvent(event1);
            // toast({
            //   title: "Success!",
            //   description: "Your order report has been uploaded and processed.",
            // });
          } catch (error) {
            setError('Failed to upload data');
            setIsUploading(false);
          }
        },
        error: (error) => {
          setError('Error parsing file');
          setIsUploading(false);
        }
      });
    } catch (error) {
      setError('Error reading file');
      setIsUploading(false);
    }
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
        />
        <Upload className="w-5 h-5 mr-2 text-blue-500" />
        <span className="text-sm text-gray-200">
          {isUploading ? 'Uploading...' : 'Upload Order Report'}
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
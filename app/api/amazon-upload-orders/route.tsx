import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/components/utils/supabase-admin";
import _ from 'lodash';

const supabase = getSupabaseAdmin();
const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 1000;
const MAX_RETRIES = 1;

interface Order {
  ship_postal_code: string;
  ship_country: string;
  shipped_to_latitude?: number | null;
  shipped_to_longitude?: number | null;
  [key: string]: any;
}

interface GeocodingError {
  postal_code: string;
  country: string;
  error: string;
  retryCount: number;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const { report_date, order_data, mappbook_user_id }: {
      report_date: string;
      order_data: { orders: Order[] };
      mappbook_user_id: string;
    } = await request.json();
    const API_KEY = process.env.POSITIONSTACK_API_KEY;
    const total_order_came_in_report = order_data.orders.length
    let successfulGeocodes = 0;
    let failedOrders: Order[] = [];
    const errors: GeocodingError[] = [];

    const geocodeOrder = async (order: Order, retryCount = 0): Promise<Order> => {
      try {
        // const query = encodeURIComponent(`${order.ship_postal_code}&country=${order.ship_country}`);
        const response = await fetch(
          `http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${order.ship_postal_code}&country=${order.ship_country}`
        );
        if (response.status === 429) {
          if (retryCount < MAX_RETRIES) {
            await delay(RATE_LIMIT_DELAY * Math.pow(2, retryCount));
            return geocodeOrder(order, retryCount + 1);
          }
          throw new Error('Rate limit exceeded');
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const geoData = await response.json();

        if (geoData.error) {
          throw new Error(geoData.error.message || 'API Error');
        }

        const location = geoData.data?.[0];

        if (location?.latitude && location?.longitude && location.confidence === 1) {
          successfulGeocodes++;
          return {
            ...order,
            shipped_to_latitude: location.latitude,
            shipped_to_longitude: location.longitude,
          };
        }

        throw new Error('No coordinates found');

      } catch (error) {
        // console.error('Whyy man whyy: ', error);
        if (retryCount < MAX_RETRIES) {
          await delay(RATE_LIMIT_DELAY * Math.pow(2, retryCount));
          return geocodeOrder(order, retryCount + 1);
        }

        errors.push({
          postal_code: order.ship_postal_code,
          country: order.ship_country,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount
        });

        failedOrders.push(order);
        return { ...order, shipped_to_latitude: null, shipped_to_longitude: null };
      }
    };

    const processOrderBatch = async (orders: Order[]): Promise<Order[]> => {
      const validOrders = orders.filter(order => order.ship_postal_code && order.ship_country);
      const invalidOrders = orders.filter(order => !order.ship_postal_code || !order.ship_country);

      invalidOrders.forEach(order => {
        errors.push({
          postal_code: order.ship_postal_code || '',
          country: order.ship_country || '',
          error: 'Missing postal code or country',
          retryCount: 0
        });
      });

      const results = await Promise.all(
        validOrders.map(order => geocodeOrder(order))
      );
      await delay(RATE_LIMIT_DELAY);
      return [...results, ...invalidOrders.map(order => ({ ...order, shipped_to_latitude: null, shipped_to_longitude: null }))];
    };

    const batches = _.chunk(order_data.orders, BATCH_SIZE);
    const ordersWithCoordinates = [];

    for (const batch of batches) {
      const batchResults = await processOrderBatch(batch);
      ordersWithCoordinates.push(...batchResults);
    }

    // Retry failed orders once more with increased delay
    if (failedOrders.length > 0) {
      await delay(RATE_LIMIT_DELAY * 2);
      const retriedResults = await processOrderBatch(failedOrders);

      // Replace failed orders with retried results
      ordersWithCoordinates.forEach((order, index) => {
        if (!order.shipped_to_latitude && !order.shipped_to_longitude) {
          const retriedOrder = retriedResults.find(
            r => r.ship_postal_code === order.ship_postal_code &&
              r.ship_country === order.ship_country
          );
          if (retriedOrder?.shipped_to_latitude) {
            ordersWithCoordinates[index] = retriedOrder;
          }
        }
      });
    }

    order_data.orders = ordersWithCoordinates.filter(order =>
      order.shipped_to_latitude !== null &&
      order.shipped_to_longitude !== null
    );

    const { data: insertedData, error } = await supabase
      .from('Amazon_Order_Analytics')
      .insert([{
        mappbook_user_id,
        report_date,
        order_data,
        total_orders_in_report: total_order_came_in_report,
        total_orders_processed_from_report: successfulGeocodes,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return NextResponse.json({
      geocoding_summary: {
        total: total_order_came_in_report,
        successful: successfulGeocodes,
        failed: errors.length / 2
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({
      error: 'Something went wrong',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
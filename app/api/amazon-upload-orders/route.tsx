import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/components/utils/supabase-admin";
import _ from 'lodash';

const supabase = getSupabaseAdmin();
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
}
export async function POST(request: Request) {
    try {
      const { report_date, order_data, mappbook_user_id } = await request.json();
      const API_KEY = process.env.POSITIONSTACK_API_KEY;
  
      // Geocode each order's location
      let successfulGeocodes = 0;
      const errors: GeocodingError[] = [];
      
      const geocodeOrder = async (order: Order, retryCount = 0): Promise<Order> => {
        try {
          const query = `${order.ship_postal_code},${order.ship_country}`;
          const response = await fetch(
            `http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${query}`
          );
          const geoData = await response.json();
          const location = geoData.data?.[0];
          
          if (location?.latitude && location?.longitude) {
            successfulGeocodes++;
            return {
              ...order,
              shipped_to_latitude: location.latitude,
              shipped_to_longitude: location.longitude,
            };
          } else if (retryCount < 1) {
            return geocodeOrder(order, retryCount + 1);
          } else {
            errors.push({
              postal_code: order.ship_postal_code,
              country: order.ship_country,
              error: 'No coordinates found after retry'
            });
            return { ...order, shipped_to_latitude: null, shipped_to_longitude: null };
          }
        } catch (error) {
          if (retryCount < 1) {
            return geocodeOrder(order, retryCount + 1);
          }
          errors.push({
            postal_code: order.ship_postal_code,
            country: order.ship_country,
            error: `Failed after retry: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
          return { ...order, shipped_to_latitude: null, shipped_to_longitude: null };
        }
      };
      
      const ordersWithCoordinates = await Promise.all(
        order_data.orders.map((order: Order) => geocodeOrder(order))
      );
      
      // console.log(`Geocoding results:
      // Success: ${successfulGeocodes}/${order_data.orders.length}
      // Errors: ${errors.length}
      // Error details:`, errors);
      
      order_data.orders = ordersWithCoordinates;
  
      const { data: insertedData, error } = await supabase
        .from('Amazon_Order_Analytics')
        .insert([{
          mappbook_user_id,
          report_date,
          order_data,
          total_orders_in_report:order_data.orders.length,
          total_orders_processed_from_report:successfulGeocodes
        }])
        .select()
        .single();
  
      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Failed to insert data' }, { status: 500 });
      }
  
      return NextResponse.json(insertedData);
    } catch (error) {
      console.error('Server error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
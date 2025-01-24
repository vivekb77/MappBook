import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/components/utils/supabase-admin";
import _ from 'lodash';

const supabase = getSupabaseAdmin();

export async function POST(request: Request) {
    try {
      const { report_date, order_data, mappbook_user_id } = await request.json();
      const API_KEY = process.env.POSITIONSTACK_API_KEY;
  
      // Geocode each order's location
      const ordersWithCoordinates = await Promise.all(order_data.orders.map(async (order: { ship_postal_code: any; ship_country: any; }) => {
        try {
          const query = `${order.ship_postal_code},${order.ship_country}`;
          const response = await fetch(
            `http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${query}`
          );
          const geoData = await response.json();
          const location = geoData.data[0];
          
          return {
            ...order,
            shipped_to_latitude: location?.latitude || null,
            shipped_to_longitude: location?.longitude || null,
          };
        } catch (error) {
          return { ...order, shipped_to_latitude: null, shipped_to_longitude: null };
        }
      }));
  
      order_data.orders = ordersWithCoordinates;
  
      const { data: insertedData, error } = await supabase
        .from('Order_Analytics')
        .insert([{
          mappbook_user_id,
          report_date,
          order_data,
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
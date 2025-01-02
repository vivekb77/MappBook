"use client"
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/components/utils/supabase";

const MapboxMap = dynamic(() => import('@/components/Render/RenderMapBoxMap'));
interface RenderParams {
  id: string;
}
export default function Render() {


  type RenderParams = {
    [key: string]: string;
    id: string;
  }
  const params = useParams<RenderParams>();
  const drone_footage_id = params?.id ?? null;

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const fetchFootageData = async () => {
      if (!drone_footage_id) {
        setDataError('No footage ID provided');
        setDataLoading(false);
        return;
      }

      // UUID validation using regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(drone_footage_id)) {
        setDataError('Invalid footage ID format');
        setDataLoading(false);
        return;
      }


      try {
        const { data, error } = await supabase
          .from('Drone_Footage')
          .select('*')
          .eq('drone_footage_id', drone_footage_id)
          .eq('is_deleted', false)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Footage not found');

        if (!data.points_coordinates_data || !Array.isArray(data.points_coordinates_data) || data.points_coordinates_data.length === 0) {
          throw new Error('Invalid footage data: Missing or invalid points');
        }

        setPoints(data.points_coordinates_data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Footage not found';
        setDataError(errorMessage);
        console.error('Error fetching footage:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchFootageData();
  }, [drone_footage_id]);

  return (
    <div className="fixed inset-0 h-screen-dynamic overflow-hidden">

      {dataError && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100"
          style={{
            backgroundImage: "url(/drone/renderpagebackground.png)",
          }}
        />
      )}
      {/* Content Layer */}
      <div className="relative z-10 flex h-full w-full">
        {dataLoading ? (
          <div className="w-full flex items-center justify-center bg-gray-900/80">
            <div className="bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-gray-700" />
                <div
                  className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-blue-500"
                  style={{ animationDirection: 'reverse' }}
                />
              </div>
              <span className="text-lg font-medium text-gray-300">
                Loading 🌎
              </span>
            </div>
          </div>
        ) : dataError ? (

          <div className="w-full flex items-center justify-center bg-gray-900/80">
            <Alert variant="destructive" className="max-w-md">
              <AlertDescription>{dataError}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex-1 h-full w-full md:w-[70%] touch-none">
            <MapboxMap initialPoints={points} />
          </div>
        )}
      </div>
    </div>
  );
}
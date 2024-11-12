import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.mapbox.com/search/searchbox/v1/suggest";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const searchText = searchParams.get('q');
        const sessionToken = searchParams.get('session_token');

        // Validate required parameters
        if (!searchText || !sessionToken) {
            return NextResponse.json(
                { error: 'Missing required parameters on mapbox search' },
                { status: 400 }
            );
        }

        // Validate access token
        if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_SEARCH_RETRIEVE) {
            return NextResponse.json(
                { error: 'Mapbox access token not configured for mapbox search' },
                { status: 500 }
            );
        }

        const res = await fetch(
            `${BASE_URL}?q=${encodeURIComponent(searchText)}&language=en&session_token=${sessionToken}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_SEARCH_RETRIEVE}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': request.headers.get('origin') || 'https://mappbook.com'
                },
                referrerPolicy: 'origin',
                cache: 'no-store' // Disable caching for fresh results
            }
        );

        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            console.error('Mapbox search API error:', errorData);
            return NextResponse.json(
                { error: 'Mapbox search API request failed' },
                { status: res.status }
            );
        }

        const searchResult = await res.json();
        return NextResponse.json(searchResult);

    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: 'Internal server error on mopbox search ' },
            { status: 500 }
        );
    }
}

// Add OPTIONS handler if needed for CORS
export async function OPTIONS(request: NextRequest) {
    return NextResponse.json(
        {},
        {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        }
    );
}
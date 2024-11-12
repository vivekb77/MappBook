import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.mapbox.com/search/searchbox/v1/suggest";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const searchText = searchParams.get('q');
        const sessionToken = searchParams.get('session_token');

        if (!searchText || !sessionToken) {
            return NextResponse.json(
                { error: 'Missing required parameters mapbox search' },
                { status: 400 }
            );
        }

        const customHeaders = new Headers({
            'Content-Type': 'application/json',
            'Origin': 'https://mappbook.com', 
            'Referer': 'https://mappbook.com' 
        });

        const res = await fetch(
            `${BASE_URL}?q=${encodeURIComponent(searchText)}&language=en&session_token=${sessionToken}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_SEARCH_RETRIEVE}`,
            {
                headers: customHeaders,
                cache: 'no-store'
            }
        );

        if (!res.ok) {
            console.error('Mapbox API error on search :', res.status);
            return NextResponse.json(
                { error: 'Mapbox API request failed on search ' },
                { status: res.status }
            );
        }

        const searchResult = await res.json();
        return NextResponse.json(searchResult);

    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: 'Internal server error on search' },
            { status: 500 }
        );
    }
}
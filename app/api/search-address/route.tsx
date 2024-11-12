import { NextResponse } from "next/server";
const BASE_URL="https://api.mapbox.com/search/searchbox/v1/suggest"
export async function GET(request:any) {

    const {searchParams}=new URL(request.url);

    const searchText=searchParams.get('q');
    const sessionToken = searchParams.get('session_token');

    const res = await fetch(
        `${BASE_URL}?q=${searchText}&language=en&session_token=${sessionToken}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_SEARCH_RETRIEVE}`
    );

    console.log("Search session token - " +sessionToken + "access token - " + process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_SEARCH_RETRIEVE);

    const searchResult=await res.json();
    return NextResponse.json(searchResult)
    
}
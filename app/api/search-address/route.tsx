import { NextResponse } from "next/server";
const BASE_URL="https://api.mapbox.com/search/searchbox/v1/suggest"
export async function GET(request:any) {

    const {searchParams}=new URL(request.url);

    const searchText=searchParams.get('q');
    const sessionToken = searchParams.get('session_token');

    const res = await fetch(
        `${BASE_URL}?q=${searchText}&language=en&session_token=${sessionToken}&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
    );

    console.log("Search text is" +searchText);

    const searchResult=await res.json();
    return NextResponse.json(searchResult)
    
}
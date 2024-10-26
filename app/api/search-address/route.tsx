import { NextResponse } from "next/server";
const BASE_URL="https://api.mapbox.com/search/searchbox/v1/suggest"
export async function GET(request:any) {

    const {searchParams}=new URL(request.url);

    const searchText=searchParams.get('q');

    const res=await fetch(`${BASE_URL}?q=${searchText}&language=en&session_token=03434be4-42ce-4221-892c-80281f70588a&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`)
   
    console.log("Search text is" +searchText);
    const searchResult=await res.json();
    return NextResponse.json(searchResult)
    
}
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import React, { useContext, useEffect, useState } from 'react'

const session_token = '5ccce4a4-ab0a-4a7c-943d-580e55542363' //generate dynamically later
const MAPBOX_RETRIVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve/'
function SearchPlace() {

    const [source, setSource] = useState<any>()
    const [sourceChange, setSourceChange] = useState<any>(false)
    const [selectedAddressName, setSelectedAddressName] = useState<any>([])
    const [selectedAddressFull, setSelectedAddressFull] = useState<any>([])
    const { searchedPlace, setSearchedPlaceDetails } = useContext(SearchedPlaceDetailsContext);
    const [addressList, setAddressList] = useState<any>([]);



    //dont send request after every key press
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            getAddressList()
        }, 1000)
        return () => clearTimeout(delayDebounceFn)
    }, [source]);




    // call mapbox /search endpoint to get list of addresses by search term
    const getAddressList = async () => {
        setAddressList([]);
        const query = source;
        const res = await fetch('/api/search-address?q=' + query, {
            headers: {
                "Content-Type": "application/json",
            }
        });

        const result = await res.json();
        setAddressList(result)

    }

    //call retrieve endpoint to get details of the address selected by user

    const onSearchedAddressClick = async (item: any) => {
      
      //displays the address on UI
      setSelectedAddressName(item.name);
      setSelectedAddressFull(item.full_address);
      
        setAddressList([]);
        setSourceChange(false)

        const res = await fetch(MAPBOX_RETRIVE_URL + item.mapbox_id
            + "?session_token=" + session_token
            + "&access_token=" + process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)

        const result = await res.json();

        setSearchedPlaceDetails({
            longitude: result.features[0].geometry.coordinates[0],
            latitude: result.features[0].geometry.coordinates[1],
            mapboxId: result.features[0].properties.mapbox_id,
            name: result.features[0].properties.name,
            address: result.features[0].properties.full_address,
            country: result.features[0].properties.context.country.name,
            countryCode: result.features[0].properties.context.country.country_code,
            language: result.features[0].properties.language,
            poiCategory: result.features[0].properties.poi_category,
            maki: result.features[0].properties.maki,
        })

        //clear the search field
        setSource('');

    }

    return (
        <div className="">
          <div className="relative w-full max-w-md">

            {/* Search Input */}
            <input 
              type="text"
              id="searchField"
              className="bg-white border border-gray-300 rounded-md w-full p-3 text-[18px] text-gray-700 placeholder-gray-400 shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition-colors duration-200"
              placeholder="Search for a place..."
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setSourceChange(true);
              }}
            />
      
            {/* Selected Address Labels */}
            <div className="flex flex-col mt-3">
              <label className="text-gray-900 text-lg font-semibold" id="addressNameLabel">
                {selectedAddressName}
              </label>
              <label className="text-gray-600 text-sm" id="addressFullLabel">
                {selectedAddressFull}
              </label>
            </div>
      
            {/* Suggestions Dropdown */}
            {addressList?.suggestions && sourceChange ? (
              <div className="shadow-lg mt-2 rounded-md absolute w-full bg-white z-20 border border-gray-200">
                {addressList.suggestions.map((item: any, index: number) => (
                  <div 
                    key={index}
                    className="p-3 hover:bg-green-100 cursor-pointer rounded-md transition-colors duration-200"
                    onClick={() => { onSearchedAddressClick(item) }}
                  >
                    <h2 className="text-gray-800 text-md font-medium">
                      {item.name}
                    </h2>
                    <h4 className="text-gray-500 text-sm mt-1">
                      {item.full_address}
                    </h4>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
      
}

export default SearchPlace
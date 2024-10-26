import React from 'react'
import AutocompleteAddress from './AutocompleteAddress'




function SearchPlace() {
    // const screenHight=window.innerHeight*0.72;

  return (
    <div className="p-5 max-w-md mx-auto bg-gray-50 rounded-lg shadow-md">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
        Search and Add a Place
      </h2>
      
      {/* Main Container */}
      <div className="border border-gray-300 bg-white p-6 rounded-lg shadow-sm">
        
        {/* Autocomplete Address */}
        <AutocompleteAddress />
        
        {/* Add Place Button */}
        <button 
          className="bg-red-500 hover:bg-red-600 text-white w-full py-3 mt-4 rounded-md font-semibold text-lg 
                     shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Add Place to Map
        </button>
        
      </div> 
    </div>
  );
  
}

export default SearchPlace
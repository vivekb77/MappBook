'use client';

import React, { useState } from 'react';
import PollEditorPopup from './PollEditorPopup';

// Define types for better type safety
interface PollQuestion {
  text: string;
  options: string[];
}

interface PollData {
  name: string;
  description: string;
  author: string;
  pollLength: string;
  questions: PollQuestion[];
  url?: string;
}

const PollCreator: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [expandedPollIndex, setExpandedPollIndex] = useState<number | null>(null);
  const [isMyPollsExpanded, setIsMyPollsExpanded] = useState(false);
  
  // In a real implementation, these would come from a Supabase query
  // This is just placeholder data for the UI layout
  const myPolls: PollData[] = [];
  
  const handleCreatePoll = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleSavePoll = async (newData: PollData, generateUrl: boolean) => {
    if (generateUrl) {
      try {
        // This would be replaced with a real Supabase API call
        // Example (to implement later):
        // const { data, error } = await supabaseClient
        //   .from('polls')
        //   .insert([{
        //     name: newData.name,
        //     description: newData.description,
        //     author: newData.author,
        //     pollLength: newData.pollLength,
        //     questions: newData.questions,
        //     userId: auth.user.id // The current user's ID
        //   }])
        //   .select()
        
        // After saving to Supabase, we would get back the record with its ID
        // Then we could construct and copy the URL
        // const pollUrl = `https://mappbook.com/polls/${data[0].id}`;
        
        // For now, just simulate success:
        const pollId = Math.random().toString(36).substring(2, 15);
        const pollUrl = `https://mappbook.com/polls/${pollId}`;
        
        // Copy the URL to clipboard
        navigator.clipboard.writeText(pollUrl)
          .then(() => {
            alert('Poll created successfully! URL copied to clipboard.');
          })
          .catch((err) => {
            console.error('Could not copy URL: ', err);
            alert('Poll created successfully! You can find it in My Polls.');
          });
        
        // In a real app, you would reload polls from Supabase here
        // Example: fetchUserPolls();
        
        // Open the My Polls section
        setIsMyPollsExpanded(true);
        
      } catch (error) {
        console.error('Error saving poll:', error);
        alert('There was an error saving your poll. Please try again.');
        return;
      }
    }
    
    setShowPopup(false);
  };

  const copyPollUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('Poll URL copied to clipboard!');
      })
      .catch((err) => {
        console.error('Could not copy URL: ', err);
      });
  };

  const togglePollDetails = (index: number) => {
    setExpandedPollIndex(expandedPollIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          onClick={handleCreatePoll}
        >
          Create New Poll
        </button>
        <h2 className="text-2xl font-bold text-gray-100">Poll Dashboard</h2>
      </div>
      
      {/* My Polls Section */}
      <div className="mt-8">
        <button
          type="button"
          className="flex justify-between items-center w-full bg-gray-700 hover:bg-gray-600 text-left text-gray-100 font-semibold py-3 px-4 rounded-lg"
          onClick={() => setIsMyPollsExpanded(!isMyPollsExpanded)}
        >
          <span>My Polls ({myPolls.length})</span>
          <span>{isMyPollsExpanded ? '▼' : '►'}</span>
        </button>
        
        {isMyPollsExpanded && (
          <div className="mt-4 space-y-3">
            {myPolls.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No polls created yet</p>
            ) : (
              myPolls.map((poll, index) => (
                <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-600"
                    onClick={() => togglePollDetails(index)}
                  >
                    <div>
                      <h3 className="text-gray-100 font-medium">{poll.name}</h3>
                      <p className="text-gray-400 text-sm">Created by: {poll.author}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPollUrl(poll.url || '');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                      >
                        Copy URL
                      </button>
                      <span>{expandedPollIndex === index ? '▼' : '►'}</span>
                    </div>
                  </div>
                  
                  {expandedPollIndex === index && (
                    <div className="border-t border-gray-600 p-4 bg-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-300"><span className="font-medium">Poll Duration:</span> {poll.pollLength} days</p>
                          {poll.description && (
                            <p className="text-gray-300 mt-2"><span className="font-medium">Description:</span> {poll.description}</p>
                          )}
                        </div>
                        {poll.url && (
                          <div>
                            <p className="text-gray-300 font-medium mb-1">Share URL:</p>
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={poll.url} 
                                readOnly
                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-gray-200 font-medium mb-2">Questions:</h4>
                        <div className="space-y-2">
                          {poll.questions.map((question, qIndex) => (
                            <div key={qIndex} className="bg-gray-700 p-3 rounded">
                              <p className="text-gray-300 mb-1">
                                <span className="font-medium">Q{qIndex + 1}:</span> {question.text}
                              </p>
                              <div className="pl-4">
                                {question.options.filter(opt => opt.trim()).map((option, oIndex) => (
                                  <p key={oIndex} className="text-gray-400 text-sm">
                                    {oIndex + 1}. {option}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showPopup && (
        <PollEditorPopup
          onClose={handleClosePopup}
          onSave={handleSavePoll}
        />
      )}
    </div>
  );
};

export default PollCreator;
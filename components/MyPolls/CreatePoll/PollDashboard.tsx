import React, { useState, useEffect } from 'react';
import PollCreatorPopup from './PollCreatorPopup';
import { useMappbookUser } from '@/context/UserContext';
import { useUser } from '@clerk/nextjs';
import LoadingIndicator from '../PageLoadingAnimation';
import { ToastMessage } from '../ToastMessage';

// Define types for better type safety
interface PollQuestion {
  text: string;
  options: string[];
}

interface PollData {
  title: string;
  description: string;
  author: string;
  pollLength: string;
  questions: PollQuestion[];
  mappbook_user_id?: string;
  url?: string;
}

interface SavedPoll extends PollData {
  poll_id: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

const PollDashboard: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [expandedPollIndex, setExpandedPollIndex] = useState<number | null>(null);
  const [isMyPollsExpanded, setIsMyPollsExpanded] = useState(true);
  const [myPolls, setMyPolls] = useState<SavedPoll[]>([]);
  const [isDataLoading, setIsdataLoading] = useState(false);
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const { isLoaded, isSignedIn, user } = useUser();

  // Get the mappbook user
  const { mappbookUser } = useMappbookUser();
  const fetchPolls = async () => {
    if (!mappbookUser?.mappbook_user_id) return;

    setIsdataLoading(true);
    try {
      const response = await fetch(`/api/pull-polls?mappbook_user_id=${mappbookUser.mappbook_user_id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setMyPolls(result.data);
        }
      } else {
        console.error('Failed to fetch polls:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setIsdataLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [mappbookUser]);

  const handleCreatePoll = () => {
    if (!mappbookUser?.mappbook_user_id) {
      alert('Please sign in to create a poll');
      return;
    }
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleSavePoll = async (newData: PollData, generateUrl: boolean) => {
    // Close the popup first
    setShowPopup(false);

    if (generateUrl) {
      // Expand the My Polls section
      setIsMyPollsExpanded(true);

      // Refresh the polls list
      await fetchPolls();
    }
  };

  const copyPollUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast('Poll URL copied!', 'success');
      })
      .catch((err) => {
        console.error('Could not copy URL: ', err);
        showToast('Failed to copy URL', 'error');
      });
  };

  const togglePollDetails = (index: number) => {
    setExpandedPollIndex(expandedPollIndex === index ? null : index);
  };

  const handleToggleActive = async (pollId: string, newActiveState: boolean) => {
    try {
      const response = await fetch('/api/pull-polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poll_id: pollId,
          is_active: newActiveState,
        }),
      });

      if (response.ok) {
        // Update the local state to reflect the change immediately
        setMyPolls(prevPolls => 
          prevPolls.map(poll => 
            poll.poll_id === pollId ? { ...poll, is_active: newActiveState } : poll
          )
        );
        showToast(`Poll ${newActiveState ? 'activated' : 'deactivated'} successfully`, 'success');
      } else {
        console.error('Failed to update poll status');
        showToast('Failed to update poll status. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating poll status:', error);
      showToast('An error occurred while updating poll status.', 'error');
    }
  };

  const handleViewAnalytics = (pollId: string) => {
    setCurrentPollId(pollId);
    setShowAnalyticsPopup(true);
  };

  const handleCloseAnalytics = () => {
    setShowAnalyticsPopup(false);
    setCurrentPollId(null);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  // Function to format dates in a user-friendly way with AM/PM
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Function to correctly display singular or plural for days
  const formatDuration = (duration: string) => {
    const days = parseInt(duration, 10);
    return days === 1 ? '1 day' : `${days} days`;
  };

  // Global loading indicator
  if (!isLoaded) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto bg-gray-800 rounded-lg shadow-sm p-0 sm:p-0">
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg
            ${!mappbookUser?.mappbook_user_id ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleCreatePoll}
          disabled={!mappbookUser?.mappbook_user_id && !isSignedIn}
        >
          Create New Poll
        </button>
      </div>

      {isLoaded && !isSignedIn && !mappbookUser?.mappbook_user_id && (
        <div className="bg-yellow-800 text-yellow-200 p-4 rounded-lg mb-6">
          <p className="font-medium">Sign in required</p>
          <p>You need to sign in to create and manage polls.</p>
        </div>
      )}

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
            {isDataLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-300">Loading polls</span>
              </div>
            ) : myPolls.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No polls created yet</p>
            ) : (
              myPolls.map((poll, index) => (
                <div key={poll.poll_id} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-600"
                    onClick={() => togglePollDetails(index)}
                  >
                    <div>
                      <h3 className="text-gray-100 font-medium">{poll.title}</h3>
                      <p className="text-gray-400 text-sm">Created by: {poll.author}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{expandedPollIndex === index ? '▼' : '►'}</span>
                    </div>
                  </div>

                  {expandedPollIndex === index && (
                    <div className="border-t border-gray-600 p-4 bg-gray-800">
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded text-sm font-medium ${poll.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(poll.poll_id, !poll.is_active);
                          }}
                        >
                          {poll.is_active ? 'Set Inactive' : 'Set Active'}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPollUrl(poll.url || `${window.location.origin}/polls/${poll.poll_id}`);
                          }}
                        >
                          Copy URL
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalytics(poll.poll_id);
                          }}
                        >
                          View Analytics
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-300"><span className="font-medium">Poll Duration:</span> {formatDuration(poll.pollLength)}</p>
                          {poll.description && (
                            <p className="text-gray-300 mt-2"><span className="font-medium">Description:</span> {poll.description}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-300"><span className="font-medium">Created:</span> {formatDate(poll.created_at)}</p>
                          <p className="text-gray-300 mt-2"><span className="font-medium">Expires:</span> {formatDate(poll.expires_at)}</p>
                        </div>
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
        <PollCreatorPopup
          onClose={handleClosePopup}
          onSave={handleSavePoll}
        />
      )}

      {/* Analytics Popup */}
      {showAnalyticsPopup && currentPollId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Poll Analytics</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-white"
                onClick={handleCloseAnalytics}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 text-center">Analytics feature coming soon!</p>
              {/* Analytics content will be added here later */}
            </div>
          </div>
        </div>
      )}

      <ToastMessage
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
        duration={2000}
        type={toast.type}
      />
    </div>
  );
};

export default PollDashboard;
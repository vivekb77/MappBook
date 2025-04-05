import React, { useState, useEffect } from 'react';
import PollCreatorPopup from './PollCreatorPopup';
import { useMappbookUser } from '@/context/UserContext';
import { useUser } from '@clerk/nextjs';
import LoadingIndicator from '../PageLoadingAnimation';
import { ToastMessage } from '../ToastMessage';
import { PlusCircle, Copy, BarChart3, AlertTriangle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

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

interface PollDashboardProps {
  isDarkMode: boolean;
}

const PollDashboard: React.FC<PollDashboardProps> = ({ isDarkMode }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [expandedPollIndex, setExpandedPollIndex] = useState<number | null>(null);
  const [isMyPollsExpanded, setIsMyPollsExpanded] = useState(true);
  const [myPolls, setMyPolls] = useState<SavedPoll[]>([]);
  const [isDataLoading, setIsdataLoading] = useState(false);
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [loadingPollId, setLoadingPollId] = useState<string | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();

  // Get the mappbook user
  const { mappbookUser } = useMappbookUser();
  const fetchPolls = async () => {
    if (!mappbookUser?.mappbook_user_id) return;

    setIsdataLoading(true);
    try {
      const response = await fetch(`/api/polls/get-polls?mappbook_user_id=${mappbookUser.mappbook_user_id}`);
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
      showToast('Please sign in to create a poll', 'error');
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
    setLoadingPollId(pollId);
    try {
      const response = await fetch('/api/polls/update-poll', {
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
    } finally {
      setLoadingPollId(null);
    }
  };

  const handleViewAnalytics = (pollId: string) => {
    // Open the analytics link in a new tab
    window.open(`https://mappbook.com/polltics/${pollId}`, '_blank');
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
    return <LoadingIndicator isDarkMode={isDarkMode} />
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          className={`flex items-center gap-2 transition-all duration-300 rounded-lg shadow-sm
            ${isDarkMode 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-700/20' 
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
            }
            font-medium py-2.5 px-4
            ${!mappbookUser?.mappbook_user_id ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleCreatePoll}
          disabled={!mappbookUser?.mappbook_user_id && !isSignedIn}
        >
          <PlusCircle size={18} />
          <span>Create New Poll</span>
        </button>
      </div>

      {isLoaded && !isSignedIn && !mappbookUser?.mappbook_user_id && (
        <div className={`p-4 rounded-lg mb-6 flex items-start gap-3
          ${isDarkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 text-amber-800'}`}>
          <AlertTriangle size={20} className={isDarkMode ? 'text-amber-400' : 'text-amber-500'} />
          <div>
            <p className="font-medium">Sign in required</p>
            <p className={isDarkMode ? 'text-amber-300' : 'text-amber-700'}>You need to sign in to create and manage polls.</p>
          </div>
        </div>
      )}

      {/* My Polls Section */}
      <div className="mt-6">
        <button
          type="button"
          className={`flex justify-between items-center w-full text-left font-semibold py-3 px-4 rounded-lg transition-colors
            ${isDarkMode 
              ? 'bg-slate-800 hover:bg-slate-700 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          onClick={() => setIsMyPollsExpanded(!isMyPollsExpanded)}
        >
          <span>My Polls ({myPolls.length})</span>
          <span>{isMyPollsExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</span>
        </button>

        {isMyPollsExpanded && (
          <div className="mt-4 space-y-3">
            {isDataLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className={`w-6 h-6 border-2 rounded-full animate-spin
                  ${isDarkMode ? 'border-slate-600 border-t-indigo-400' : 'border-gray-300 border-t-indigo-600'}`}></div>
                <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading polls</span>
              </div>
            ) : myPolls.length === 0 ? (
              <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No polls created yet. Create your first poll to get started!
              </p>
            ) : (
              myPolls.map((poll, index) => (
                <div key={poll.poll_id} 
                  className={`rounded-lg overflow-hidden shadow-sm transition-shadow duration-300
                    ${isDarkMode 
                      ? poll.is_active
                          ? 'bg-gradient-to-r from-slate-800 to-slate-800/95 border-l-4 border-green-500 hover:shadow-md hover:shadow-green-900/10'
                          : 'bg-gradient-to-r from-slate-800 to-slate-800/95 border-l-4 border-red-500 hover:shadow-md hover:shadow-red-900/10'
                      : poll.is_active
                          ? 'bg-gradient-to-r from-white to-green-50 border-l-4 border-green-500 hover:shadow-md hover:shadow-green-300/20'
                          : 'bg-gradient-to-r from-white to-red-50 border-l-4 border-red-500 hover:shadow-md hover:shadow-red-300/20'
                    }`}
                >
                  <div
                    className={`flex justify-between items-center p-4 cursor-pointer transition-colors
                      ${isDarkMode 
                        ? poll.is_active ? 'hover:bg-slate-700/80' : 'hover:bg-slate-700/80' 
                        : poll.is_active ? 'hover:bg-green-50/80' : 'hover:bg-red-50/80'}`}
                    onClick={() => togglePollDetails(index)}
                  >
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{poll.title}</h3>
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} style={{fontSize: '0.875rem'}}>
                        Created by: {poll.author}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full
                        ${isDarkMode 
                          ? 'bg-slate-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-600'}`}>
                        {expandedPollIndex === index ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </div>
                  </div>

                  {expandedPollIndex === index && (
                    <div className={`p-4 ${isDarkMode 
                        ? 'border-t border-slate-700' 
                        : poll.is_active ? 'border-t border-green-100' : 'border-t border-red-100'}`}>
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5
                            ${poll.is_active 
                              ? (isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600')
                              : (isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600')} 
                            text-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (loadingPollId !== poll.poll_id) {
                              handleToggleActive(poll.poll_id, !poll.is_active);
                            }
                          }}
                          disabled={loadingPollId === poll.poll_id}
                        >
                          {loadingPollId === poll.poll_id ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            poll.is_active ? 'Set Inactive' : 'Set Active'
                          )}
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5
                            ${isDarkMode 
                              ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPollUrl(poll.url || ``);
                          }}
                        >
                          <Copy size={14} />
                          <span>Copy URL</span>
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5
                            ${isDarkMode 
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalytics(poll.poll_id);
                          }}
                        >
                          <BarChart3 size={14} />
                          <span>View Analytics</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <span className="font-medium">Poll Duration:</span> {formatDuration(poll.pollLength)}
                          </p>
                          {poll.description && (
                            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Description:</span> {poll.description}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <span className="font-medium">Created:</span> {formatDate(poll.created_at)}
                          </p>
                          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">Expires:</span> {formatDate(poll.expires_at)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Questions:</h4>
                        <div className="space-y-2">
                          {poll.questions.map((question, qIndex) => (
                            <div key={qIndex} className={`p-3 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                              <p className={`mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <span className="font-medium">Q{qIndex + 1}:</span> {question.text}
                              </p>
                              <div className="pl-4">
                                {question.options.filter(opt => opt.trim()).map((option, oIndex) => (
                                  <p key={oIndex} className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
          isDarkMode={isDarkMode}
        />
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
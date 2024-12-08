import { Check, Copy, Pencil, Share2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { useMappbookUser } from '@/context/UserContext';
import { useUser } from "@clerk/nextjs";
import { track } from '@vercel/analytics';
import { InfoIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Types and interfaces
interface MappbookUser {
    mappbook_user_id: string;
    display_name: string;
    map_style: string;
    country_fill_color: string;
}

interface ShareState {
    displayName: string | null;
    showLink: boolean;
    isEditing: boolean;
    nameInput: string;
    mapStyle: string;
    countryFillColor: string;
    asyncState: {
        isSaving: boolean;
        error: string | null;
    };
}

type ShareAction =
    | { type: 'SET_DISPLAY_NAME'; payload: string }
    | { type: 'TOGGLE_SHARE' }
    | { type: 'START_EDITING' }
    | { type: 'CANCEL_EDITING' }
    | { type: 'SET_NAME_INPUT'; payload: string }
    | { type: 'SET_MAP_STYLE'; payload: string }
    | { type: 'SET_COUNTRY_FILL_COLOR'; payload: string }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

// Configuration
const MAP_STYLES = [
    { id: 'satellite', imageSrc: '/mapstylesatellite.png', label: 'Satellite' },
    { id: 'light', imageSrc: '/mapstylelight.png', label: 'Light' },
    { id: 'dark', imageSrc: '/mapstyledark.png', label: 'Dark' },
] as const;

const COLOR_OPTIONS = [
    { rgba: 'rgba(168,85,247,255)', label: 'Purple' },
    { rgba: 'rgba(236,72,153,255)', label: 'Pink' },
    { rgba: 'rgba(239,68,68,255)', label: 'Orange' },
    { rgba: 'rgba(249,115,21,255)', label: 'Yellow' },
    { rgba: 'rgba(34,197,93,255)', label: 'Green' },
] as const;

const MAX_NAME_LENGTH = 25;

// Utility functions
const sanitizeInput = (input: string): string => {
    const sanitized = input
        .trim()
        .replace(/[<>&'"]/g, '')
        .slice(0, MAX_NAME_LENGTH);
    return sanitized;
};

// Sub-components
const NameEditor: React.FC<{
    displayName: string | null;
    isEditing: boolean;
    nameInput: string;
    isSaving: boolean;
    error: string | null;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onNameChange: (value: string) => void;
}> = ({
    displayName,
    isEditing,
    nameInput,
    isSaving,
    error,
    onEdit,
    onSave,
    onCancel,
    onNameChange,
}) => {
        if (!isEditing) {
            return (
                <div className="flex items-center justify-between">
                    <span className="text-gray-700">{displayName || 'MappBook User'}</span>
                    <button
                        onClick={onEdit}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Pencil className="w-5 h-5" />
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-2 max-w-full">
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter your MappBook name"
                        maxLength={MAX_NAME_LENGTH}
                        className="flex-1 min-w-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        autoFocus
                    />
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <span className="inline-block animate-spin">↻</span>
                            ) : (
                                <Check className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex justify-between text-xs">
                    <span className={error ? "text-red-500" : "text-gray-400"}>
                        {error || `${nameInput.length}/${MAX_NAME_LENGTH} characters`}
                    </span>
                </div>
            </div>
        );
    };

const StyleSelector: React.FC<{
    selectedStyle: string;
    onStyleSelect: (style: string) => void;
}> = React.memo(({ selectedStyle, onStyleSelect }) => (
    <div className="space-y-3">
        <div className="text-center text-xs font-medium text-purple-400">
            Choose mapp style to share
        </div>
        <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2 px-1">
            {MAP_STYLES.map((style) => (
                <button
                    key={style.id}
                    onClick={() => onStyleSelect(style.id)}
                    className={`
              relative flex-shrink-0 rounded-lg overflow-hidden
              aspect-square w-16 group transition-all duration-200
              ${selectedStyle === style.id
                            ? 'ring-2 ring-purple-500'
                            : 'hover:ring-2 hover:ring-gray-300'
                        }
            `}
                >
                    <img
                        src={style.imageSrc}
                        alt={style.label}
                        className="w-full h-full object-cover"
                    />
                    {selectedStyle === style.id && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 py-1">
                        <span className="text-xs text-white font-medium text-center block">
                            {style.label}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    </div>
));

StyleSelector.displayName = 'StyleSelector';

const ColorSelector: React.FC<{
    selectedColor: string;
    onColorSelect: (color: string) => void;
    isSaving: boolean;
}> = React.memo(({ selectedColor, onColorSelect, isSaving }) => (
    <div className="space-y-3">
        <div className="text-center text-xs font-medium text-purple-400">
            Choose a color for visited countries!
        </div>
        <div className="flex justify-center items-center gap-3">
            {COLOR_OPTIONS.map((colorOption) => (
                <button
                    key={colorOption.label}
                    onClick={() => onColorSelect(colorOption.rgba)}
                    disabled={isSaving}
                    className={`
              relative group 
              ${isSaving ? 'cursor-not-allowed opacity-50' : ''}
            `}
                    aria-label={`Select ${colorOption.label} color`}
                >
                    <div
                        className={`
                w-8 h-8 rounded-full 
                transition-all duration-200
                ${selectedColor === colorOption.rgba ? 'scale-110 ring-2 ring-purple-400' : 'hover:scale-105'}
              `}
                        style={{ backgroundColor: colorOption.rgba }}
                    />
                    {selectedColor === colorOption.rgba && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    </div>
));

ColorSelector.displayName = 'ColorSelector';

// Main component
const ShareSection: React.FC = () => {
    const supabase = getClerkSupabaseClient();
    const { isSignedIn } = useUser();
    const { mappbookUser, setMappbookUser } = useMappbookUser();
    const [copied, setCopied] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    // Use reducer for complex state management
    const [state, dispatch] = React.useReducer(
        (state: ShareState, action: ShareAction): ShareState => {
            switch (action.type) {
                case 'SET_DISPLAY_NAME':
                    return { ...state, displayName: action.payload };
                case 'TOGGLE_SHARE':
                    return { ...state, showLink: !state.showLink };
                case 'START_EDITING':
                    return {
                        ...state,
                        isEditing: true,
                        nameInput: state.displayName || '',
                    };
                case 'CANCEL_EDITING':
                    return {
                        ...state,
                        isEditing: false,
                        nameInput: '',
                        asyncState: { ...state.asyncState, error: null },
                    };
                case 'SET_NAME_INPUT':
                    return { ...state, nameInput: action.payload };
                case 'SET_MAP_STYLE':
                    return { ...state, mapStyle: action.payload };
                case 'SET_COUNTRY_FILL_COLOR':
                    return { ...state, countryFillColor: action.payload };
                case 'SET_SAVING':
                    return {
                        ...state,
                        asyncState: { ...state.asyncState, isSaving: action.payload },
                    };
                case 'SET_ERROR':
                    return {
                        ...state,
                        asyncState: { ...state.asyncState, error: action.payload },
                    };
                default:
                    return state;
            }
        },
        {
            displayName: mappbookUser?.display_name || null,
            showLink: false,
            isEditing: false,
            nameInput: '',
            mapStyle: mappbookUser?.map_style || 'satellite',
            countryFillColor: mappbookUser?.country_fill_color || COLOR_OPTIONS[0].rgba,
            asyncState: {
                isSaving: false,
                error: null,
            },
        }
    );

    // Initialize state from mappbookUser
    useEffect(() => {
        if (mappbookUser) {
            dispatch({ type: 'SET_MAP_STYLE', payload: mappbookUser.map_style });
            dispatch({
                type: 'SET_COUNTRY_FILL_COLOR',
                payload: mappbookUser.country_fill_color,
            });
            dispatch({ type: 'SET_DISPLAY_NAME', payload: mappbookUser.display_name });
        }
    }, [mappbookUser]);

    // Handlers
    const handleShare = () => {
        dispatch({ type: 'TOGGLE_SHARE' });
        if (!state.showLink) {
        }
    };

    const handleCopy = async () => {
        try {
            track('Create Map - URL copied to share');
            await navigator.clipboard.writeText(
                `https://mappbook.com/map/${mappbookUser?.mappbook_user_id}`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            track('RED - Create Map - URL copying failed');
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to copy link to clipboard',
            });
        }
    };

    const saveName = async () => {
        const sanitizedName = sanitizeInput(state.nameInput);

        if (!sanitizedName) {
            dispatch({ type: 'SET_ERROR', payload: 'Name cannot be empty' });
            return;
        }

        try {
            dispatch({ type: 'SET_SAVING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });

            const { error } = await supabase
                .from('MappBook_Users')
                .update({ display_name: sanitizedName })
                .eq('mappbook_user_id', mappbookUser?.mappbook_user_id)
                .single();

            if (error) throw error;

            dispatch({ type: 'SET_DISPLAY_NAME', payload: sanitizedName });
            dispatch({ type: 'CANCEL_EDITING' });
        } catch (err) {
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to save name. Please try again.',
            });
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    };

    const handleStyleSelect = async (style: string) => {
        try {
            dispatch({ type: 'SET_MAP_STYLE', payload: style });
            dispatch({ type: 'SET_SAVING', payload: true });

            const { error } = await supabase
                .from('MappBook_Users')
                .update({ map_style: style })
                .eq('mappbook_user_id', mappbookUser?.mappbook_user_id)
                .single();

            if (error) throw error;
        } catch (err) {
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to save style preference',
            });
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    };

    const handleColorSelect = async (colorRGBA: string) => {
        try {
            dispatch({ type: 'SET_COUNTRY_FILL_COLOR', payload: colorRGBA });
            dispatch({ type: 'SET_SAVING', payload: true });

            const { error } = await supabase
                .from('MappBook_Users')
                .update({ country_fill_color: colorRGBA })
                .eq('mappbook_user_id', mappbookUser?.mappbook_user_id)
                .single();

            if (error) throw error;
        } catch (err) {
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to save color preference',
            });
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    };

    // Render methods
    const renderShareButton = () => (
        <button
            onClick={handleShare}
            className="w-full py-3 px-4 rounded-xl font-medium
          bg-white/80 border border-pink-100 text-gray-700
          hover:bg-white hover:shadow-md transform transition-all duration-300
          flex items-center justify-center gap-2"
        >
            <Share2 className="w-5 h-5 text-purple-400" />
            <span>Share Your MappBook</span>
        </button>
    );

    const renderCopyButton = () => (
        <button
            onClick={handleCopy}
            className="w-full py-3 px-6 bg-purple-500 hover:bg-purple-600 
          text-white rounded-lg flex items-center justify-center gap-2 
          transition-colors duration-300 font-medium"
        >
            {copied ? (
                <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Link</span>
                </>
            )}
        </button>
    );

    return (
        <div className="space-y-3">
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-center text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Show it off!
                        </div>
                        <button
                            onClick={() => setIsInfoOpen(true)}
                            className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                            aria-label="Show sharing information"
                        >
                            <InfoIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {renderShareButton()}

            {state.showLink && !isSignedIn && (
                <div className="text-center text-xs font-medium text-purple-400">
                    Sign in to share your MappBook
                </div>
            )}

            <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] sm:w-[440px] rounded-2xl bg-gradient-to-br from-pink-100 to-purple-50 p-0 border-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-semibold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                            Share Your MappBook
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <div className="bg-white/80 rounded-xl p-4 shadow-sm space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm">
                                        <span className="font-medium text-purple-600">Customize Your MappBook:</span>
                                    </p>
                                    <ul className="text-sm text-gray-600 mt-2 space-y-2 ml-4">
                                        <li>• Choose a display name for your MappBook</li>
                                        <li>• Pick a color theme for visited countries</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm">
                                        <span className="font-medium text-purple-600">Share With Others:</span>
                                    </p>
                                    <ul className="text-sm text-gray-600 mt-2 space-y-2 ml-4">
                                        <li>• Get a unique link to your MappBook</li>
                                        <li>• Share your travel map on social media</li>
                                        <li>• Show off your visited places and bucket list</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-purple-50/50 rounded-lg p-3 text-sm text-purple-600">
                                <p className="font-medium">Pro Tip 💫</p>
                                <p className="mt-1 text-gray-600">
                                    Your MappBook updates in real-time! Any changes you make to your map will be instantly visible to anyone who has your share link.
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {state.showLink && isSignedIn && (

                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">

                        <div className="text-center text-xs font-medium text-purple-400">
                            Your MappBook title?
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <NameEditor
                                displayName={state.displayName}
                                isEditing={state.isEditing}
                                nameInput={state.nameInput}
                                isSaving={state.asyncState.isSaving}
                                error={state.asyncState.error}
                                onEdit={() => dispatch({ type: 'START_EDITING' })}
                                onSave={saveName}
                                onCancel={() => dispatch({ type: 'CANCEL_EDITING' })}
                                onNameChange={(value) =>
                                    dispatch({ type: 'SET_NAME_INPUT', payload: value })
                                }
                            />
                        </div>
                    </div>

                    {/* <StyleSelector
                        selectedStyle={state.mapStyle}
                        onStyleSelect={handleStyleSelect}
                    /> */}

                    <ColorSelector
                        selectedColor={state.countryFillColor}
                        onColorSelect={handleColorSelect}
                        isSaving={state.asyncState.isSaving}
                    />

                    {/* Share Link Section */}
                    <div className="space-y-2">
                        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg">
                            {renderCopyButton()}
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default ShareSection;
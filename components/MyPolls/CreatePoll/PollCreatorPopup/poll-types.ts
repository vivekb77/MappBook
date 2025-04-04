//poll-types.ts
export interface PollQuestion {
    text: string;
    options: string[];
  }
  
  export interface PollData {
    title: string;
    description: string;
    author: string;
    pollLength: string;
    questions: PollQuestion[];
    mappbook_user_id?: string;
    url?: string;
  }
  
  export interface ValidationErrors {
    title?: string;
    author?: string;
    description?: string;
    questions?: string[];
  }
  
  export interface CharCount {
    text: number;
    options: number[];
  }
  
  export interface CharCounts {
    title: number;
    description: number;
    author: number;
    questions: CharCount[];
  }
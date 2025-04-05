// app/poll/[id]/page.tsx
import { Metadata } from 'next';
import PollPageClient from './PollPageClient';

// Define TypeScript interface for poll data
interface PollData {
  poll_id_to_share: string;
  title: string;
  description: string;
  author: string;
}

// This function generates metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // Fetch poll data from API
    const pollId = params.id;
    const apiUrl = 'https://mappbook.com';
    const response = await fetch(`${apiUrl}/api/polls/get-poll?poll_id=${pollId}`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    
    if (!response.ok) {
      // Return default metadata if poll not found
      return {
        title: 'Poll | MappBook.com',
        description: 'Vote for this poll on MappBook.com',
      };
    }

    const { data } = await response.json() as { data: PollData };
    
    // Create dynamic metadata based on poll data
    return {
      title: `${data.title} | MappBook.com`,
      description: data.description || 'Vote for this poll on MappBook.com',
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title: `${data.title} | MappBook.com`,
        description: data.description || 'Vote for this poll on MappBook.com',
        type: 'website',
        url: `https://mappbook.com/poll/${data.poll_id_to_share}`,
        images: [
          {
            url: 'https://www.mappbook.com/social-share-card-image.png',
            width: 800,
            height: 418,
            alt: `${data.title} - Poll on MappBook.com`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${data.title} | MappBook.com`,
        description: data.description || 'Vote for this poll on MappBook.com',
        images: ['https://www.mappbook.com/social-share-card-image.png'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    // Return default metadata on error
    return {
      title: 'Poll | MappBook.com',
      description: 'Vote for this poll on MappBook.com',
    };
  }
}

// Server Component that renders the Client Component
export default function PollPage() {
  return <PollPageClient />;
}
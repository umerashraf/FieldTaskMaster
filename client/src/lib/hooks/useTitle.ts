import { useEffect } from 'react';

/**
 * A hook to dynamically update the document title
 * 
 * @param title The title to set for the page
 * @param suffix An optional suffix to append to all titles
 */
export function useTitle(title: string, suffix?: string) {
  useEffect(() => {
    // Combine title with suffix if provided
    const fullTitle = suffix ? `${title} ${suffix}` : title;
    
    // Set the document title
    document.title = fullTitle;
    
    // Clean up by restoring the original title
    return () => {
      // You could optionally set a default title here if needed
      // document.title = 'FieldServe Pro';
    };
  }, [title, suffix]);
}

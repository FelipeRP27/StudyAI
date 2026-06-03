import { useEffect } from 'react';

const BASE_TITLE = 'StudyAI';

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

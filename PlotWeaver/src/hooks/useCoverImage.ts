import { useState } from 'react';
import { isValidCoverUrl } from '../utils/validation';

export function useCoverImage(initialValue: string = '') {
  const [url, setUrl] = useState(initialValue);
  const [error, setError] = useState('');

  const handleChange = (newUrl: string) => {
    setUrl(newUrl);
    if (isValidCoverUrl(newUrl)) {
      setError('');
    } else {
      setError("L'URL doit commencer par http:// ou https://");
    }
  };

  const validate = (): boolean => {
    if (!isValidCoverUrl(url)) {
      setError("L'URL doit commencer par http:// ou https://");
      return false;
    }
    return true;
  };

  return { url, setUrl: handleChange, error, validate };
}
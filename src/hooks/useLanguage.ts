'use client';

import { useState, useEffect } from 'react';

export function useLanguage() {
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  return { selectedLanguage, handleLanguageChange };
} 
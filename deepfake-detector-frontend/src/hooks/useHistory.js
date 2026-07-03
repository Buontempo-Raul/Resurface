import { useState, useCallback } from 'react';

const STORAGE_KEY = 'resurface_history';
const MAX_ENTRIES = 200;

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const save = (entries) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently skip
  }
};

export const useHistory = () => {
  const [history, setHistory] = useState(load);

  const addEntry = useCallback((entry) => {
    setHistory((prev) => {
      // Avoid duplicates (same id can come in if re-analyzed)
      const without = prev.filter((e) => e.id !== entry.id);
      const updated = [entry, ...without].slice(0, MAX_ENTRIES);
      save(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
};

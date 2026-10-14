import { useState } from "react";
export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  });
  const update = (next) => {
    setValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [value, update];
}

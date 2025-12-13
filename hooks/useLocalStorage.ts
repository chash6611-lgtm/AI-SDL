
import { useState, useEffect } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            } catch (error) {
                console.error("Failed to write to local storage", error);
            }
        }
    }, [key, storedValue]);

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            setStoredValue((prevStoredValue) => {
                return value instanceof Function ? value(prevStoredValue) : value;
            });
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

export default useLocalStorage;

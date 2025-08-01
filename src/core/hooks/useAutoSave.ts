import { useEffect, useCallback, useState } from 'react';

// Improved debounce function with proper cleanup
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debouncedFunction = (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(null, args);
      timeoutId = null;
    }, delay);
  };
  
  // Add cleanup method
  (debouncedFunction as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debouncedFunction;
};

const STORAGE_KEYS = {
  ORDER_DRAFT: 'order_draft',
  DOORS_DRAFT: 'doors_draft',
};

export const useAutoSave = (data: any, key: string, delay = 2000) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const saveToStorage = useCallback(
    debounce((dataToSave: any) => {
      // Skip saving if not initialized yet (prevents saving empty initial state)
      if (!isInitialized) {
        return;
      }
      
      // Skip saving if data is explicitly null (used to prevent initial saves)
      if (dataToSave === null) {
        return;
      }
      
      // Better validation for different data types
      const shouldSave = dataToSave != null && (
        (Array.isArray(dataToSave) && dataToSave.length > 0) ||
        (typeof dataToSave === 'object' && !Array.isArray(dataToSave) && 
         Object.keys(dataToSave).length > 0 && 
         Object.values(dataToSave).some(value => value !== undefined && value !== null && value !== '')) ||
        (typeof dataToSave !== 'object' && dataToSave !== '' && dataToSave !== null && dataToSave !== undefined)
      );
      
      if (shouldSave) {
        localStorage.setItem(key, JSON.stringify(dataToSave));
      }
    }, delay),
    [key, delay, isInitialized]
  );

  useEffect(() => {
    // Initialize after a short delay to allow component to mount completely
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 1000);
    
    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(data);
    }
    
    // Cleanup function to cancel pending saves
    return () => {
      const debouncedFn = saveToStorage as any;
      if (debouncedFn.cancel) {
        debouncedFn.cancel();
      }
    };
  }, [data, saveToStorage, isInitialized]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  const getSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [key]);

  return { clearSavedData, getSavedData };
};

export const useOrderDraftRecovery = () => {
  const getOrderDraft = useCallback(() => {
    try {
      const orderDraft = localStorage.getItem(STORAGE_KEYS.ORDER_DRAFT);
      const doorsDraft = localStorage.getItem(STORAGE_KEYS.DOORS_DRAFT);
      
      return {
        orderData: orderDraft ? JSON.parse(orderDraft) : null,
        doorsData: doorsDraft ? JSON.parse(doorsDraft) : null,
      };
    } catch {
      return { orderData: null, doorsData: null };
    }
  }, []);

  const clearAllDrafts = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ORDER_DRAFT);
    localStorage.removeItem(STORAGE_KEYS.DOORS_DRAFT);
  }, []);

  const hasDraftData = useCallback(() => {
    try {
      const orderDraft = localStorage.getItem(STORAGE_KEYS.ORDER_DRAFT);
      const doorsDraft = localStorage.getItem(STORAGE_KEYS.DOORS_DRAFT);
      
      // Check if order data has meaningful content
      let hasOrderData = false;
      if (orderDraft && orderDraft !== 'null' && orderDraft !== '{}') {
        try {
          const parsedOrder = JSON.parse(orderDraft);
          hasOrderData = parsedOrder && typeof parsedOrder === 'object' && 
                        Object.values(parsedOrder).some(value => 
                          value !== undefined && value !== null && value !== ''
                        );
        } catch {
          hasOrderData = false;
        }
      }
      
      // Check if doors data has meaningful content  
      let hasDoorsData = false;
      if (doorsDraft && doorsDraft !== 'null' && doorsDraft !== '[]') {
        try {
          const parsedDoors = JSON.parse(doorsDraft);
          hasDoorsData = Array.isArray(parsedDoors) && parsedDoors.length > 0;
        } catch {
          hasDoorsData = false;
        }
      }
      
      return !!(hasOrderData || hasDoorsData);
    } catch {
      return false;
    }
  }, []);

  return {
    getOrderDraft,
    clearAllDrafts,
    hasDraftData,
    STORAGE_KEYS,
  };
};

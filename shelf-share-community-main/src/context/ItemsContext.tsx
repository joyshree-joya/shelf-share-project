import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Item, ExchangeRequest } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ItemsContextType {
  items: Item[];
  userItems: Item[];
  exchangeRequests: ExchangeRequest[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'status'>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<void>;
  claimItem: (itemId: string) => Promise<void>;
  requestExchange: (itemId: string, offeredItemId: string, message?: string) => Promise<void>;
  respondToExchange: (requestId: string, accept: boolean) => Promise<void>;
  getUserItems: (userId: string) => Item[];
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<Item[]>('/items');
      setItems(data);
      if (isAuthenticated) {
        const reqs = await apiFetch<ExchangeRequest[]>('/exchanges');
        setExchangeRequests(reqs);
      } else {
        setExchangeRequests([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load items';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When auth changes, refetch exchange requests.
    if (!isAuthenticated) {
      setExchangeRequests([]);
      return;
    }
    void apiFetch<ExchangeRequest[]>('/exchanges')
      .then(setExchangeRequests)
      .catch(() => setExchangeRequests([]));
  }, [isAuthenticated]);

  const addItem = async (itemData: Omit<Item, 'id' | 'createdAt' | 'status'>) => {
    const newItem = await apiFetch<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    const updated = await apiFetch<Item>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  };

  const deleteItem = async (id: string) => {
    await apiFetch<void>(`/items/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const claimItem = async (itemId: string) => {
    const updated = await apiFetch<Item>(`/items/${itemId}/claim`, { method: 'POST' });
    setItems((prev) => prev.map((it) => (it.id === itemId ? updated : it)));
  };

  const requestExchange = async (
    itemId: string,
    offeredItemId: string,
    message?: string
  ) => {
    const created = await apiFetch<ExchangeRequest>('/exchanges', {
      method: 'POST',
      body: JSON.stringify({ itemId, offeredItemId, message }),
    });
    setExchangeRequests((prev) => [created, ...prev]);
    // Refresh items so the requested item shows as pending.
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
  };

  const respondToExchange = async (requestId: string, accept: boolean) => {
    const updated = await apiFetch<ExchangeRequest>(`/exchanges/${requestId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ accept }),
    });
    setExchangeRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    // Refresh items to reflect accepted/rejected state.
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
  };

  const getUserItems = (userId: string) => {
    return items.filter((item) => item.ownerId === userId);
  };

  const userItems = useMemo(() => items.filter((item) => item.status === 'available'), [items]);

  return (
    <ItemsContext.Provider
      value={{
        items,
        userItems,
        exchangeRequests,
        isLoading,
        error,
        refresh,
        addItem,
        updateItem,
        deleteItem,
        claimItem,
        requestExchange,
        respondToExchange,
        getUserItems,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (context === undefined) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
}

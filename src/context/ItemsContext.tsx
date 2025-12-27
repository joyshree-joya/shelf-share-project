import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Item, ExchangeRequest, DonationRequest } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ItemsContextType {
  items: Item[];
  userItems: Item[];
  exchangeRequests: ExchangeRequest[];
  donationRequests: DonationRequest[];
  suggestedItems: Item[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'status'>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<void>;
  requestDonation: (itemId: string) => Promise<void>;
  respondToDonation: (requestId: string, accept: boolean) => Promise<void>;
  sendDonationMessage: (requestId: string, text: string) => Promise<void>;
  completeDonation: (requestId: string) => Promise<void>;
  requestExchange: (itemId: string, offeredItemIds: string[], note?: string) => Promise<void>;
  respondToExchange: (requestId: string, accept: boolean, selectedOfferedItemId?: string) => Promise<void>;
  sendExchangeMessage: (requestId: string, text: string) => Promise<void>;
  completeExchange: (requestId: string) => Promise<void>;
  getUserItems: (userId: string) => Item[];
}


const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<Item[]>([]);
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
        const dreqs = await apiFetch<DonationRequest[]>('/donations/requests');
        setDonationRequests(dreqs);
        const s = await apiFetch<Item[]>('/ai/suggestions');
        setSuggestedItems(s);
      } else {
        setExchangeRequests([]);
        setDonationRequests([]);
        setSuggestedItems([]);
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
      setDonationRequests([]);
      return;
    }
    void apiFetch<ExchangeRequest[]>('/exchanges')
      .then(setExchangeRequests)
      .catch(() => setExchangeRequests([]));

    void apiFetch<DonationRequest[]>('/donations/requests')
      .then(setDonationRequests)
      .catch(() => setDonationRequests([]));

    void apiFetch<Item[]>('/ai/suggestions')
      .then(setSuggestedItems)
      .catch(() => setSuggestedItems([]));
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

  const requestDonation = async (itemId: string) => {
    // Create a donation request and put the item on hold.
    await apiFetch<DonationRequest>('/donations/requests', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
    // Refresh items + requests for up-to-date status.
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
    const dreqs = await apiFetch<DonationRequest[]>('/donations/requests');
    setDonationRequests(dreqs);
  };

  const respondToDonation = async (requestId: string, accept: boolean) => {
    const updated = await apiFetch<DonationRequest>(`/donations/requests/${requestId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ accept }),
    });
    setDonationRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
  };

  const sendDonationMessage = async (requestId: string, text: string) => {
    const updated = await apiFetch<DonationRequest>(`/donations/requests/${requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    setDonationRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
  };

  const completeDonation = async (requestId: string) => {
    await apiFetch<{ ok: true }>(`/donations/requests/${requestId}/complete`, { method: 'PATCH' });
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
    const dreqs = await apiFetch<DonationRequest[]>('/donations/requests');
    setDonationRequests(dreqs);
  };

  const requestExchange = async (itemId: string, offeredItemIds: string[], note?: string) => {
    const created = await apiFetch<ExchangeRequest>('/exchanges', {
      method: 'POST',
      body: JSON.stringify({ itemId, offeredItemIds, note }),
    });
    setExchangeRequests((prev) => [created, ...prev]);
    // Refresh items so the requested item shows as hold.
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
  };

  const respondToExchange = async (requestId: string, accept: boolean, selectedOfferedItemId?: string) => {
    const updated = await apiFetch<ExchangeRequest>(`/exchanges/${requestId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ accept, selectedOfferedItemId }),
    });
    setExchangeRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    // Refresh items to reflect hold/available state.
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
  };

  const sendExchangeMessage = async (requestId: string, text: string) => {
    const updated = await apiFetch<ExchangeRequest>(`/exchanges/${requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    setExchangeRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
  };

  const completeExchange = async (requestId: string) => {
    await apiFetch<{ ok: boolean }>(`/exchanges/${requestId}/complete`, { method: 'PATCH' });
    // Refresh items and requests after completion.
    const reqs = await apiFetch<ExchangeRequest[]>('/exchanges');
    setExchangeRequests(reqs);
    const data = await apiFetch<Item[]>('/items');
    setItems(data);
  };

  const getUserItems = (userId: string) => {
    return items.filter((item) => item.ownerId === userId);
  };

  // Items to show on browse pages: exclude fully completed (taken)
  const userItems = useMemo(() => items.filter((item) => item.status !== 'taken'), [items]);

  return (
    <ItemsContext.Provider
      value={{
        items,
        userItems,
        exchangeRequests,
        donationRequests,
        suggestedItems,
        isLoading,
        error,
        refresh,
        addItem,
        updateItem,
        deleteItem,
        requestDonation,
        respondToDonation,
        sendDonationMessage,
        completeDonation,
        requestExchange,
        respondToExchange,
        sendExchangeMessage,
        completeExchange,
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

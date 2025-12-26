export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  donorPoints: number;
  badge: 'none' | 'bronze' | 'silver' | 'gold';
  createdAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: 'books' | 'electronics' | 'daily-use';
  tags: string[];
  condition: 'new' | 'used' | 'heavily-used';
  rating: number;
  images: string[];
  type: 'donation' | 'exchange';
  status: 'available' | 'pending' | 'taken';
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  createdAt: string;
}

export interface ExchangeRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  requesterId: string;
  requesterName: string;
  offeredItemId: string;
  offeredItemTitle: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'exchange_request' | 'exchange_accepted' | 'exchange_rejected' | 'donation_claimed';
  message: string;
  read: boolean;
  createdAt: string;
}

export type Category = 'books' | 'electronics' | 'daily-use';
export type ItemType = 'donation' | 'exchange';
export type Condition = 'new' | 'used' | 'heavily-used';

// Category-specific tags
export const bookTags = ['Novel', 'Poems', 'Rabindranath', 'Nazrul', 'Articles', 'Fiction', 'Non-Fiction', 'Academic'] as const;
export const electronicsTags = ['Mobile Phone', 'Calculator', 'Headphones', 'Laptop', 'Tablet', 'Camera', 'Small Devices'] as const;
export const dailyUseTags = ['Bags', 'Stationery', 'Water Bottles', 'Household', 'Kitchen', 'Fitness', 'Cleaning'] as const;

export type BookTag = typeof bookTags[number];
export type ElectronicsTag = typeof electronicsTags[number];
export type DailyUseTag = typeof dailyUseTags[number];

export const categoryTags: Record<Category, readonly string[]> = {
  books: bookTags,
  electronics: electronicsTags,
  'daily-use': dailyUseTags,
};

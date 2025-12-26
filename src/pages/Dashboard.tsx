import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useItems } from '@/context/ItemsContext';
import { Navbar } from '@/components/Navbar';
import { ItemCard } from '@/components/ItemCard';
import { Filters } from '@/components/Filters';
import { ItemCardSkeleton } from '@/components/Skeleton';
import { Category, ItemType, Condition } from '@/types';
import { useEffect } from 'react';

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, isLoading: itemsLoading, error: itemsError, refresh } = useItems();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<ItemType | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isLoading = itemsLoading;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Hide completed items. ("hold" items remain visible.)
      if (item.status === 'taken') return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && item.category !== selectedCategory) return false;

      // Type filter
      if (selectedType && item.type !== selectedType) return false;

      // Condition filter
      if (selectedCondition && item.condition !== selectedCondition) return false;

      // Tag filter
      if (selectedTag && !item.tags.includes(selectedTag)) return false;

      return true;
    });
  }, [items, search, selectedCategory, selectedType, selectedCondition, selectedTag]);

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Items</h1>
          <p className="text-muted-foreground">
            Discover items available for donation or exchange in your community
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Filters
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedCondition={selectedCondition}
            onConditionChange={setSelectedCondition}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </div>

        {/* Items Grid */}
        {itemsError ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="font-semibold">Couldn’t load items from the database.</div>
            <div className="mt-1 opacity-90">{itemsError}</div>
            <button
              className="mt-3 underline"
              onClick={() => void refresh()}
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

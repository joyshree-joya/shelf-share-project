import { Category, ItemType, Condition, categoryTags } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, BookOpen, Smartphone, Package, Gift, Repeat, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
  selectedType: ItemType | null;
  onTypeChange: (type: ItemType | null) => void;
  selectedCondition: Condition | null;
  onConditionChange: (condition: Condition | null) => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
}

const categories: { value: Category; label: string; icon: typeof BookOpen }[] = [
  { value: 'books', label: 'Books', icon: BookOpen },
  { value: 'electronics', label: 'Electronics', icon: Smartphone },
  { value: 'daily-use', label: 'Daily Use', icon: Package },
];

const types: { value: ItemType; label: string; icon: typeof Gift }[] = [
  { value: 'donation', label: 'Donations', icon: Gift },
  { value: 'exchange', label: 'Exchanges', icon: Repeat },
];

const conditions: { value: Condition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'heavily-used', label: 'Heavily Used' },
];

export function Filters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedCondition,
  onConditionChange,
  selectedTag,
  onTagChange,
}: FiltersProps) {
  const hasFilters = selectedCategory || selectedType || selectedCondition || selectedTag || search;

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange(null);
    onTypeChange(null);
    onConditionChange(null);
    onTagChange(null);
  };

  // Get available tags based on selected category
  const availableTags = selectedCategory ? categoryTags[selectedCategory] : [];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-card"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Categories */}
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (selectedCategory === cat.value) {
                onCategoryChange(null);
                onTagChange(null); // Clear tag when category is cleared
              } else {
                onCategoryChange(cat.value);
                onTagChange(null); // Clear tag when category changes
              }
            }}
            className={cn(
              "gap-1.5",
              selectedCategory === cat.value && "bg-primary text-primary-foreground"
            )}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </Button>
        ))}

        <div className="h-6 w-px bg-border mx-1" />

        {/* Types */}
        {types.map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange(selectedType === type.value ? null : type.value)}
            className={cn(
              "gap-1.5",
              selectedType === type.value && type.value === 'donation' && "bg-success text-success-foreground",
              selectedType === type.value && type.value === 'exchange' && "bg-accent text-accent-foreground"
            )}
          >
            <type.icon className="h-3.5 w-3.5" />
            {type.label}
          </Button>
        ))}

        <div className="h-6 w-px bg-border mx-1" />

        {/* Conditions */}
        {conditions.map((cond) => (
          <Button
            key={cond.value}
            variant={selectedCondition === cond.value ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onConditionChange(selectedCondition === cond.value ? null : cond.value)}
          >
            {cond.label}
          </Button>
        ))}

        {/* Clear Filters */}
        {hasFilters && (
          <>
            <div className="h-6 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear all
            </Button>
          </>
        )}
      </div>

      {/* Category-specific Tags */}
      {selectedCategory && availableTags.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {selectedCategory === 'books' && 'Book Types'}
              {selectedCategory === 'electronics' && 'Device Types'}
              {selectedCategory === 'daily-use' && 'Item Types'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTagChange(selectedTag === tag ? null : tag)}
                className={cn(
                  "h-7 text-xs",
                  selectedTag === tag && "bg-secondary text-secondary-foreground"
                )}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

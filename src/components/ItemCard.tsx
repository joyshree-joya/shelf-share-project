import { Item } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, BookOpen, Smartphone, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useResolvedItemImage } from '@/hooks/use-resolved-item-image';

interface ItemCardProps {
  item: Item;
  className?: string;
}

const categoryIcons = {
  books: BookOpen,
  electronics: Smartphone,
  'daily-use': Package,
};

const conditionLabels = {
  new: 'New',
  used: 'Used',
  'heavily-used': 'Heavily Used',
};

export function ItemCard({ item, className }: ItemCardProps) {
  const CategoryIcon = categoryIcons[item.category];
  const imageSrc = useResolvedItemImage(item);

  return (
    <Card hover className={cn("overflow-hidden group", className)}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={item.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = item.images[0];
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={item.type === 'donation' ? 'donation' : 'exchange'}>
            {item.type === 'donation' ? 'Donation' : 'Exchange'}
          </Badge>
          {item.status === 'hold' ? (
            <Badge variant="secondary">On Hold</Badge>
          ) : item.status === 'pending' ? (
            <Badge variant="secondary">Pending</Badge>
          ) : null}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={item.condition as 'new' | 'used' | 'heavily-used'}>
            {conditionLabels[item.condition]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CategoryIcon className="h-3.5 w-3.5" />
            <span className="text-xs capitalize">{item.category.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < item.rating ? "fill-gold text-gold" : "text-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Owner & Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={item.ownerAvatar} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {item.ownerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{item.ownerName}</span>
          </div>
          <Link to={`/item/${item.id}`}>
            <Button size="sm" variant="ghost" className="gap-1 text-primary hover:text-primary">
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

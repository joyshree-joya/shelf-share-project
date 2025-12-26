import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useItems } from '@/context/ItemsContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Star,
  BookOpen,
  Smartphone,
  Package,
  Gift,
  Repeat,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useResolvedItemImage } from '@/hooks/use-resolved-item-image';

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

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items, getUserItems, claimItem, requestExchange, isLoading: itemsLoading } = useItems();
  
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const item = items.find((i) => i.id === id);
  const userItems = user ? getUserItems(user.id).filter((i) => i.status === 'available') : [];

  if (!item) {
    if (itemsLoading) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container py-16 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading item…
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Item not found</h1>
          <p className="text-muted-foreground mb-6">
            This item may have been removed or claimed.
          </p>
          <Link to="/dashboard">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[item.category];
  const isOwner = user?.id === item.ownerId;
  const imageSrc = useResolvedItemImage(item);

  const handleClaimDonation = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await claimItem(item.id);
    setIsSubmitting(false);
    toast.success('Item claimed successfully!', {
      description: 'The owner has been notified. Check your profile for details.',
    });
    navigate('/dashboard');
  };

  const handleRequestExchange = async () => {
    if (!selectedItemId) {
      toast.error('Please select an item to offer');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await requestExchange(item.id, selectedItemId, message);
    setIsSubmitting(false);
    setShowExchangeModal(false);
    toast.success('Exchange request sent!', {
      description: 'The owner will review your request.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <img
              src={imageSrc}
              alt={item.title}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = item.images[0];
              }}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant={item.type === 'donation' ? 'donation' : 'exchange'} className="text-sm px-3 py-1">
                {item.type === 'donation' ? (
                  <>
                    <Gift className="h-3.5 w-3.5 mr-1" />
                    Donation
                  </>
                ) : (
                  <>
                    <Repeat className="h-3.5 w-3.5 mr-1" />
                    Exchange
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category & Condition */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CategoryIcon className="h-4 w-4" />
                <span className="text-sm capitalize">{item.category.replace('-', ' ')}</span>
              </div>
              <Badge variant={item.condition as 'new' | 'used' | 'heavily-used'}>
                {conditionLabels[item.condition]}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground">{item.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < item.rating ? "fill-gold text-gold" : "text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {item.rating}/5 rating
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Owner */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Listed by</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.ownerAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {item.ownerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{item.ownerName}</p>
                    <p className="text-sm text-muted-foreground">
                      Listed {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!isOwner && item.status === 'available' && (
              <div className="pt-4">
                {item.type === 'donation' ? (
                  <Button
                    variant="donation"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleClaimDonation}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Claim This Item
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="exchange"
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login');
                        return;
                      }
                      setShowExchangeModal(true);
                    }}
                  >
                    <Repeat className="h-5 w-5" />
                    Request Exchange
                  </Button>
                )}
              </div>
            )}

            {item.status !== 'available' && (
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="font-medium text-muted-foreground">
                  This item is no longer available
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Exchange Modal */}
      <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Exchange</DialogTitle>
            <DialogDescription>
              Select one of your items to offer in exchange for "{item.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="offered-item">Your Item</Label>
              {userItems.length > 0 ? (
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item to offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {userItems.map((userItem) => (
                      <SelectItem key={userItem.id} value={userItem.id}>
                        {userItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You don't have any items to exchange.{' '}
                  <Link to="/upload" className="text-primary hover:underline">
                    Upload an item first
                  </Link>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the owner..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExchangeModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestExchange}
              disabled={!selectedItemId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

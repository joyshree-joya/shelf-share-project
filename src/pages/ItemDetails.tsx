import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useItems } from '@/context/ItemsContext';
import { apiFetch } from '@/lib/api';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Sparkles,
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
  const { items, getUserItems, donationRequests, requestDonation, requestExchange, isLoading: itemsLoading } = useItems();
  
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const item = items.find((i) => i.id === id);
  const userItems = user ? getUserItems(user.id).filter((i) => i.status === 'available' && i.type === 'exchange') : [];

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

  const relatedDonationRequest = user
    ? donationRequests.find(
        (r) => r.itemId === item?.id && (r.ownerId === user.id || r.requesterId === user.id)
      )
    : undefined;

  const toggleOffered = (offerId: string) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(offerId)) return prev.filter((id) => id !== offerId);
      if (prev.length >= 4) {
        toast.error('You can offer at most 4 items');
        return prev;
      }
      return [...prev, offerId];
    });
  };

  const applyAiSuggestions = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const resp = await apiFetch<{ items: string[]; reason?: string }>(
        `/ai/exchange-offers?targetItemId=${encodeURIComponent(item.id)}`
      );
      const ids = (resp.items || [])
        .filter((id) => userItems.some((ui) => ui.id === id))
        .slice(0, 4);

      if (ids.length === 0) {
        toast.info('No AI suggestions available');
        return;
      }
      setSelectedItemIds(ids);
      toast.success('AI suggestions applied', {
        description: resp.reason || 'Picked up to 4 items to offer.',
      });
    } catch (_e) {
      toast.error('Failed to get AI suggestions');
    }
  };

  const handleRequestDonation = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await requestDonation(item.id);
    setIsSubmitting(false);
    toast.success('Request sent!', {
      description: 'The donor will accept or deny your request. If accepted, you can chat in Requests.',
    });
    navigate('/requests');
  };

  const handleRequestExchange = async () => {
    if (selectedItemIds.length < 1) {
      toast.error('Please select at least 1 item to offer');
      return;
    }
    if (selectedItemIds.length > 4) {
      toast.error('You can offer at most 4 items');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await requestExchange(item.id, selectedItemIds, message);
    setIsSubmitting(false);
    setShowExchangeModal(false);
    toast.success('Exchange request sent!', {
      description: 'The owner will choose one of your offers. If accepted, you can chat in Requests.',
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
                    {item.ownerEmail ? (
                      <a
                        className="text-sm text-primary hover:underline"
                        href={`mailto:${item.ownerEmail}`}
                      >
                        {item.ownerEmail}
                      </a>
                    ) : null}
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
                    onClick={handleRequestDonation}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Request This Item
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
              <div className="p-4 rounded-lg bg-muted text-center space-y-2">
                {item.status === 'hold' ? (
                  <>
                    <p className="font-medium text-foreground">This item is on hold</p>
                    <p className="text-sm text-muted-foreground">
                      {isOwner
                        ? 'Someone requested this donation. You can accept/deny and chat in Requests.'
                        : relatedDonationRequest?.status === 'accepted'
                          ? 'Your request was accepted. You can chat with the donor in Requests.'
                          : 'A request is pending with the donor.'}
                    </p>
                    <Button variant="secondary" onClick={() => navigate('/requests')}>
                      Go to Requests
                    </Button>
                  </>
                ) : (
                  <p className="font-medium text-muted-foreground">This item is no longer available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Exchange Modal */}
      <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
        <DialogContent className="sm:max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto !top-4 !translate-y-0 sm:!top-[50%] sm:!translate-y-[-50%] !flex !flex-col">

          <DialogHeader>
            <DialogTitle>Request Exchange</DialogTitle>
            <DialogDescription>
              Choose up to 4 of your items to offer in exchange for "{item.title}". The owner will pick one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="offered-item">Choose up to 4 of your exchange items</Label>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  Selected: {selectedItemIds.length}/4
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void applyAiSuggestions()}
                  disabled={isSubmitting || userItems.length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Suggest
                </Button>
              </div>

              {userItems.length > 0 ? (
                <ScrollArea className="h-32 rounded-md border p-3">
                  <div className="space-y-3">
                    {userItems.map((userItem) => (
                      <label
                        key={userItem.id}
                        className="flex items-start gap-3 cursor-pointer rounded-md p-2 hover:bg-muted"
                      >
                        <Checkbox
                          checked={selectedItemIds.includes(userItem.id)}
                          onCheckedChange={() => toggleOffered(userItem.id)}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{userItem.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {userItem.category} • {userItem.condition}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You don't have any exchange items.{' '}
                  <Link to="/upload" className="text-primary hover:underline">
                    Upload an exchange item first
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
              disabled={selectedItemIds.length === 0 || isSubmitting}
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
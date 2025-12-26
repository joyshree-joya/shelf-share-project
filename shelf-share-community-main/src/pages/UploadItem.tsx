import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useItems } from '@/context/ItemsContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Upload, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Category, Condition, ItemType } from '@/types';
import { useEffect } from 'react';

const categories: { value: Category; label: string }[] = [
  { value: 'books', label: 'Books' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'daily-use', label: 'Daily Use Items' },
];

const conditions: { value: Condition; label: string; description: string }[] = [
  { value: 'new', label: 'New', description: 'Brand new, unused item' },
  { value: 'used', label: 'Used', description: 'Good condition with minor wear' },
  { value: 'heavily-used', label: 'Heavily Used', description: 'Visible wear but functional' },
];

// Sample images for demo
const sampleImages = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1585442245228-5c2b84a89e86?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
];

export default function UploadItem() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { addItem } = useItems();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [tags, setTags] = useState('');
  const [condition, setCondition] = useState<Condition | ''>('');
  const [rating, setRating] = useState(0);
  const [type, setType] = useState<ItemType>('donation');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !condition || rating === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      await addItem({
        title,
        description,
        category: category as Category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        condition: condition as Condition,
        rating,
        images: [imageUrl || sampleImages[Math.floor(Math.random() * sampleImages.length)]],
        type,
        ownerId: user!.id,
        ownerName: user!.name,
        ownerAvatar: user?.avatar,
      });

      setIsSubmitting(false);
      toast.success('Item uploaded successfully!');
      navigate('/dashboard');
    } catch (err) {
      setIsSubmitting(false);
      toast.error('Failed to upload item', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    }
  };

  if (authLoading) {
    return null;
  }

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

        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Share an Item</h1>
            <p className="text-muted-foreground">
              List an item for donation or exchange with your community
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Fill in the details about your item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., The Alchemist by Paulo Coelho"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the item's condition, features, and any other relevant details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., fiction, bestseller, classic (comma-separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>

                {/* Condition */}
                <div className="space-y-3">
                  <Label>Condition *</Label>
                  <RadioGroup
                    value={condition}
                    onValueChange={(v) => setCondition(v as Condition)}
                    className="space-y-2"
                  >
                    {conditions.map((cond) => (
                      <div
                        key={cond.value}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                          condition === cond.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setCondition(cond.value)}
                      >
                        <RadioGroupItem value={cond.value} id={cond.value} />
                        <div>
                          <Label htmlFor={cond.value} className="cursor-pointer font-medium">
                            {cond.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {cond.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Rating */}
                <div className="space-y-3">
                  <Label>Your Rating *</Label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            i < rating ? "fill-gold text-gold" : "text-muted hover:text-gold/50"
                          )}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use a sample image
                  </p>
                </div>

                {/* Type */}
                <div className="space-y-3">
                  <Label>Listing Type *</Label>
                  <RadioGroup
                    value={type}
                    onValueChange={(v) => setType(v as ItemType)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border p-6 cursor-pointer transition-colors",
                        type === 'donation'
                          ? "border-success bg-success/5"
                          : "border-border hover:border-success/50"
                      )}
                      onClick={() => setType('donation')}
                    >
                      <RadioGroupItem value="donation" id="donation" className="sr-only" />
                      <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                        <Upload className="h-6 w-6 text-success" />
                      </div>
                      <Label htmlFor="donation" className="cursor-pointer font-medium text-center">
                        Donation
                      </Label>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        Give away for free
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border p-6 cursor-pointer transition-colors",
                        type === 'exchange'
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      )}
                      onClick={() => setType('exchange')}
                    >
                      <RadioGroupItem value="exchange" id="exchange" className="sr-only" />
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                        <ImageIcon className="h-6 w-6 text-accent" />
                      </div>
                      <Label htmlFor="exchange" className="cursor-pointer font-medium text-center">
                        Exchange
                      </Label>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        Trade for another item
                      </p>
                    </div>
                  </RadioGroup>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload Item
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

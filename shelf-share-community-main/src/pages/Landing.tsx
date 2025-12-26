import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Leaf, 
  BookOpen, 
  Smartphone, 
  Package, 
  ArrowRight, 
  Heart,
  Repeat,
  Users,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';

const features = [
  {
    icon: Heart,
    title: 'Donate Items',
    description: 'Give your unused items a second life by donating them to someone in need.',
  },
  {
    icon: Repeat,
    title: 'Exchange Items',
    description: 'Trade items you no longer need for something you actually want.',
  },
  {
    icon: Users,
    title: 'Build Community',
    description: 'Connect with like-minded people who believe in sustainable living.',
  },
];

const categories = [
  { icon: BookOpen, label: 'Books', count: '2.5k+' },
  { icon: Smartphone, label: 'Electronics', count: '1.8k+' },
  { icon: Package, label: 'Daily Use', count: '3.2k+' },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Join the circular economy movement
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl animate-fade-in stagger-1">
              Share More,{' '}
              <span className="text-gradient">Waste Less</span>
            </h1>
            
            <p className="mb-10 text-lg text-muted-foreground md:text-xl animate-fade-in stagger-2">
              Shelf Share is a community-driven platform where you can donate, exchange, 
              and reuse items. Give your belongings a second life while helping others.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-3">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="hero" size="xl" className="gap-2">
                    Browse Items
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="hero" size="xl" className="gap-2">
                      Get Started Free
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="xl">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {categories.map((cat) => (
              <div key={cat.label} className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <cat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{cat.label}</div>
                  <div className="text-sm">{cat.count} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of people making a difference through sustainable sharing.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="relative overflow-hidden border-none bg-gradient-to-b from-card to-muted/30 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center md:px-16">
            <div className="absolute inset-0 -z-10">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
            </div>
            
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <Leaf className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
                Ready to Make a Difference?
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/80">
                Join our community today and start sharing items with people around you.
              </p>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button 
                    size="xl" 
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl"
                  >
                    Join Shelf Share
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">Shelf Share</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Shelf Share. Exchange, Donate, Reuse.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useItems } from '@/context/ItemsContext';
import { Navbar } from '@/components/Navbar';
import { ItemCard } from '@/components/ItemCard';
import { DonorBadge, getNextBadgeInfo } from '@/components/DonorBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Repeat,
  Gift,
  Calendar,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, exchangeRequests, respondToExchange } = useItems();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const myItems = items.filter((item) => item.ownerId === user.id);
  const myDonations = myItems.filter((item) => item.type === 'donation');
  const myExchangeItems = myItems.filter((item) => item.type === 'exchange');
  
  const incomingRequests = exchangeRequests.filter(
    (req) => items.find((i) => i.id === req.itemId)?.ownerId === user.id
  );

  const nextBadge = getNextBadgeInfo(user.donorPoints);
  const progressToNext = nextBadge.next
    ? ((user.donorPoints % (nextBadge.next === 'bronze' ? 10 : nextBadge.next === 'silver' ? 20 : 20)) / 
       (nextBadge.next === 'bronze' ? 10 : nextBadge.next === 'silver' ? 20 : 20)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">{user.name}</h1>
                <p className="text-muted-foreground mb-3">{user.email}</p>
                <DonorBadge badge={user.badge} points={user.donorPoints} />
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Progress to next badge */}
            {nextBadge.next && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Progress to {nextBadge.next.charAt(0).toUpperCase() + nextBadge.next.slice(1)} Badge
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {nextBadge.pointsNeeded} points needed
                  </span>
                </div>
                <Progress value={progressToNext} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{myItems.length}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{myDonations.length}</p>
                  <p className="text-sm text-muted-foreground">Donations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Repeat className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{myExchangeItems.length}</p>
                  <p className="text-sm text-muted-foreground">Exchanges</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="items">My Items</TabsTrigger>
            <TabsTrigger value="requests">
              Exchange Requests
              {incomingRequests.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {incomingRequests.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-6">
            {myItems.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-1">No items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start sharing items with your community
                </p>
                <Button onClick={() => navigate('/upload')}>Upload Item</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {incomingRequests.length > 0 ? (
              incomingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          {request.requesterName} wants to exchange
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{request.offeredItemTitle}</span>
                          {' '} for your{' '}
                          <span className="font-medium">{request.itemTitle}</span>
                        </p>
                        {request.message && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void respondToExchange(request.id, false)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void respondToExchange(request.id, true)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </>
                        ) : (
                          <Badge
                            variant={request.status === 'accepted' ? 'success' : 'secondary'}
                          >
                            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-1">No exchange requests</h3>
                <p className="text-muted-foreground">
                  Exchange requests will appear here
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1">Transaction History</h3>
              <p className="text-muted-foreground">
                Your completed donations and exchanges will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

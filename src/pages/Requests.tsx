import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useItems } from '@/context/ItemsContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { DonationRequest, ExchangeRequest, Item } from '@/types';

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'denied':
      return 'Denied';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

function isOwnerByEmailOrId(user: { id: string; email?: string }, ownerId?: string, ownerEmail?: string) {
  if (!user) return false;
  if (ownerId && ownerId === user.id) return true;
  if (ownerEmail && user.email && ownerEmail.toLowerCase() === user.email.toLowerCase()) return true;
  return false;
}

function resolveItem(items: Item[], id: string) {
  return items.find((i) => i.id === id);
}

export default function Requests() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    items,
    donationRequests,
    exchangeRequests,
    respondToDonation,
    sendDonationMessage,
    completeDonation,
    respondToExchange,
    sendExchangeMessage,
    completeExchange,
  } = useItems();

  const [kind, setKind] = useState<'donation' | 'exchange'>('donation');
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  const donationIncoming = useMemo(() => {
    if (!user) return [];
    return donationRequests.filter((r) => isOwnerByEmailOrId(user, r.ownerId, r.ownerEmail));
  }, [donationRequests, user]);

  const donationOutgoing = useMemo(() => {
    if (!user) return [];
    return donationRequests.filter((r) => r.requesterId === user.id);
  }, [donationRequests, user]);

  const exchangeIncoming = useMemo(() => {
    if (!user) return [];
    return exchangeRequests.filter((r) => isOwnerByEmailOrId(user, r.ownerId, r.ownerEmail));
  }, [exchangeRequests, user]);

  const exchangeOutgoing = useMemo(() => {
    if (!user) return [];
    return exchangeRequests.filter((r) => r.requesterId === user.id);
  }, [exchangeRequests, user]);

  const list = useMemo(() => {
    const pool =
      kind === 'donation'
        ? tab === 'incoming'
          ? donationIncoming
          : donationOutgoing
        : tab === 'incoming'
          ? exchangeIncoming
          : exchangeOutgoing;
    return pool;
  }, [kind, tab, donationIncoming, donationOutgoing, exchangeIncoming, exchangeOutgoing]);

  useEffect(() => {
    setSelectedId(list.length ? list[0].id : null);
    setText('');
    setSelectedOfferId('');
  }, [kind, tab]); // reset when switching views

  useEffect(() => {
    if (!selectedId && list.length) setSelectedId(list[0].id);
  }, [selectedId, list]);

  const selectedDonation = kind === 'donation' ? list.find((r) => r.id === selectedId) as DonationRequest | undefined : undefined;
  const selectedExchange = kind === 'exchange' ? list.find((r) => r.id === selectedId) as ExchangeRequest | undefined : undefined;

  // Update default selected offer when owner views a pending exchange request
  useEffect(() => {
    if (selectedExchange && selectedExchange.status === 'pending' && tab === 'incoming') {
      const first = selectedExchange.offeredItemIds?.[0] || selectedExchange.offeredItems?.[0]?.id || '';
      setSelectedOfferId(first);
    }
  }, [selectedExchange, tab]);

  if (authLoading || !user) return null;

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;

    try {
      if (kind === 'donation' && selectedDonation) {
        await sendDonationMessage(selectedDonation.id, msg);
        setText('');
      } else if (kind === 'exchange' && selectedExchange) {
        await sendExchangeMessage(selectedExchange.id, msg);
        setText('');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    }
  };

  const canChat =
    (kind === 'donation' && selectedDonation?.status === 'accepted') ||
    (kind === 'exchange' && selectedExchange?.status === 'accepted');

  const renderListItem = (req: DonationRequest | ExchangeRequest) => (
    <button
      key={req.id}
      onClick={() => setSelectedId(req.id)}
      className={[
        'w-full text-left rounded-lg border p-3 hover:bg-muted transition',
        selectedId === req.id ? 'bg-muted border-primary/30' : 'bg-background',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{req.itemTitle}</div>
          <div className="text-xs text-muted-foreground truncate">
            {tab === 'incoming' ? 'From: ' + req.requesterName : 'To: ' + req.ownerName}
          </div>
        </div>
        <Badge variant="secondary">{statusLabel(req.status)}</Badge>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold">Requests & Chat</h1>

          <Tabs value={kind} onValueChange={(v) => setKind(v as 'donation' | 'exchange')}>
            <TabsList>
              <TabsTrigger value="donation">Donations</TabsTrigger>
              <TabsTrigger value="exchange">Exchanges</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'incoming' | 'outgoing')}>
          <TabsList>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">{kind === 'donation' ? 'Donation' : 'Exchange'} requests</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[420px] pr-2">
                <div className="space-y-3">
                  {list.length ? list.map(renderListItem) : (
                    <div className="text-sm text-muted-foreground p-4">
                      No requests here yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Details + Chat */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Donation details */}
              {kind === 'donation' && selectedDonation ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{selectedDonation.itemTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {tab === 'incoming' ? (
                          <>
                            Requester: <span className="font-medium">{selectedDonation.requesterName}</span>{' '}
                            <span className="text-xs">({selectedDonation.requesterEmail})</span>
                          </>
                        ) : (
                          <>
                            Owner: <span className="font-medium">{selectedDonation.ownerName}</span>{' '}
                            <span className="text-xs">({selectedDonation.ownerEmail || '—'})</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{statusLabel(selectedDonation.status)}</Badge>
                  </div>

                  {selectedDonation.status === 'pending' && tab === 'incoming' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => respondToDonation(selectedDonation.id, true).catch((e) => toast.error(String(e)))}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => respondToDonation(selectedDonation.id, false).catch((e) => toast.error(String(e)))}
                      >
                        Deny
                      </Button>
                    </div>
                  ) : null}

                  {selectedDonation.status === 'accepted' && tab === 'incoming' ? (
                    <Button onClick={() => completeDonation(selectedDonation.id).catch((e) => toast.error(String(e)))}>
                      Mark as completed
                    </Button>
                  ) : null}

                  {/* Chat */}
                  <div className="border rounded-lg">
                    <div className="p-3 border-b font-medium text-sm">Chat</div>
                    <ScrollArea className="h-56 p-3">
                      {selectedDonation.messages?.length ? (
                        <div className="space-y-3">
                          {selectedDonation.messages.map((m, idx) => (
                            <div
                              key={idx}
                              className={[
                                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                                m.senderId === user.id ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted',
                              ].join(' ')}
                            >
                              <div className="text-xs opacity-80 mb-1">{m.senderName}</div>
                              <div>{m.text}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No messages yet.</div>
                      )}
                    </ScrollArea>

                    <div className="p-3 border-t space-y-2">
                      {!canChat ? (
                        <div className="text-xs text-muted-foreground">
                          Chat opens after the owner accepts the request.
                        </div>
                      ) : null}
                      <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={canChat ? 'Type a message…' : 'Chat locked until accepted'}
                        disabled={!canChat}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button onClick={() => void handleSend()} disabled={!canChat || !text.trim()}>
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {/* Exchange details */}
              {kind === 'exchange' && selectedExchange ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{selectedExchange.itemTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {tab === 'incoming' ? (
                          <>
                            Requester: <span className="font-medium">{selectedExchange.requesterName}</span>{' '}
                            <span className="text-xs">({selectedExchange.requesterEmail})</span>
                          </>
                        ) : (
                          <>
                            Owner: <span className="font-medium">{selectedExchange.ownerName}</span>{' '}
                            <span className="text-xs">({selectedExchange.ownerEmail || '—'})</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{statusLabel(selectedExchange.status)}</Badge>
                  </div>

                  {selectedExchange.note ? (
                    <div className="rounded-lg border p-3 text-sm">
                      <div className="text-xs text-muted-foreground mb-1">Requester note</div>
                      {selectedExchange.note}
                    </div>
                  ) : null}

                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium mb-2">Offered items</div>

                    {selectedExchange.status === 'pending' && tab === 'incoming' ? (
                      <RadioGroup
                        value={selectedOfferId}
                        onValueChange={setSelectedOfferId}
                        className="space-y-2"
                      >
                        {(selectedExchange.offeredItems?.length ? selectedExchange.offeredItems : selectedExchange.offeredItemIds.map((id) => {
                          const it = resolveItem(items, id);
                          return { id, title: it?.title || id, image: it?.images?.[0] || '' };
                        })).map((o) => (
                          <label key={o.id} className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted cursor-pointer">
                            <RadioGroupItem value={o.id} />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{o.title}</div>
                              {o.image ? <div className="text-xs text-muted-foreground truncate">{o.id}</div> : null}
                            </div>
                          </label>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2">
                        {selectedExchange.offeredItems?.map((o) => (
                          <div key={o.id} className="flex items-start justify-between gap-2 rounded-md border p-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{o.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{o.id}</div>
                            </div>
                            {selectedExchange.selectedOfferedItemId === o.id ? (
                              <Badge>Selected</Badge>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedExchange.status === 'pending' && tab === 'incoming' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          respondToExchange(selectedExchange.id, true, selectedOfferId).catch((e) => toast.error(String(e)))
                        }
                        disabled={!selectedOfferId}
                      >
                        Accept & pick this item
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => respondToExchange(selectedExchange.id, false).catch((e) => toast.error(String(e)))}
                      >
                        Deny
                      </Button>
                    </div>
                  ) : null}

                  {selectedExchange.status === 'accepted' && tab === 'incoming' ? (
                    <Button onClick={() => completeExchange(selectedExchange.id).catch((e) => toast.error(String(e)))}>
                      Mark as completed
                    </Button>
                  ) : null}

                  {/* Chat */}
                  <div className="border rounded-lg">
                    <div className="p-3 border-b font-medium text-sm">Chat</div>
                    <ScrollArea className="h-56 p-3">
                      {selectedExchange.messages?.length ? (
                        <div className="space-y-3">
                          {selectedExchange.messages.map((m, idx) => (
                            <div
                              key={idx}
                              className={[
                                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                                m.senderId === user.id ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted',
                              ].join(' ')}
                            >
                              <div className="text-xs opacity-80 mb-1">{m.senderName}</div>
                              <div>{m.text}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No messages yet.</div>
                      )}
                    </ScrollArea>

                    <div className="p-3 border-t space-y-2">
                      {!canChat ? (
                        <div className="text-xs text-muted-foreground">
                          Chat opens after the owner accepts the request and selects one offered item.
                        </div>
                      ) : null}
                      <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={canChat ? 'Type a message…' : 'Chat locked until accepted'}
                        disabled={!canChat}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button onClick={() => void handleSend()} disabled={!canChat || !text.trim()}>
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {!selectedDonation && !selectedExchange ? (
                <div className="text-sm text-muted-foreground">Select a request to view details.</div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

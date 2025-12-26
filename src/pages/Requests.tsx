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
import { toast } from 'sonner';

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

export default function Requests() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    donationRequests,
    respondToDonation,
    sendDonationMessage,
    completeDonation,
    refresh,
    isLoading,
  } = useItems();

  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const incoming = useMemo(() => {
    if (!user) return [];
    return donationRequests.filter((r) => r.ownerId === user.id);
  }, [donationRequests, user]);

  const outgoing = useMemo(() => {
    if (!user) return [];
    return donationRequests.filter((r) => r.requesterId === user.id);
  }, [donationRequests, user]);

  const list = tab === 'incoming' ? incoming : outgoing;

  useEffect(() => {
    if (list.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = selectedId && list.some((r) => r.id === selectedId);
    if (!stillExists) setSelectedId(list[0].id);
  }, [list, selectedId]);

  const selected = (selectedId ? list.find((r) => r.id === selectedId) : null) || list[0] || null;

  if (!authLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  const select = (id: string) => setSelectedId(id);

  const handleRespond = async (accept: boolean) => {
    if (!selected) return;
    try {
      setBusy(true);
      await respondToDonation(selected.id, accept);
      toast.success(accept ? 'Request accepted' : 'Request denied');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to respond');
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!selected) return;
    const text = message.trim();
    if (!text) return;
    try {
      setBusy(true);
      await sendDonationMessage(selected.id, text);
      setMessage('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    if (!selected) return;
    try {
      setBusy(true);
      await completeDonation(selected.id);
      toast.success('Donation completed', {
        description: 'The item is now marked as taken and will disappear from Browse.',
      });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to complete');
    } finally {
      setBusy(false);
    }
  };

  const renderList = (rows: typeof incoming) => {
    if (rows.length === 0) {
      return (
        <div className="p-6 text-sm text-muted-foreground">No requests here yet.</div>
      );
    }
    return (
      <div className="divide-y">
        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => select(r.id)}
            className={`w-full text-left p-4 hover:bg-muted transition ${selected?.id === r.id ? 'bg-muted' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{r.itemTitle}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {tab === 'incoming'
                    ? `From: ${r.requesterName}${r.requesterEmail ? ` (${r.requesterEmail})` : ''}`
                    : `To: ${r.ownerName}${r.ownerEmail ? ` (${r.ownerEmail})` : ''}`}
                </div>
              </div>
              <Badge variant="secondary">{statusLabel(r.status)}</Badge>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Requests</h1>
          <p className="text-muted-foreground">
            Donation requests require approval. After the donor accepts, you can chat here.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
          </TabsList>

          <div className="grid gap-6 mt-6 lg:grid-cols-[360px_1fr]">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {tab === 'incoming' ? 'Requests to you' : 'Requests you sent'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  {renderList(list)}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{selected ? selected.itemTitle : 'Select a request'}</CardTitle>
                    {selected ? (
                      <div className="text-sm text-muted-foreground mt-1">
                        {tab === 'incoming'
                          ? `Requester: ${selected.requesterName}`
                          : `Donor: ${selected.ownerName}`}
                      </div>
                    ) : null}
                  </div>
                  {selected ? <Badge variant="secondary">{statusLabel(selected.status)}</Badge> : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {!selected ? (
                  <div className="text-sm text-muted-foreground">Pick a request from the left.</div>
                ) : (
                  <>
                    {/* Owner actions */}
                    {user && selected.ownerId === user.id && selected.status === 'pending' ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="default"
                          onClick={() => void handleRespond(true)}
                          disabled={busy || isLoading}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleRespond(false)}
                          disabled={busy || isLoading}
                        >
                          Deny
                        </Button>
                      </div>
                    ) : null}

                    {user && selected.ownerId === user.id && selected.status === 'accepted' ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => void handleComplete()}
                          disabled={busy || isLoading}
                        >
                          Mark as Completed
                        </Button>
                        <div className="text-xs text-muted-foreground self-center">
                          Use this after you finish communication and handover.
                        </div>
                      </div>
                    ) : null}

                    {/* Chat */}
                    <div>
                      <div className="text-sm font-medium text-foreground mb-2">Chat</div>
                      {selected.status !== 'accepted' ? (
                        <div className="text-sm text-muted-foreground">
                          Chat opens after the donor accepts the request.
                        </div>
                      ) : (
                        <>
                          <ScrollArea className="h-[280px] rounded-lg border p-3">
                            {selected.messages.length === 0 ? (
                              <div className="text-sm text-muted-foreground">No messages yet. Say hi 👋</div>
                            ) : (
                              <div className="space-y-3">
                                {selected.messages.map((m, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="text-xs font-medium text-foreground">
                                        {m.senderName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(m.createdAt).toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{m.text}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>

                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Write a message…"
                              rows={3}
                            />
                            <div className="flex justify-end">
                              <Button
                                onClick={() => void handleSend()}
                                disabled={busy || isLoading || !message.trim()}
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

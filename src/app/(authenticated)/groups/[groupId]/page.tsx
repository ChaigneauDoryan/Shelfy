'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Group, User, Book } from "@prisma/client";
import { useSession } from "next-auth/react";
import BookSearchDialog from "@/components/BookSearchDialog";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import GroupAvatarUpload from "@/components/GroupAvatarUpload";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, MoreVertical, Star } from "lucide-react";
import { generateAvatarFromText } from "@/lib/avatar-utils";
import JoinRequestsManager from "@/components/JoinRequestsManager";
import PollManagement from "@/components/PollManagement";
import PollDisplay from "@/components/PollDisplay";
import GroupCurrentReadingBook from "@/components/GroupCurrentReadingBook";
import GroupFinishedBookDetails from "@/components/GroupFinishedBookDetails"; // Import du nouveau composant
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Import des composants Sheet
import type { BookSelectionPayload, GroupBookWithAverageRating, UserLibraryBook } from '@/types/domain';

const groupSettingsSchema = z.object({
  name: z.string().min(2, { message: "Le nom du groupe doit contenir au moins 2 caractères." }),
  description: z.string().max(280, { message: "La description ne peut pas dépasser 280 caractères." }).optional(),
});

type GroupSettingsFormValues = z.infer<typeof groupSettingsSchema>;

import { useGroupDetails } from '@/hooks/useGroupDetails';

function MemberAvatar({ member }: { member: { user: User } }) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (member.user.image) {
      setAvatar(member.user.image);
    } else {
      setAvatar(generateAvatarFromText(member.user.name || ' '));
    }
  }, [member.user.image, member.user.name]);

  return (
    <Avatar>
      <AvatarImage src={avatar || undefined} />
      <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
    </Avatar>
  );
}

export default function GroupDetailsPage() {
  const params = useParams<{ groupId: string }>();
  const { groupId } = params;

  const { data: group, isLoading, error, refetch } = useGroupDetails(groupId);
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);

  const [showFinishedBookDetails, setShowFinishedBookDetails] = useState(false);
  const [selectedFinishedBook, setSelectedFinishedBook] = useState<GroupBookWithAverageRating | null>(null);
  const [isMemberLibraryOpen, setIsMemberLibraryOpen] = useState(false);
  const [selectedMemberLibrary, setSelectedMemberLibrary] = useState<{ id: string; name: string } | null>(null);
  const [memberLibraryBooks, setMemberLibraryBooks] = useState<UserLibraryBook[]>([]);
  const [memberLibraryLoading, setMemberLibraryLoading] = useState(false);
  const [memberLibraryError, setMemberLibraryError] = useState<string | null>(null);

  let currentlyReadingBook: GroupBookWithAverageRating | undefined;
  let finishedBooks: GroupBookWithAverageRating[] = [];
  let suggestedBooks: GroupBookWithAverageRating[] = [];

  useEffect(() => {
    if (group) {
      setAvatarUrl(group.avatar_url);
      if (group.avatar_url) {
        setGroupAvatar(group.avatar_url);
      } else {
        setGroupAvatar(generateAvatarFromText(group.name, 200));
      }
    }
  }, [group]);

  const form = useForm<GroupSettingsFormValues>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
    },
  });

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  if (!group) {
    return <div>Groupe non trouvé.</div>;
  }

  const isAdmin = group.members.some(member => member.user.id === session?.user?.id && member.role === 'ADMIN');

  currentlyReadingBook = group.books.find((book) => book.status === 'CURRENT');
  finishedBooks = group.books
    .filter((book) => book.status === 'FINISHED')
    .sort((a, b) => {
      const dateA = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const dateB = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return dateB - dateA;
    });
  suggestedBooks = group.books.filter((book) => book.status === 'SUGGESTED');

  const handleSelectBook = async (book: GroupBookWithAverageRating) => {
    const response = await fetch(`/api/groups/${group.id}/currently-reading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookId: book.id }),
    });

    if (response.ok) {
      router.refresh();
    }
  };

  const handleSuggestBook = async (book: BookSelectionPayload) => {
    const bookData = {
      googleBooksId: book.googleBooksId,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      description: book.description,
      pageCount: book.pageCount,
      publishedDate: book.publishedDate,
      publisher: book.publisher,
      genre: book.genre,
    };

    const response = await fetch(`/api/groups/${group.id}/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookData }),
    });

    if (response.ok) {
      router.refresh();
    } else {
      const errorData = await response.json();
      toast({
        title: 'Erreur',
        description: errorData.message || 'Échec de la suggestion du livre.',
        variant: 'destructive',
      });
      console.error('Error suggesting book:', errorData);
    }
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    const response = await fetch(`/api/groups/${group.id}/suggestions/${suggestionId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      toast({ title: 'Succès', description: 'Suggestion supprimée avec succès.' });
      router.refresh();
    } else {
      const errorData = await response.json();
      toast({
        title: 'Erreur',
        description: errorData.message || 'Échec de la suppression de la suggestion.',
        variant: 'destructive',
      });
      console.error('Error deleting suggestion:', errorData);
    }
  };

  

  const handlePromote = async (memberId: string) => {
    const response = await fetch(`/api/groups/${group.id}/members/${memberId}/promote`, {
      method: 'PATCH',
    });
    if (response.ok) {
      toast({ title: 'Succès', description: "Membre promu modérateur." });
      refetch(); // Use refetch from useGroupDetails to get fresh data
    } else {
      const errorData = await response.json();
      toast({ title: 'Erreur', description: errorData.message || "La promotion a échoué.", variant: 'destructive' });
    }
  };

  const handleRemove = async (memberId: string) => {
    const response = await fetch(`/api/groups/${group.id}/members/${memberId}/remove`, {
      method: 'DELETE',
    });
    if (response.ok) {
      toast({ title: 'Succès', description: "Membre supprimé du groupe." });
      refetch(); // Use refetch
    } else {
      toast({ title: 'Erreur', description: "La suppression a échoué.", variant: 'destructive' });
    }
  };

  const onSubmit = async (values: GroupSettingsFormValues) => {
    const response = await fetch(`/api/groups/${group.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...values, avatar_url: avatarUrl }),
    });

    if (response.ok) {
      toast({ title: 'Succès', description: "Les informations du groupe ont été mises à jour." });
      refetch(); // Use refetch
    } else {
      toast({ title: 'Erreur', description: "La mise à jour a échoué.", variant: 'destructive' });
    }
  };

  const handleViewFinishedBookDetails = (book: GroupBookWithAverageRating) => {
    setSelectedFinishedBook(book);
    setShowFinishedBookDetails(true);
  };

  const handleOpenMemberLibrary = async (member: { id: string; name: string }) => {
    setSelectedMemberLibrary(member);
    setIsMemberLibraryOpen(true);
    setMemberLibraryLoading(true);
    setMemberLibraryError(null);

    try {
      const response = await fetch(`/api/groups/${group.id}/members/${member.id}/library`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de charger la bibliothèque.');
      }
      const data = await response.json();
      setMemberLibraryBooks(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de charger la bibliothèque.';
      setMemberLibraryError(message);
      setMemberLibraryBooks([]);
    } finally {
      setMemberLibraryLoading(false);
    }
  };

  const handleCloseMemberLibrary = (open: boolean) => {
    setIsMemberLibraryOpen(open);
    if (!open) {
      setSelectedMemberLibrary(null);
      setMemberLibraryBooks([]);
      setMemberLibraryError(null);
    }
  };

  const tabItems = [
    { value: 'currently-reading', label: 'Lecture en cours' },
    { value: 'suggestions', label: 'Suggestions' },
    { value: 'polls', label: 'Sondages' },
    { value: 'history', label: 'Historique' },
  ];

  if (isAdmin) {
    tabItems.push({ value: 'settings', label: 'Paramètres' });
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue={tab || 'currently-reading'} className="space-y-6">
            <div className="relative sticky top-4 z-20 -mx-4 rounded-b-md border-b border-border bg-background/90 px-4 pb-2 backdrop-blur-sm transition sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0">
              <div className="overflow-x-auto hide-scrollbar px-6">
                <TabsList className="relative justify-start gap-3 rounded-none bg-transparent px-0 py-2">
                  {tabItems.map(item => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="min-w-[120px] rounded-full bg-muted/40 px-4 py-2 text-sm font-semibold capitalize text-center text-foreground hover:bg-muted/60 focus-visible:ring-2"
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="currently-reading">
              {currentlyReadingBook ? (
                <GroupCurrentReadingBook groupId={group.id} groupBook={currentlyReadingBook} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Lecture en cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Aucun livre en cours de lecture.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="suggestions">
              <Card>
                <CardHeader>
                  <CardTitle>Suggestions de livres</CardTitle>
                  <div className="mt-4">
                    <BookSearchDialog onSelectBook={handleSuggestBook} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suggestedBooks.map(suggestion => (
                      <div
                        key={suggestion.id}
                        className="flex flex-col gap-3 rounded-lg border border-border/80 p-4 shadow-sm transition hover:border-primary/50 sm:flex-row sm:items-center"
                      >
                        <img
                          src={suggestion.book.cover_url || '/file.svg'}
                          alt={suggestion.book.title}
                          className="h-24 w-16 flex-shrink-0 rounded-sm object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                            {suggestion.book.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {suggestion.book.author}
                          </p>
                        </div>
                        {session?.user?.id === suggestion.suggested_by_id && (
                          <Button variant="destructive" size="sm" className="self-start sm:self-auto">
                            Supprimer
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="polls">
              {isAdmin ? (
                <>
                  <PollManagement groupId={group.id} />
                  <div className="mt-8"> {/* Add some spacing */}
                    <PollDisplay groupId={group.id} isAdmin={isAdmin} currentlyReadingGroupBookId={currentlyReadingBook?.id || null} />
                  </div>
                </>
              ) : (
                <PollDisplay groupId={group.id} isAdmin={isAdmin} currentlyReadingGroupBookId={currentlyReadingBook?.id || null} />
              )}
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Historique de lecture</CardTitle>
                </CardHeader>
                <CardContent>
                  {finishedBooks.length > 0 ? (
                    <div className="space-y-4">
                      {finishedBooks.map(book => (
                        <div
                          key={book.id}
                          className="flex flex-col gap-3 rounded-lg border border-border/80 p-4 transition hover:border-primary/50 sm:flex-row sm:items-center sm:gap-4"
                          onClick={() => handleViewFinishedBookDetails(book)}
                        >
                          <img
                            src={book.book.cover_url || '/file.svg'}
                            alt={book.book.title}
                            className="h-24 w-16 flex-shrink-0 rounded-sm object-cover"
                          />
                          <div className="flex flex-1 flex-col gap-1 min-w-0">
                            <h3 className="font-semibold text-lg line-clamp-2">{book.book.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{book.book.author}</p>
                            {book.averageRating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="font-bold">{book.averageRating}</span>
                                {book.voterCount !== undefined && (
                                  <span className="text-xs text-muted-foreground">({book.voterCount} votes)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Aucun livre terminé pour le moment.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
              {isAdmin ? (
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres du groupe</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <GroupAvatarUpload
                        groupId={group.id}
                        groupName={group.name}
                        initialAvatarUrl={avatarUrl}
                        onUpload={setAvatarUrl}
                      />
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom du groupe</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit">Mettre à jour</Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Gérer les demandes d'adhésion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <JoinRequestsManager groupId={group.id} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Gérer les membres</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {group.members.map(member => (
                          <li key={member.user.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MemberAvatar member={member} />
                              <span>{member.user.name}</span>
                              {member.role === 'ADMIN' && <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full">Admin</span>}
                              {member.role === 'MODERATOR' && <span className="text-xs font-semibold text-white bg-green-600 px-2 py-1 rounded-full">Modérateur</span>}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => handlePromote(member.id)}
                                  disabled={member.role === 'ADMIN' || member.role === 'MODERATOR'}
                                >
                                  Promouvoir Modérateur
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemove(member.id)}
                                  disabled={member.user.id === session?.user?.id}
                                >
                                  Supprimer du groupe
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
        <div>
          <div className="flex flex-col items-center space-y-4 mb-8">
            <Avatar className="w-32 h-32">
              <AvatarImage src={groupAvatar || undefined} />
              <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{group.name}</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>À propos de {group.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{group.description}</p>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Membres ({group.memberCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {group.members.map(member => (
                  <li key={member.user.id} className="flex items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <MemberAvatar member={member} />
                      <span className="truncate">{member.user.name}</span>
                      {member.role === 'ADMIN' && <span className="flex-shrink-0 text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full">Admin</span>}
                      {member.role === 'MODERATOR' && <span className="flex-shrink-0 text-xs font-semibold text-white bg-green-600 px-2 py-1 rounded-full">Modérateur</span>}
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="ml-auto shrink-0"
                      onClick={() => handleOpenMemberLibrary({ id: member.user.id, name: member.user.name || 'Membre' })}
                      aria-label={`Voir la bibliothèque de ${member.user.name || 'ce membre'}`}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedFinishedBook && (
        <Sheet open={showFinishedBookDetails} onOpenChange={setShowFinishedBookDetails}>
          <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle>Commentaires du livre</SheetTitle>
              <SheetDescription>
                Commentaires de tous les membres pour "{selectedFinishedBook.book.title}"
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 flex-grow overflow-y-auto">
              <GroupFinishedBookDetails
                groupId={groupId}
                groupBookId={selectedFinishedBook.id}
                bookTitle={selectedFinishedBook.book.title}
                bookAuthor={selectedFinishedBook.book.author}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={isMemberLibraryOpen} onOpenChange={handleCloseMemberLibrary}>
        <SheetContent side="right" className="w-full sm:max-w-lg max-h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bibliothèque</SheetTitle>
            <SheetDescription>
              {selectedMemberLibrary ? `Livres de ${selectedMemberLibrary.name}` : 'Bibliothèque du membre'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {memberLibraryLoading && <p>Chargement de la bibliothèque...</p>}
            {!memberLibraryLoading && memberLibraryError && (
              <p className="text-sm text-destructive">{memberLibraryError}</p>
            )}
            {!memberLibraryLoading && !memberLibraryError && memberLibraryBooks.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun livre visible pour le moment.</p>
            )}
            {!memberLibraryLoading && !memberLibraryError && memberLibraryBooks.length > 0 && (
              <div className="space-y-3">
                {memberLibraryBooks.map((userBook) => (
                  <div key={userBook.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    {userBook.book.cover_url && (
                      <img
                        src={userBook.book.cover_url}
                        alt={userBook.book.title}
                        className="h-16 w-12 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">{userBook.book.title}</p>
                      {userBook.book.author && (
                        <p className="text-xs text-muted-foreground">{userBook.book.author}</p>
                      )}
                      {userBook.book.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{userBook.book.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

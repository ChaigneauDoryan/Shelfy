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
import { useState, useEffect } from "react";
import GroupAvatarUpload from "@/components/GroupAvatarUpload";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Star } from "lucide-react";
import { generateAvatarFromText } from "@/lib/avatar-utils";
import JoinRequestsManager from "@/components/JoinRequestsManager";
import PollManagement from "@/components/PollManagement";
import PollDisplay from "@/components/PollDisplay";
import GroupCurrentReadingBook from "@/components/GroupCurrentReadingBook";
import GroupFinishedBookDetails from "@/components/GroupFinishedBookDetails"; // Import du nouveau composant
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Import des composants Sheet

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
  const [selectedFinishedBook, setSelectedFinishedBook] = useState<any | null>(null);

  let currentlyReadingBook: any | undefined;
  let finishedBooks: any[] = [];
  let suggestedBooks: any[] = [];

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

  currentlyReadingBook = group.books.find((book: any) => book.status === 'CURRENT');
  finishedBooks = group.books
    .filter((book: any) => book.status === 'FINISHED')
    .sort((a: any, b: any) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime());
  suggestedBooks = group.books.filter((book: any) => book.status === 'SUGGESTED');

  const handleSelectBook = async (book: any) => {
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

  const handleSuggestBook = async (book: any) => {
    const bookData = {
      googleBooksId: book.googleBooksId,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      description: book.description,
      page_count: book.page_count,
      published_date: book.published_date,
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

  const handleViewFinishedBookDetails = (book: any) => {
    setSelectedFinishedBook(book);
    setShowFinishedBookDetails(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue={tab || 'currently-reading'}>
            <TabsList>
              <TabsTrigger value="currently-reading">Lecture en cours</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="polls">Sondages</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              {isAdmin && <TabsTrigger value="settings">Paramètres</TabsTrigger>}
            </TabsList>
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
                      <div key={suggestion.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img src={suggestion.book.cover_url || '/file.svg'} alt={suggestion.book.title} className="w-16 h-24 object-cover" />
                          <div>
                            <h3 className="font-semibold">{suggestion.book.title}</h3>
                            <p className="text-sm text-gray-500">{suggestion.book.author}</p>
                            
                          </div>
                        </div>
                        {session?.user?.id === suggestion.suggested_by_id && (
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteSuggestion(suggestion.id)}>
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
                <PollDisplay groupId={group.id} />
              )}
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Historique de lecture</CardTitle>
                </CardHeader>
                <CardContent>
                  {finishedBooks.length > 0 ? (
                    <div className="space-y-4"> {/* Use space-y for vertical spacing */}
                      {finishedBooks.map(book => (
                        <div key={book.id} className="flex items-center space-x-4 p-4 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleViewFinishedBookDetails(book)}>
                          <img src={book.book.cover_url || '/file.svg'} alt={book.book.title} className="w-16 h-24 object-cover rounded-sm shadow-sm flex-shrink-0" />
                          <div className="flex-grow">
                            <h3 className="font-semibold text-lg line-clamp-1">{book.book.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-1">{book.book.author}</p>
                            {book.averageRating && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-bold">{book.averageRating}</span>
                                {book.voterCount !== undefined && (
                                  <span className="text-xs text-gray-500">({book.voterCount} votes)</span>
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
                  <li key={member.user.id} className="flex items-center space-x-2">
                    <MemberAvatar member={member} />
                    <span>{member.user.name}</span>
                    {member.role === 'ADMIN' && <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full">Admin</span>}
                    {member.role === 'MODERATOR' && <span className="text-xs font-semibold text-white bg-green-600 px-2 py-1 rounded-full">Modérateur</span>}
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
    </div>
  );
}
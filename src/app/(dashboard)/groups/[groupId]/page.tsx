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
import { MoreVertical } from "lucide-react";
import { generateAvatarFromText } from "@/lib/avatar-utils";
import JoinRequestsManager from "@/components/JoinRequestsManager";
import PollManagement from "@/components/PollManagement";
import PollDisplay from "@/components/PollDisplay";
import GroupCurrentReadingBook from "@/components/GroupCurrentReadingBook"; // Nouvelle ligne

const groupSettingsSchema = z.object({
  name: z.string().min(2, { message: "Le nom du groupe doit contenir au moins 2 caractères." }),
  description: z.string().max(280, { message: "La description ne peut pas dépasser 280 caractères." }).optional(),
});

type GroupSettingsFormValues = z.infer<typeof groupSettingsSchema>;

import { useGroupDetails } from '@/hooks/useGroupDetails'; // Nouvelle importation

// Supprimer l'interface GroupDetailsPageProps car les données viennent du hook

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

export default function GroupDetailsPage() { // Modification des props
  const params = useParams<{ groupId: string }>();
  const { groupId } = params;

  const { data: group, isLoading, error, refetch } = useGroupDetails(groupId); // Utilisation du hook
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Initialisation à null
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);

  let currentlyReadingBook: Book | undefined;
  let finishedBooks: Book[] = [];
  let suggestedBooks: Book[] = [];

  useEffect(() => {
    if (group) { // Mettre à jour les états locaux une fois les données chargées
      setAvatarUrl(group.avatar_url);
      if (group.avatar_url) {
        setGroupAvatar(group.avatar_url);
      } else {
        setGroupAvatar(generateAvatarFromText(group.name, 200));
      }
    }
  }, [group]); // Dépendance au groupe

  const form = useForm<GroupSettingsFormValues>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      name: group?.name || "", // Provide default empty string if group.name is undefined
      description: group?.description || "", // Provide default empty string if group.description is undefined
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

  // Assign values after group is confirmed to be available
  currentlyReadingBook = group.books.find(book => String(book.status).trim() === 'CURRENTLY_READING');
  finishedBooks = group.books.filter(book => book.status === 'FINISHED');
  suggestedBooks = group.books.filter(book => book.status === 'SUGGESTED');

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
      toast({ title: 'Succès', description: "Membre promu administrateur." });
      router.refresh();
    } else {
      toast({ title: 'Erreur', description: "La promotion a échoué.", variant: 'destructive' });
    }
  };

  const handleRemove = async (memberId: string) => {
    const response = await fetch(`/api/groups/${group.id}/members/${memberId}/remove`, {
      method: 'DELETE',
    });
    if (response.ok) {
      toast({ title: 'Succès', description: "Membre supprimé du groupe." });
      router.refresh();
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
      router.refresh();
    } else {
      toast({ title: 'Erreur', description: "La mise à jour a échoué.", variant: 'destructive' });
    }
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
                    <ul className="space-y-4">
                      {finishedBooks.map(book => (
                        <li key={book.book.id} className="flex items-center space-x-4">
                          <img src={book.book.cover_url || ''} alt={book.book.title} className="w-16 h-24 object-cover" />
                          <div>
                            <h3 className="font-semibold">{book.book.title}</h3>
                            <p className="text-sm text-gray-500">{book.book.author}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
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
                                  disabled={member.role === 'ADMIN'}
                                >
                                  Promouvoir Admin
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
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
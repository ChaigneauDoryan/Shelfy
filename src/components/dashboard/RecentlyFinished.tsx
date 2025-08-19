import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  page_count: number;
};

// Type corrigé pour correspondre aux données de getUserBooks
type UserBook = {
  id: string;
  status_id: number;
  rating?: number;
  started_at?: string;
  finished_at?: string;
  current_page: number;
  is_archived: boolean;
  book: Book;
};

interface RecentlyFinishedProps {
  books: UserBook[];
}

export function RecentlyFinished({ books }: RecentlyFinishedProps) {
  if (books.length === 0) {
    return null; // Do not display the section if there are no finished books
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Derniers Livres Terminés</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.map((userBook) => {
          // Récupérer le premier livre de l'array
          const bookData = userBook.book;
          if (!bookData) return null;
          const progress =
            bookData.page_count > 0
              ? Math.round((userBook.current_page / bookData.page_count) * 100)
              : 0;

          return (
            <Link href={`/library/${userBook.id}`} key={userBook.id}>
              <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  {bookData.cover_url ? (
                      <Image
                        src={bookData.cover_url}
                        alt={`Couverture de ${bookData.title}`}
                        width={80}
                        height={120}
                        className="rounded-md object-cover"
                      />
                    ) : null}
                  <p className="font-semibold text-md flex-grow truncate w-full">{bookData.title}</p>
                  <p className="text-sm text-gray-500 truncate w-full">{bookData.author}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-right text-sm text-gray-600 mt-1">
                    {progress}%
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Terminé le {userBook.finished_at ? format(new Date(userBook.finished_at), 'd MMMM yyyy', { locale: fr }) : "inconnu"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function RecentlyFinishedSkeleton() {
    return (
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 h-8 w-1/3 bg-gray-200 rounded animate-pulse"></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-full flex flex-col">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-[100px] h-[150px] bg-gray-200 rounded-md animate-pulse mb-4"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
}
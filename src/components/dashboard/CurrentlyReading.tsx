import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  page_count: number;
};

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

interface CurrentlyReadingProps {
  books: UserBook[];
}

export function CurrentlyReading({ books }: CurrentlyReadingProps) {
  if (!books || books.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Mes Lectures en Cours
        </h2>
        <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            Vous n'avez aucune lecture en cours pour le moment.
          </p>
          <Link href="/library/add-book">
            <button className="mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300">
              Ajouter un livre
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Mes Lectures en Cours
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((userBook) => {
          const bookData = userBook.book;
          const progress =
            bookData.page_count > 0
              ? Math.round((userBook.current_page / bookData.page_count) * 100)
              : 0;

          return (
            <Link href={`/library/${userBook.id}`} key={userBook.id}>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="truncate">{bookData.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      {bookData.cover_url ? (
                        <Image
                          src={bookData.cover_url}
                          alt={`Couverture de ${bookData.title}`}
                          width={80}
                          height={120}
                          className="rounded-md object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="w-2/3">
                      <p className="text-sm text-gray-500 mb-2 truncate">
                        {bookData.author}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-sm text-gray-600 mt-1">
                        {progress}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CurrentlyReadingSkeleton() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 h-8 w-1/3 bg-gray-200 rounded animate-pulse"></h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-1/3">
                  <div className="w-full h-28 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
                <div className="w-2/3 space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-2.5 w-full bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse ml-auto"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

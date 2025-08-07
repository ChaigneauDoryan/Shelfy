
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BookService {
  constructor(private httpService: HttpService) {}

  searchBooks(query: string): Observable<any> {
    const googleBooksApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    return this.httpService.get(googleBooksApiUrl).pipe(
      map((response: AxiosResponse) => response.data.items || [])
    );
  }
}

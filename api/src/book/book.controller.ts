
import { Controller, Get, Query } from '@nestjs/common';
import { BookService } from './book.service';
import { Observable } from 'rxjs';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get('search')
  searchBooks(@Query('q') query: string): Observable<any> {
    return this.bookService.searchBooks(query);
  }
}

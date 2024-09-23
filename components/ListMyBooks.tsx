import * as React from "react";
import BookCard from "./ui/flipcard";
import PaginationControls from "./PaginationControls";
import { SearchParams } from "@/app/[locale]/home/books/page";
import { IBook, IBookBase } from "@/Models/book-model";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IMember } from "@/Models/member.model";

export interface ListMyBooksProps {
  searchParams: SearchParams;
  role: string | undefined;
  items: IBook[];
  user: IMember;
  genres: string[];
  likedBooks: number[];
}

export const ListMyBooks: React.FC<ListMyBooksProps> = async ({
  searchParams,
  role,
  items,
  user,
  genres,
  likedBooks,
}) => {
  const page = parseInt(searchParams["page"] ?? "1");
  const perPage = parseInt(searchParams["per_page"] ?? "8");
  const sortBy = (searchParams["sortBy"] as keyof IBookBase) ?? "title";
  const sortOrder = searchParams["sortOrder"] ?? "asc";
  const searchTerm = searchParams["searchTerm"] ?? "";
  const genreFilter = searchParams["genre"] ?? "all";

  // Sort books
  const sortedItems = [...items].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Filter books
  const filteredItems = sortedItems.filter(
    (book) =>
      (genreFilter === "all" || book.genre === genreFilter) &&
      (book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.genre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate start and end indices for pagination
  const start = (page - 1) * perPage;
  const end = start + perPage;

  // Slice items array to get the current page's items
  const entries: IBookBase[] = filteredItems.slice(start, end);

  // Fetch bookIds for the current entries

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">My Books</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search, Sort, Filter Form */}
        <form className="mb-6 space-y-4 md:space-y-0 justify-end md:flex md:flex-wrap md:items-end md:gap-4">
          <div className="flex flex-wrap items-center  gap-2">
            <Select name="sortBy" defaultValue={sortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="publisher">Publisher</SelectItem>
                <SelectItem value="genre">Genre</SelectItem>
              </SelectContent>
            </Select>
            <Select name="sortOrder" defaultValue={sortOrder}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
            <Select name="genre" defaultValue={genreFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by genre" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Apply
          </Button>
        </form>

        {/* Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {items.map((book) => (
            <BookCard
              key={book.isbnNo}
              data={{
                book,
                userId: user.id,
                role: role,
                isLiked: likedBooks.includes(book.id),
              }}
            />
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            No books found matching your search criteria.
          </p>
        )}
        <div className="mt-8 flex justify-center">
          <PaginationControls
            hasNextPage={end < filteredItems.length}
            hasPrevPage={start > 0}
            totalPages={Math.ceil(filteredItems.length / perPage)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

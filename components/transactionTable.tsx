"use client";
import * as React from "react";
import { ITransaction } from "@/Models/transaction.model";
import { Badge } from "@/components/ui/badge";
import { IMember } from "@/Models/member.model";
import { returnBook } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, BookOpenIcon, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PaginationControls from "./PaginationControls";
import { AprroveButton, RejectButton } from "./ui/buttons";

interface MyTransactionsTableProps {
  searchParams: any;
  pagination: { limit: number; offset: number; total: number };
  transactions: ITransaction[];
  user: IMember;
}

const TransactionsTable = async ({
  searchParams,
  pagination,
  transactions,
}: MyTransactionsTableProps) => {
  const sortColumn =
    (searchParams.sortColumn as keyof ITransaction) || "issueDate";
  const sortOrder = searchParams.sortOrder === "desc" ? "desc" : "asc";
  // Fetch the current user based on email
  const page = parseInt(searchParams["page"] ?? "1");
  const perPage = parseInt(searchParams["per_page"] ?? "8");

  // Server-side filtering based on searchParams
  const filteredTransactions = transactions.filter((transaction) => {
    const searchTerm = (searchParams.search || "").toLowerCase();
    const statusFilter = searchParams.status || "all";

    const matchesSearch =
      String(transaction.bookId).toLowerCase().includes(searchTerm) ||
      new Date(transaction.issueDate)
        .toLocaleDateString()
        .toLowerCase()
        .includes(searchTerm) ||
      new Date(transaction.dueDate)
        .toLocaleDateString()
        .toLowerCase()
        .includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || transaction.Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const start = (page - 1) * perPage;
  const end = start + perPage;

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">
          Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6">
          <Select name="sortColumn" defaultValue={sortColumn}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bookId">BookId</SelectItem>
              <SelectItem value="memberId">MemberId</SelectItem>
              <SelectItem value="issueDate">IssueDate</SelectItem>
              <SelectItem value="dueDate">DueDate</SelectItem>
            </SelectContent>
          </Select>
          {/* <Select name="sortColumn" defaultValue={sortColumn}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              
            </SelectContent>
          </Select> */}
          <Select name="sortOrder" defaultValue={sortOrder}>
            <SelectTrigger className="w-full sm:w-[100px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
          {/* <Select name="status" defaultValue={searchParams.status || "all"}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Issued">Issued</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
            </SelectContent>
          </Select> */}
          <Button type="submit" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </form>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Book ID</TableHead>
                <TableHead className="w-[100px]">User ID</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction: ITransaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.bookId}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.memberId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {transaction.issueDate.split(",")[1]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {transaction.dueDate.split(",")[1]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.Status === "Issued"
                            ? "default"
                            : "secondary"
                        }
                        className="font-semibold"
                      >
                        {transaction.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.Status === "Issued" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Return Book
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirm Book Return
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to return this book? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant="default"
                                  onClick={async () => {
                                    await returnBook(transaction.id);
                                  }}
                                >
                                  Confirm Return
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {transaction.Status === "Pending" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <AprroveButton
                                data={{
                                  id: transaction.id,
                                  Status: "Issued",
                                }}
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <RejectButton id={transaction.id} />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <BookOpenIcon className="h-12 w-12 mb-2" />
                      <p className="text-lg font-medium">
                        No transactions found
                      </p>
                      <p className="text-sm text-gray-500">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center">
          <PaginationControls
            hasNextPage={end < pagination.total}
            hasPrevPage={start > 0}
            totalPages={Math.ceil(pagination.total / perPage)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;

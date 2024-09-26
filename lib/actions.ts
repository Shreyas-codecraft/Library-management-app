"use server";

import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { Members } from "@/drizzle/schema";
import { eq } from "drizzle-orm/expressions";
import { MemberRepository } from "@/Repositories/member.repository";
import { IMember, IMemberBase } from "@/Models/member.model";
import { RequestRepository } from "@/Repositories/request.repository";
import { TransactionRepository } from "@/Repositories/transaction.repository";
import { revalidatePath } from "next/cache";
import "@/drizzle/envConfig";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "../drizzle/schema";
import cloudinary from "@/cloudinary.config";
import { ITransactionBase } from "@/Models/transaction.model";
import { Action } from "@radix-ui/react-toast";
import { WishlistRepository } from "@/Repositories/WishlistRepository";
import { DueBook } from "@/components/TodaysDues";
import { RatingsRepository } from "@/Repositories/rating.repository";
import { BookRepository } from "@/Repositories/book-repository";
import { IBook } from "@/Models/book-model";
import { IProfessorBase } from "@/Models/professor.model";
import { ProfessorRepository } from "@/Repositories/Professor-repository";
import { IPageRequest } from "@/core/pagination";
import { ProfessorSortOptions, SortOptions } from "./data";
import { Appenv } from "@/read-env";

const db = drizzle(sql, { schema });
const CALENDLY_API_TOKEN = process.env.NEXT_PUBLIC_CALENDLY_API_TOKEN;

const bookRepository = new BookRepository(db);
const requestRepository = new RequestRepository(db);
const transactionRepository = new TransactionRepository(db);
const memberRepository = new MemberRepository(db);
const wishlistRepository = new WishlistRepository(db);
const ratingsRepository = new RatingsRepository(db);
const professorsRepository = new ProfessorRepository(db);

export const create = new MemberRepository(db).create;

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function authenticateLogout(
  _state: void | undefined,
  _formData: FormData
): Promise<void> {
  try {
    await signOut({ redirectTo: "/login", redirect: true });
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}

export async function handleApprove(data: { id: number; Status: string }) {
  // await db
  //   .update(Requests)
  //   .set({
  //     status: "Approved",
  //   })
  //   .where(eq(Requests.id, data.id));
  const transaction = await transactionRepository.handleBookRequest(
    data.Status,
    {} as ITransactionBase,
    data.id
  );
  revalidatePath("/admin/transaction");
  return transaction;
}

export async function handleReject(id: any) {
  const transaction = await transactionRepository.handleBookRequest(
    "Rejected",
    {} as ITransactionBase,
    id
  );
  revalidatePath("/admin/transaction");
  return transaction;
}

export async function createMember(data: IMemberBase): Promise<IMember | null> {
  console.log(data);

  try {
    const [result] = await db
      .insert(Members)
      .values({
        ...data,
      })
      .returning({ id: Members.id }); // Use returning() to return the inserted 'id'
    const [member]: IMember[] = await db
      .select()
      .from(Members)
      .where(eq(Members.id, result.id));
    return member;
  } catch (err) {
    throw err;
  }
}

export const authenticateGoogleSignin = async (
  email: string,
  refreshToken: string
) => {
  try {
    // Check if the user exists in database
    let user: IMember | null = (await memberRepository.getByEmail(email))!;
    console.log(user);
    if (!user) {
      return null;
    } else {
      return { id: user.id, role: user.role };
    }
  } catch (error) {
    if (error instanceof Error) throw error;
  }
};

function formDataToObject(formData: any) {
  const obj: { [key: string]: any } = {};

  // Access the existing Symbol in the formData object
  const symbolState = Object.getOwnPropertySymbols(formData).find(
    (sym) => sym.toString() === "Symbol(state)"
  );

  if (symbolState) {
    for (const { name, value } of formData[symbolState]) {
      obj[name] = value;
    }
  }
  return obj;
}

export const editProfile = async (
  prevState: void | undefined,
  formData: FormData
) => {
  try {
    const session = await auth();
    const user = await memberRepository.getByEmail(
      session?.user.email as string
    );
    const data = formDataToObject(formData);
    (await memberRepository.update(user?.id!, data))!;
    revalidatePath("/home/profile");
  } catch (error) {
    if (error instanceof Error) throw error;
  }
};

export async function uploadImage(file: File) {
  if (!file) return { imageURL: "" };

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "book_covers" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const reader = file.stream().getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          uploadStream.end();
        } else {
          uploadStream.write(value);
          pump();
        }
      };
      pump();
    });

    if (result && typeof result === "object" && "secure_url" in result) {
      return { imageURL: result.secure_url as string };
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    return { error: "Failed to upload image. Please try again." };
  }

  return { imageURL: "" };
}

export async function cancelBookRequest(transactionId: number): Promise<void> {
  await transactionRepository.handleBookRequest(
    "Cancelled",
    {} as ITransactionBase,
    transactionId
  );
  revalidatePath("/home/mytransaction");
}

export async function hasUserLikedBook(bookId: number, userId: number) {
  const result = await wishlistRepository.hasUserLikedBook(bookId, userId);
  return result;
}

export async function getWishListByMemberId(userId: number) {
  const result: {
    bookId: number;
  }[] = await wishlistRepository.getByMemberId(userId);
  return result.map((obj) => obj.bookId);
}

export async function addWishList(bookId: number, memberId: number) {
  await wishlistRepository.create({ bookId, memberId });
}

export async function removeWishList(bookId: number, memberId: number) {
  await wishlistRepository.removeWishList(bookId, memberId);
}

export async function todaysDues() {
  const dues: DueBook[] =
    await transactionRepository.getTodaysDueTransactions();
  return dues;
}

export async function rateBook(
  rating: number,
  bookId: number,
  memberId: number,
  review: string = ""
) {
  await ratingsRepository.create({
    bookId: bookId,
    memberId: memberId,
    rating: rating,
    review: review,
  });
}

export async function getMeanRating(bookId: number) {
  const meanRating: number | null =
    await ratingsRepository.getMeanRatingByBookId(bookId);
  return meanRating!;
}

export async function updateRating(bookId: number, meanRating: number) {
  const book: IBook | null = await bookRepository.getById(bookId);
  await bookRepository.update(bookId, {
    rating: meanRating,
    author: book!.author,
    genre: book!.genre,
    image_url: book!.image_url,
    isbnNo: book!.isbnNo,
    numOfPages: book!.numOfPages,
    price: book!.price,
    publisher: book!.publisher,
    title: book!.title,
    totalNumOfCopies: book!.totalNumOfCopies,
  });
}

export async function addProfessor(data: IProfessorBase) {
  const professor = await professorsRepository.create(data);
  return professor;
}

export async function fetchProfessors(
  pageRequest: IPageRequest
  // sortOptions: ProfessorSortOptions
) {
  const data = await professorsRepository.list(pageRequest);
  return data;
}

export async function fetchProfessorById(id: number) {
  const professor = await professorsRepository.getById(id);
  return professor;
}

export async function getOrganizationUri() {
  try {
    const response = await fetch("https://api.calendly.com/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CALENDLY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching user info: ${response.statusText}`);
    }

    const data = await response.json();
    return data.resource.current_organization;
  } catch (error) {
    console.error("Error fetching organization URI", error);
    throw error;
  }
}

export async function getUserUri() {
  try {
    const response = await fetch("https://api.calendly.com/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CALENDLY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Error fetching user info: ${response.statusText}`);
    }

    const data = await response.json();
    return data.resource.uri; // This is the user's URI
  } catch (error) {
    console.error("Error fetching user URI", error);
    throw error;
  }
}

export async function getUsersAppointments(email: string) {
  try {
    const userUri = await getOrganizationUri();
    console.log(userUri);
    console.log(email);
    const url = `https://api.calendly.com/scheduled_events?organization=${userUri}&invitee_email=${email}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CALENDLY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching user info: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data);
    return data.collection;
  } catch (error) {
    console.error("Error fetching user URI", error);
    throw error;
  }
}

// Fetch scheduled events for the user
export async function getScheduledEvents() {
  const userUri = await getUserUri(); // Get the logged-in user's URI
  try {
    const response = await fetch(
      `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(
        userUri
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CALENDLY_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error fetching scheduled events:", errorText);
      throw new Error(`Error fetching Calendly events: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Scheduled events:", data);
    return data.collection; // Return an array of scheduled events
  } catch (error) {
    console.error("Error fetching scheduled events", error);
    throw error;
  }
}

const getRole = async () => {
  const session = await auth();
  const role = session?.user.role!;
  return role;
};

export async function updateProfessor(id: number, data: IProfessorBase) {
  const role = await getRole();
  if (role === "admin") {
    const professor = await professorsRepository.update(id, data);
  }
}

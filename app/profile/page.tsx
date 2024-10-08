import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, BookMarked } from "lucide-react";
import { auth } from "@/auth";
import { booksRead, CurrentlyReading, fetchMemberByEmail } from "@/lib/data";
import EditProfile from "@/components/EditProfile";
import { getTranslations } from "next-intl/server";

async function getUserData() {
  const session = await auth();
  const member = await fetchMemberByEmail(session?.user?.email as string);
  return {
    name: session?.user?.name,
    email: session?.user?.email,
    avatar: session?.user.image,
    memberSince: "January 2023", // Consider localizing this
    booksRead: await booksRead(session?.user?.email!),
    currentlyReading: await CurrentlyReading(session?.user?.email!),
    ...member,
  };
}

type ProfilePageProps = {
  params: { tab: string; locale: string };
};
export default async function ProfilePage({
  params: { tab, locale },
}: ProfilePageProps) {
  const user = await getUserData();
  const activeTab = tab || "profile";
  const t = await getTranslations({ locale, namespace: "Profile" }); // Fetch translations

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <div className="flex flex-1">
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === "profile" && <ProfileContent user={user} t={t} />}
          </div>
        </main>
      </div>
    </div>
  );
}

async function ProfileContent({ user, t }: { user: any; t: any }) {
  const session = await auth();
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:flex">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2f8d46]">
          {t("profileHeader")}
        </h1>
        <div className="flex-shrink-0 mt-4 md:mt-0">
          <EditProfile user={user} />
        </div>
      </div>
      <Card className="bg-[#F0FDF4] shadow-lg rounded-lg overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-[#2f8d46]">
              <AvatarImage src={user.avatar!} alt={user.name!} />
              <AvatarFallback className="bg-[#e8f5e9] text-[#2f8d46]">
                {user.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#333]">
                {user.name}
              </h2>
              <div className="text-[#666]">
                {session?.user.role === "admin"
                  ? t("adminRole")
                  : t("memberRole")}
              </div>
              <p className="text-[#666]">{user.email}</p>
              <p className="text-sm text-[#888] mt-1">
                {t("memberSince", { date: user.memberSince })}{" "}
                {/* Localize member since */}
              </p>
            </div>
          </div>
          <Separator className="my-6 bg-[#e0e0e0]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-4 bg-[#e8f5e9] p-4 rounded-lg">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-[#2f8d46]" />
              <div>
                <p className="text-sm sm:text-base text-[#666]">
                  {t("booksRead")}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-[#2f8d46]">
                  {user.booksRead}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-[#e8f5e9] p-4 rounded-lg">
              <BookMarked className="h-6 w-6 sm:h-8 sm:w-8 text-[#2f8d46]" />
              <div>
                <p className="text-sm sm:text-base text-[#666]">
                  {t("currentlyReading")}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-[#2f8d46]">
                  {user.currentlyReading}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

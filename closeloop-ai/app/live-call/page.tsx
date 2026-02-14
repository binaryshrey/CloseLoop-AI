import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileMenu from "@/components/profile-menu";
import LiveCallMonitor from "@/components/live-call-monitor";

export default async function LiveCallPage() {
  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  // You can get phone number from query params or database
  const phoneNumber = "+18457570323"; // Replace with actual phone number

  return (
    <div className="relative z-10 min-h-screen bg-black">
      {/* Header */}
      <div className="px-6 pt-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <Image
              src="/logodark.svg"
              alt="CloseLoop AI Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-2xl font-bold text-white">CloseLoop AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/onboard"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to Campaign
            </Link>
            <ProfileMenu user={user} />
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Live Call Monitor
          </h1>
          <p className="text-gray-400">
            Real-time sales call with AI analysis and confidence scoring
          </p>
        </div>

        <LiveCallMonitor phoneNumber={phoneNumber} />
      </div>
    </div>
  );
}

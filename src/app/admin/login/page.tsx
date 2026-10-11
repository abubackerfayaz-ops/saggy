import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { ADMIN_COOKIE, adminEnabled, isValidSessionToken } from "@/lib/adminAuth";
import LoginForm from "@/components/admin/LoginForm";
import logo from "@/assets/saggy-logo.webp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Login · SAGGY",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (!adminEnabled()) {
    return (
      <Shell
        title="Admin Locked"
        subtitle="Set the ADMIN_PASSWORD environment variable in your hosting dashboard to enable the orders dashboard."
      />
    );
  }

  const cookieStore = await cookies();
  if (isValidSessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  return (
    <Shell title="Admin Login" subtitle="Enter the admin password to view customer orders.">
      <LoginForm />
    </Shell>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-body flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl p-7 shadow-2xl">
        <div className="flex flex-col items-center mb-5">
          <div className="h-9 w-[130px] relative mb-3">
            <Image
              src={logo}
              alt="SAGGY"
              fill
              unoptimized
              sizes="130px"
              className="object-contain mix-blend-screen"
            />
          </div>
          <h1 className="font-heading text-2xl text-white uppercase tracking-wide">{title}</h1>
          <p className="text-xs text-neutral-500 text-center mt-1.5 leading-relaxed">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

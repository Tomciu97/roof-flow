import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const instant = false;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen rf-grain">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
        <Link
          href="/"
          className="mb-8 text-center font-display text-3xl font-semibold"
        >
          {APP_NAME}
        </Link>
        {children}
      </div>
    </div>
  );
}

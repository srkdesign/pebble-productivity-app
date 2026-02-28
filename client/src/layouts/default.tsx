import { Link } from "@heroui/link";

import { Navbar } from "@/template/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="">{children}</div>;
}

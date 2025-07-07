import { checkUser } from "@/lib/checkUser";
import React from "react";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkUser();
  return <div>{children}</div>;
}

import { notFound, redirect } from "next/navigation";
import { hasLocale } from "./dictionaries";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  // Demo: land visitors on the Golf Assistant instead of the Tip Calculator.
  // To restore the old home page, remove this redirect and bring back the
  // previous render (see git history / app/ui/tip-calculator.tsx).
  redirect(`/${lang}/ask`);
}

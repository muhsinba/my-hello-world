import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import SignupForm from "@/app/ui/signup-form";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <SignupForm lang={lang} dict={dict.signup} />;
}

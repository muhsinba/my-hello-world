import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import LoginForm from "@/app/ui/login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <LoginForm lang={lang} dict={dict.login} errors={dict.errors} />;
}

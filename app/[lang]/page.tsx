import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/app/lib/dal";
import { logout } from "@/app/actions/auth";
import TipCalculator from "@/app/ui/tip-calculator";
import LanguageSwitcher from "@/app/ui/language-switcher";
import { getDictionary, hasLocale } from "./dictionaries";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const user = await getUser();

  return (
    <div className="MainContainer">
      <header className="app-header">
        {user ? (
          <div className="auth-status">
            <span>{dict.header.greeting.replace("{name}", user.name)}</span>
            <form action={logout}>
              <button type="submit" className="link-button">
                {dict.header.logOut}
              </button>
            </form>
          </div>
        ) : (
          <nav className="auth-links">
            <Link href={`/${lang}/login`}>{dict.header.logIn}</Link>
            <Link href={`/${lang}/signup`}>{dict.header.signUp}</Link>
          </nav>
        )}
        <LanguageSwitcher currentLang={lang} dict={dict.language} />
      </header>

      <h1 className="title">{dict.home.title}</h1>
      <TipCalculator dict={dict.tipCalculator} />
    </div>
  );
}

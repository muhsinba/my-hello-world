import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import GolfChatWidget from "@/app/ui/golf-chat-widget";

export default async function AskPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="MainContainer ask-page">
      <GolfChatWidget lang={lang} dict={dict.ask} />
    </div>
  );
}

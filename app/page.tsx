import Link from "next/link";
import { getUser } from "@/app/lib/dal";
import { logout } from "@/app/actions/auth";
import TipCalculator from "@/app/ui/tip-calculator";

export default async function Home() {
  const user = await getUser();

  return (
    <div className="MainContainer">
      <header className="app-header">
        {user ? (
          <div className="auth-status">
            <span>Hi, {user.name}</span>
            <form action={logout}>
              <button type="submit" className="link-button">Log out</button>
            </form>
          </div>
        ) : (
          <nav className="auth-links">
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </nav>
        )}
      </header>

      <h1 className="title">MS Partners Services: Tip Calculator</h1>
      <TipCalculator />
    </div>
  );
}

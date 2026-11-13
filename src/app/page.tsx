import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { getAuthenticatedUser } from "@/lib/auth";

export default function Home() {
  return (
    <Suspense fallback={<LoginScreen />}>
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  const user = await getAuthenticatedUser();
  return user ? <Dashboard /> : <LoginScreen />;
}

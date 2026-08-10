import { redirect } from "next/navigation";

// The old AI accounts page now lives inside the unified profile.
export default function AccountsRedirect() {
  redirect("/app/profile#connections");
}

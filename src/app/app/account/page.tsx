import { redirect } from "next/navigation";

// The old Subscription & account page now lives inside the unified profile.
export default function AccountRedirect() {
  redirect("/app/profile#subscription");
}

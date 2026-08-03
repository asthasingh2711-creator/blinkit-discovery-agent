import { redirect } from "next/navigation";

/** Lab UI removed — Household Memory is invisible infrastructure on checkout. */
export default function HouseholdRedirectPage() {
  redirect("/cart");
}

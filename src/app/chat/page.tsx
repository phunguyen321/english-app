import { redirect } from "next/navigation";

// Legacy chat page removed: redirect to home. Chat is now available via the floating widget.
export default function Page() {
  redirect("/");
}

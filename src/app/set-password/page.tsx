import { Suspense } from "react";
import SetPasswordPage from "../components/SetPasswordPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>⏳ Loading page...</div>}>
      <SetPasswordPage />
    </Suspense>
  );
}

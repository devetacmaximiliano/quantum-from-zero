import Platform from "@/components/platform";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, color: "#bbdbaa" }}>
          Preparing your quantum workspace…
        </div>
      }
    >
      <Platform />
    </Suspense>
  );
}

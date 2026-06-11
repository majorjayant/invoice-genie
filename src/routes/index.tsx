import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GST Tax Invoice Generator" },
      { name: "description", content: "Free GST-compliant Tax Invoice generator. Inline edit, auto-calculate CGST/SGST, print or download as PDF." },
      { property: "og:title", content: "GST Tax Invoice Generator" },
      { property: "og:description", content: "Generate clean GST-compliant tax invoices instantly in your browser." },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("./app.html");
  }, []);
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      Loading invoice generator…
    </div>
  );
}

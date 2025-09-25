import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import ZKProofGenerator from "./ZKProofGenerator.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZKProofGenerator />
  </StrictMode>
);

import React, { useState, useRef } from "react";
import * as snarkjs from "snarkjs";
import "./App.css";

interface ProofResult {
  proof: any;
  publicSignals: any;
}

const ZKProofGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [error, setError] = useState<string>("");
  const [input, setInput] = useState('{"a": "1", "b": "2"}');

  const wasmFileRef = useRef<HTMLInputElement>(null);
  const zkeyFileRef = useRef<HTMLInputElement>(null);
  const verKeyFileRef = useRef<HTMLInputElement>(null);

  const generateProof = async () => {
    try {
      setIsGenerating(true);
      setError("");
      setProofResult(null);

      // Get files from input
      const wasmFile = wasmFileRef.current?.files?.[0];
      const zkeyFile = zkeyFileRef.current?.files?.[0];

      if (!wasmFile || !zkeyFile) {
        throw new Error("Please select both WASM and ZKEY files");
      }

      // Parse the input
      let proofInput;
      try {
        proofInput = JSON.parse(input);
      } catch (e) {
        throw new Error("Invalid JSON input");
      }

      // Convert files to ArrayBuffer
      const wasmBuffer = await wasmFile.arrayBuffer();
      const zkeyBuffer = await zkeyFile.arrayBuffer();

      // Generate the proof
      console.log("Generating proof with input:", proofInput);
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        proofInput,
        new Uint8Array(wasmBuffer),
        new Uint8Array(zkeyBuffer)
      );

      setProofResult({ proof, publicSignals });
      console.log("Proof generated successfully:", { proof, publicSignals });
    } catch (err) {
      console.error("Error generating proof:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyProof = async () => {
    if (!proofResult) return;

    try {
      const vkeyFile = verKeyFileRef.current?.files?.[0];
      console.log("Verification key vkey.json", vkeyFile);
      if (!vkeyFile) {
        alert("Please select a verification key file");
        return;
      }

      // Read the verification key as text and parse as JSON
      const vkeyText = await vkeyFile.text();
      const vkey = JSON.parse(vkeyText);

      const res = await snarkjs.groth16.verify(
        vkey,
        proofResult.publicSignals,
        proofResult.proof
      );

      console.log("Verification result:", res);
      alert(res ? "Proof is valid!" : "Proof is invalid!");
    } catch (err) {
      console.error("Verification error:", err);
      alert(
        `Verification failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>ZK Proof Generator</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>Upload Circuit Files</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>
            WASM file (.wasm):
            <input
              type="file"
              ref={wasmFileRef}
              accept=".wasm"
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            ZKEY file (.zkey):
            <input
              type="file"
              ref={zkeyFileRef}
              accept=".zkey"
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Verification key (.json):
            <input
              type="file"
              ref={verKeyFileRef}
              accept=".json"
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Proof Input (JSON)</h3>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"a": "1", "b": "2"}'
          rows={4}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={generateProof}
          disabled={isGenerating}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isGenerating ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            marginRight: "10px",
          }}
        >
          {isGenerating ? "Generating..." : "Generate Proof"}
        </button>

        {proofResult && (
          <button
            onClick={verifyProof}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Verify Proof
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          Error: {error}
        </div>
      )}

      {proofResult && (
        <div style={{ marginTop: "20px" }}>
          <h3>Generated Proof</h3>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <h4>Proof:</h4>
            <pre style={{ fontSize: "12px", overflow: "auto" }}>
              {JSON.stringify(proofResult.proof, null, 2)}
            </pre>

            <h4>Public Signals:</h4>
            <pre style={{ fontSize: "12px", overflow: "auto" }}>
              {JSON.stringify(proofResult.publicSignals, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZKProofGenerator;

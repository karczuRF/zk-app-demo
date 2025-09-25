import { useState } from "react";
import "./App.css";
import { Button, Input, TextField } from "@mui/material";
import * as snarkjs from "snarkjs";

const makeProof = async (_proofInput: any, _wasm: string, _zkey: string) => {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    _proofInput,
    _wasm,
    _zkey
  );
  return { proof, publicSignals };
};

const verifyProof = async (
  _verificationkey: string,
  signals: any,
  proof: any
) => {
  const vkey = await fetch(_verificationkey).then(function (res) {
    return res.json();
  });

  const res = await snarkjs.groth16.verify(vkey, signals, proof);
  return res;
};

function App() {
  const [a, setA] = useState("3");
  const [b, setB] = useState("11");

  const [proof, setProof] = useState("");
  const [signals, setSignals] = useState("");
  const [isValid, setIsValid] = useState(false);

  const wasmFile = "http://localhost:5173/circuit.wasm";
  const zkeyFile = "http://localhost:5173/circuit_final.zkey";
  const verificationKey = "http://localhost:5173/verification_key.json";

  const runProofs = () => {
    console.log(b.length);
    if (a.length == 0 || b.length == 0) {
      return;
    }
    const proofInput = { a, b };
    console.log(proofInput);

    makeProof(proofInput, wasmFile, zkeyFile).then(
      ({ proof: _proof, publicSignals: _signals }) => {
        setProof(JSON.stringify(_proof, null, 2));
        setSignals(JSON.stringify(_signals, null, 2));
        verifyProof(verificationKey, _signals, _proof).then((_isValid) => {
          setIsValid(_isValid);
        });
      }
    );
  };

  const changeA = (e) => {
    setA(e.target.value);
  };

  const changeB = (e) => {
    setB(e.target.value);
  };

  return (
    <div>
      <header className="App-header">
        <TextField>
          The underlying circuit is from the{" "}
          <a href="https://github.com/iden3/snarkjs">snarkjs readme</a>
        </TextField>
        <pre>Witness Inputs</pre>
        <pre>Input A</pre>
        <Input
          type="text"
          required={true}
          value={a}
          onChange={changeA}
          placeholder="e.g. 3"
        />
        <pre>Input B</pre>
        <Input
          type="text"
          required={true}
          value={b}
          onChange={changeB}
          placeholder="e.g. 11"
        />
        <pre>Proofs</pre>
        <Button onClick={runProofs}>Generate Proof</Button>
        <pre>Results</pre>
        Proof: <TextField>{proof}</TextField>
        Signals: <TextField>{signals}</TextField>
        Result:
        {proof.length > 0 && (
          <TextField>{isValid ? "Valid proof" : "Invalid proof"}</TextField>
        )}
      </header>
    </div>
  );
}

export default App;

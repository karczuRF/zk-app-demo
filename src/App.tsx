import ZKProofGenerator from "./ZKProofGenerator";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ZK Proof Demo with snarkjs</h1>
        <p>Upload your circuit files and generate zero-knowledge proofs</p>
      </header>
      <main>
        <ZKProofGenerator />
      </main>
    </div>
  );
}

export default App;

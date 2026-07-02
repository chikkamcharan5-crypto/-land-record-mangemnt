import { useState } from "react";
import { ethers } from "ethers";
import { connectWallet, getContract } from "./utils/contract";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState("");
  const [message, setMessage] = useState("");

  const [landId, setLandId] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  const [searchId, setSearchId] = useState("");
  const [landData, setLandData] = useState(null);

  const [transferLandId, setTransferLandId] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const [allLands, setAllLands] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const handleConnect = async () => {
    try {
      const { address } = await connectWallet();
      setWallet(address);
      setMessage("Wallet connected successfully");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const generateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setDocumentHash("");
      setSelectedFileName("");
      return;
    }

    try {
      setMessage("Generating document hash...");
      setSelectedFileName(file.name);
      const hash = await generateFileHash(file);
      setDocumentHash(hash);
      setMessage("Document hash generated successfully");
    } catch (error) {
      setDocumentHash("");
      setSelectedFileName("");
      setMessage("Failed to generate document hash");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!documentHash) {
      setMessage("Please upload a document to generate the hash");
      return;
    }

    try {
      const contract = await getContract();
      const tx = await contract.registerLand(
        Number(landId),
        location.trim(),
        Number(area),
        documentHash
      );
      await tx.wait();

      setMessage("Land registered successfully");

      setLandId("");
      setLocation("");
      setArea("");
      setDocumentHash("");
      setSelectedFileName("");

      await loadAllLands();
    } catch (error) {
      setMessage(error.reason || error.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const contract = await getContract();
      const result = await contract.getLand(Number(searchId));

      setLandData({
        landId: result[0].toString(),
        location: result[1],
        area: result[2].toString(),
        owner: result[3],
        documentHash: result[4],
      });

      setMessage("Land record fetched successfully");
    } catch (error) {
      setMessage(error.reason || error.message);
      setLandData(null);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!ethers.isAddress(newOwner)) {
      setMessage("Invalid wallet address");
      return;
    }

    try {
      const contract = await getContract();
      const tx = await contract.transferOwnership(
        Number(transferLandId),
        newOwner
      );
      await tx.wait();

      setMessage("Ownership transferred successfully");

      setTransferLandId("");
      setNewOwner("");

      await loadAllLands();
    } catch (error) {
      setMessage(error.reason || error.message);
    }
  };

  const loadAllLands = async () => {
    try {
      setLoadingDashboard(true);
      const contract = await getContract();
      const result = await contract.getAllLands();

      if (!result || result.length === 0) {
        setAllLands([]);
        setMessage("No lands registered yet");
        return;
      }

      const formatted = result.map((land, index) => ({
        id: index,
        landId: land.landId ? land.landId.toString() : land[0].toString(),
        location: land.location ?? land[1],
        area: land.area ? land.area.toString() : land[2].toString(),
        owner: land.owner ?? land[3],
        documentHash: land.documentHash ?? land[4],
        exists: land.exists ?? land[5],
      }));

      setAllLands(formatted);
      setMessage("Dashboard loaded successfully");
    } catch (error) {
      setAllLands([]);
      setMessage(error.reason || error.message || "Failed to load dashboard");
    } finally {
      setLoadingDashboard(false);
    }
  };

  return (
    <div className="container">
      <h1>Blockchain Land Record Management</h1>

      <div className="topbar">
        <button onClick={handleConnect} className="btn">
          {wallet ? "Wallet Connected" : "Connect MetaMask"}
        </button>
      </div>

      {wallet && (
        <p className="wallet">
          <strong>Connected Wallet:</strong> {wallet}
        </p>
      )}

      {message && <p className="message">{message}</p>}

      <div className="card">
        <h2>Register Land</h2>
        <form onSubmit={handleRegister}>
          <input
            type="number"
            placeholder="Land ID"
            value={landId}
            onChange={(e) => setLandId(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Area(sq ft)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          />

          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            required
          />

          {selectedFileName && (
            <p>
              <strong>Selected File:</strong> {selectedFileName}
            </p>
          )}

          <input
            type="text"
            placeholder="Document Hash"
            value={documentHash}
            readOnly
            required
          />

          <button type="submit" className="btn">
            Register Land
          </button>
        </form>
      </div>

      <div className="card">
        <h2>View Land Record</h2>
        <form onSubmit={handleSearch}>
          <input
            type="number"
            placeholder="Enter Land ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            required
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>

        {landData && (
          <div className="result">
            <p><strong>Land ID:</strong> {landData.landId}</p>
            <p><strong>Location:</strong> {landData.location}</p>
            <p><strong>Area:</strong> {landData.area}</p>
            <p><strong>Owner Address:</strong> {landData.owner}</p>
            <p><strong>Document Hash:</strong> {landData.documentHash}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Transfer Ownership</h2>
        <form onSubmit={handleTransfer}>
          <input
            type="number"
            placeholder="Land ID"
            value={transferLandId}
            onChange={(e) => setTransferLandId(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="New Owner Wallet Address"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            required
          />

          <button type="submit" className="btn">
            Transfer Ownership
          </button>
        </form>
      </div>

      <div className="card">
        <div className="dashboard-header">
          <h2>Dashboard - All Registered Lands</h2>
          <button onClick={loadAllLands} className="btn">
            {loadingDashboard ? "Loading..." : "Load Dashboard"}
          </button>
        </div>

        {allLands.length > 0 ? (
          <div className="table-wrapper">
            <table className="lands-table">
              <thead>
                <tr>
                  <th>Land ID</th>
                  <th>Location</th>
                  <th>Area</th>
                  <th>Owner Address</th>
                  <th>Document Hash</th>
                </tr>
              </thead>
              <tbody>
                {allLands.map((land) => (
                  <tr key={land.id}>
                    <td>{land.landId}</td>
                    <td>{land.location}</td>
                    <td>{land.area}</td>
                    <td>{land.owner}</td>
                    <td className="hash-cell">{land.documentHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-text">No land records loaded yet.</p>
        )}
      </div>
    </div>
  );
}

export default App;
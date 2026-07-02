import { ethers } from "ethers";
import contractJson from "../abi/LandRegistry.json";

const CONTRACT_ADDRESS = "0x40328B0ba85E933dD15F5F70b5D4d4740a1EB4DE";
const ABI = Array.isArray(contractJson) ? contractJson : contractJson.abi;

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function connectWallet() {
  const provider = await getProvider();
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

export async function getContract() {
  const provider = await getProvider();
  const signer = await provider.getSigner();

  if (!ABI) {
    throw new Error("ABI not loaded correctly. Check LandRegistry.json");
  }

  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}
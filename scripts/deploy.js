const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Authorization Manager
  const AuthManager = await hre.ethers.getContractFactory(
    "AuthorizationManager"
  );
  const authManager = await AuthManager.deploy();
  await authManager.waitForDeployment();
  const authAddress = await authManager.getAddress();
  console.log("AuthorizationManager deployed to:", authAddress);

  // 2. Deploy Secure Vault
  const SecureVault = await hre.ethers.getContractFactory("SecureVault");
  const vault = await SecureVault.deploy(authAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("SecureVault deployed to:", vaultAddress);

  // Output for Docker logs
  console.log(`NETWORK: ${hre.network.name}`);
  console.log(`AUTH_MANAGER_ADDRESS=${authAddress}`);
  console.log(`VAULT_ADDRESS=${vaultAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

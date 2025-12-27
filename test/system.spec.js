const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault System", function () {
  let authManager, vault, owner, user, other;

  beforeEach(async function () {
    [owner, user, other] = await ethers.getSigners();

    // Deploy Auth Manager
    const Auth = await ethers.getContractFactory("AuthorizationManager");
    authManager = await Auth.deploy();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("SecureVault");
    vault = await Vault.deploy(await authManager.getAddress());
  });

  it("Should allow withdrawal with valid signature", async function () {
    // 1. Fund the Vault
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("10.0"),
    });

    // 2. Prepare Data for Signing (EIP-712)
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const domain = {
      name: "SecureVaultAuth",
      version: "1.0",
      chainId: chainId,
      verifyingContract: await authManager.getAddress(),
    };

    const types = {
      Withdrawal: [
        { name: "vault", type: "address" },
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const amount = ethers.parseEther("1.0");
    const nonce = ethers.encodeBytes32String("unique-id-1");

    const value = {
      vault: await vault.getAddress(),
      recipient: user.address,
      amount: amount,
      nonce: nonce,
    };

    // 3. Owner (off-chain service) signs the data
    const signature = await owner.signTypedData(domain, types, value);

    // 4. User executes withdrawal
    await expect(
      vault.connect(user).withdraw(user.address, amount, nonce, signature)
    ).to.changeEtherBalances(
      [vault, user],
      [ethers.parseEther("-1.0"), ethers.parseEther("1.0")]
    );
  });

  it("Should prevent replay attacks (using same nonce twice)", async function () {
    // Fund Vault
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("5.0"),
    });

    // Setup Signature
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const domain = {
      name: "SecureVaultAuth",
      version: "1.0",
      chainId: chainId,
      verifyingContract: await authManager.getAddress(),
    };
    const types = {
      Withdrawal: [
        { name: "vault", type: "address" },
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const amount = ethers.parseEther("1.0");
    const nonce = ethers.encodeBytes32String("unique-id-2");

    const value = {
      vault: await vault.getAddress(),
      recipient: user.address,
      amount: amount,
      nonce: nonce,
    };

    const signature = await owner.signTypedData(domain, types, value);

    // First withdrawal works
    await vault.connect(user).withdraw(user.address, amount, nonce, signature);

    // Second withdrawal with same data fails
    await expect(
      vault.connect(user).withdraw(user.address, amount, nonce, signature)
    ).to.be.revertedWith("Withdrawal not authorized"); // Matches revert from AuthManager
  });
});

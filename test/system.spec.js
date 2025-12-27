const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault System", function () {
  let authManager, vault, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Auth = await ethers.getContractFactory("AuthorizationManager");
    authManager = await Auth.deploy();
    const Vault = await ethers.getContractFactory("SecureVault");
    vault = await Vault.deploy(await authManager.getAddress());
  });

  it("Should allow withdrawal with valid signature", async function () {
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("1.0"),
    });

    const domain = {
      name: "SecureVaultAuth",
      version: "1.0",
      chainId: (await ethers.provider.getNetwork()).chainId,
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

    const amount = ethers.parseEther("0.1");
    const nonce = ethers.encodeBytes32String("nonce1");
    const value = {
      vault: await vault.getAddress(),
      recipient: user.address,
      amount,
      nonce,
    };

    const signature = await owner.signTypedData(domain, types, value);

    await expect(
      vault.connect(user).withdraw(user.address, amount, nonce, signature)
    ).to.changeEtherBalances(
      [vault, user],
      [ethers.parseEther("-0.1"), ethers.parseEther("0.1")]
    );
  });

  it("Should prevent replay attacks (using same nonce twice)", async function () {
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("1.0"),
    });

    const domain = {
      name: "SecureVaultAuth",
      version: "1.0",
      chainId: (await ethers.provider.getNetwork()).chainId,
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

    const amount = ethers.parseEther("0.1");
    const nonce = ethers.encodeBytes32String("nonce2");
    const value = {
      vault: await vault.getAddress(),
      recipient: user.address,
      amount,
      nonce,
    };
    const signature = await owner.signTypedData(domain, types, value);

    await vault.connect(user).withdraw(user.address, amount, nonce, signature);

    // This should fail with the specific AuthManager error
    await expect(
      vault.connect(user).withdraw(user.address, amount, nonce, signature)
    ).to.be.revertedWith("Auth: Authorization already used");
  });
});

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load the .env file

module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31337,
    },
  },
};

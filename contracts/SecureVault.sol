// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAuthorizationManager {
    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bool);
}

contract SecureVault {
    IAuthorizationManager public authManager;

    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount, bytes32 nonce);

    constructor(address _authManager) {
        require(_authManager != address(0), "Invalid Auth Manager");
        authManager = IAuthorizationManager(_authManager);
    }

    // Accept deposits
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(
        address recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        require(address(this).balance >= amount, "Insufficient balance");

        // 1. Request Authorization (External Call to Manager)
        // The manager handles the signature verification and replay protection logic.
        bool isAuthorized = authManager.verifyAuthorization(
            address(this),
            recipient,
            amount,
            nonce,
            signature
        );

        require(isAuthorized, "Withdrawal not authorized");

        // 2. Transfer Funds (Interaction)
        // State was updated in AuthManager, so we are safe to transfer now.
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(recipient, amount, nonce);
    }
}
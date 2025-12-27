// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuthorizationManager is EIP712, Ownable {
    mapping(bytes32 => bool) public executedAuthorizations;

    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address vault,address recipient,uint256 amount,bytes32 nonce)"
    );

    event AuthorizationConsumed(bytes32 indexed nonce, address indexed recipient);

    // FIX: Pass msg.sender to Ownable constructor for OZ v5.0+
    constructor() EIP712("SecureVaultAuth", "1.0") Ownable(msg.sender) {}

    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bool) {
        require(!executedAuthorizations[nonce], "Auth: Authorization already used");

        bytes32 structHash = keccak256(abi.encode(
            WITHDRAWAL_TYPEHASH,
            vault,
            recipient,
            amount,
            nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        require(signer == owner(), "Auth: Invalid signature");

        executedAuthorizations[nonce] = true;
        emit AuthorizationConsumed(nonce, recipient);

        return true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuthorizationManager is EIP712, Ownable {
    // State to track consumed nonces to prevent replay attacks
    mapping(bytes32 => bool) public executedAuthorizations;

    // Typehash for the withdrawal struct
    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address vault,address recipient,uint256 amount,bytes32 nonce)"
    );

    event AuthorizationConsumed(bytes32 indexed nonce, address indexed recipient);

    // FIX: Pass msg.sender to Ownable constructor
    constructor() EIP712("SecureVaultAuth", "1.0") Ownable(msg.sender) {}

    /**
     * @notice Verifies if a withdrawal is authorized by the off-chain signer (owner)
     * @return true if valid and not used before
     */
    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bool) {
        // 1. Check Replay: Ensure nonce hasn't been used
        require(!executedAuthorizations[nonce], "Auth: Authorization already used");

        // 2. Reconstruct the digest (EIP-712)
        bytes32 structHash = keccak256(abi.encode(
            WITHDRAWAL_TYPEHASH,
            vault,
            recipient,
            amount,
            nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);

        // 3. Recover Signer
        address signer = ECDSA.recover(digest, signature);

        // 4. Validate Signer matches the trusted off-chain coordinator (Owner)
        require(signer == owner(), "Auth: Invalid signature");

        // 5. Update State (Effect)
        executedAuthorizations[nonce] = true;
        
        emit AuthorizationConsumed(nonce, recipient);

        return true;
    }
}

# Authorization-Governed Vault System

A secure fund-custody system utilizing off-chain EIP-712 signatures for authorized withdrawals, featuring robust replay protection and containerized deployment.

## 🛡️ Security Architecture

### Authorization Design

The system uses a decoupled architecture:

- **SecureVault**: Custodies ETH and only releases funds if a valid signature is provided.
- **AuthorizationManager**: Acts as the permission layer, verifying typed data signatures against the contract owner's address.

### EIP-712 Integration

By using `_hashTypedDataV4`, the system prevents signature malleability and ensures signatures are unique to this specific contract and network (Chain ID 31337).

### Replay Protection

Replay attacks are enforced through a `nonce` tracking system:

1. Every signed authorization includes a unique `bytes32 nonce`.
2. The `AuthorizationManager` maintains a mapping of used nonces.
3. Once a withdrawal is processed, the nonce is permanently marked as used.
4. Any attempt to reuse a signature results in the revert: `Auth: Authorization already used`.

## 🚀 How to Run

1. **Start System**:
   ```bash
   docker-compose up -d --build
   ```

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// Shared interface across all four trust contracts in this directory — it
/// mirrors services/blockchain/chain-adapter.ts's TRUST_REGISTRY_ABI exactly,
/// which is what lets that adapter stay generic across all four deployed
/// addresses instead of needing bespoke bindings per contract.
interface ITrustRegistry {
    event Recorded(bytes32 indexed refId, string payloadJson, uint256 timestamp);

    function recordEvent(bytes32 refId, string calldata payloadJson) external returns (bytes32);
}

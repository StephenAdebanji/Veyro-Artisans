// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITrustRegistry.sol";

/**
 * Stores artisan identity verification records. Written by Trust Service's
 * blockchain worker (services/blockchain/blockchain.events.ts) in reaction to
 * the IdentityVerified domain event, after an admin approves an artisan's ID
 * in the verification queue.
 *
 * Phase 1-4 scope: compilable skeleton with access control and immutable
 * storage wired up. Phase 9 adds the real per-record validation rules this
 * contract should enforce beyond "the backend wallet says so".
 */
contract IdentityVerification is ITrustRegistry {
    address public owner;

    mapping(bytes32 => string) private records;

    modifier onlyOwner() {
        require(msg.sender == owner, "IdentityVerification: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordEvent(bytes32 refId, string calldata payloadJson) external onlyOwner returns (bytes32) {
        records[refId] = payloadJson;
        emit Recorded(refId, payloadJson, block.timestamp);
        return refId;
    }

    function getRecord(bytes32 refId) external view returns (string memory) {
        return records[refId];
    }
}

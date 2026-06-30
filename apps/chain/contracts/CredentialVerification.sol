// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITrustRegistry.sol";

/**
 * Stores artisan credential verification records (trade certificates,
 * licenses). Written by Trust Service's blockchain worker in reaction to the
 * CredentialApproved domain event.
 *
 * Phase 1-4 scope: compilable skeleton with access control and immutable
 * storage wired up. Phase 9 adds the real per-record validation rules.
 */
contract CredentialVerification is ITrustRegistry {
    address public owner;

    mapping(bytes32 => string) private records;

    modifier onlyOwner() {
        require(msg.sender == owner, "CredentialVerification: not owner");
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

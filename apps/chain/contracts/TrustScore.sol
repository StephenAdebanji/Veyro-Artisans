// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITrustRegistry.sol";

/**
 * Stores trust score history and updates. Written by Trust Service's
 * blockchain worker in reaction to the TrustScoreUpdated domain event, which
 * fires every time services/trust/trust-score-engine.ts recalculates an
 * artisan's score.
 *
 * Phase 1-4 scope: compilable skeleton with access control and immutable
 * storage wired up. Phase 9 adds the real per-record validation rules.
 */
contract TrustScore is ITrustRegistry {
    address public owner;

    mapping(bytes32 => string) private records;

    modifier onlyOwner() {
        require(msg.sender == owner, "TrustScore: not owner");
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

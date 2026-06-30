// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITrustRegistry.sol";

/**
 * Stores review verification hashes and dispute resolution records. Written
 * by Trust Service's blockchain worker in reaction to the ReviewSubmitted
 * domain event (refId = reviewId) and, once Phase 11 implements disputes,
 * DisputeResolved (refId = disputeId).
 *
 * Phase 1-4 scope: compilable skeleton with access control and immutable
 * storage wired up. Phase 9 adds the real per-record validation rules.
 */
contract Reputation is ITrustRegistry {
    address public owner;

    mapping(bytes32 => string) private records;

    modifier onlyOwner() {
        require(msg.sender == owner, "Reputation: not owner");
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

pragma solidity ^0.4.24;

import {PartialMerkleTree} from "./tree.sol";

contract PartialMerkleTreeImplementation {
    using PartialMerkleTree for PartialMerkleTree.Tree;
    PartialMerkleTree.Tree tree;

    constructor () public {
    }

    function initialize(bytes32 initialRoot) public {
        tree.initialize(initialRoot);
    }

    function insert(bytes key, bytes value) public {
        tree.insert(key, value);
    }

    function commitBranch(bytes key, bytes value, uint branchMask, bytes32[] siblings) public {
        return tree.commitBranch(key, value, branchMask, siblings);
    }

    function commitBranchOfNonInclusion(bytes key, bytes32 potentialSiblingLabel, bytes32 potentialSiblingValue, uint branchMask, bytes32[] siblings) public {
        return tree.commitBranchOfNonInclusion(key, potentialSiblingLabel, potentialSiblingValue, branchMask, siblings);
    }

    function get(bytes key) public view returns (bytes) {
        return tree.get(key);
    }

    function safeGet(bytes key) public view returns (bytes) {
        return tree.safeGet(key);
    }

    function doesInclude(bytes key) public view returns (bool) {
        return tree.doesInclude(key);
    }

    function getValue(bytes32 hash) public view returns (bytes) {
        return tree.values[hash];
    }

    function getRootHash() public view returns (bytes32) {
        return tree.getRootHash();
    }

    function getProof(bytes key) public view returns (uint branchMask, bytes32[] _siblings) {
        return tree.getProof(key);
    }

    function getNonInclusionProof(bytes key) public view returns (
        bytes32 leafLabel,
        bytes32 leafNode,
        uint branchMask,
        bytes32[] _siblings
    ) {
        return tree.getNonInclusionProof(key);
    }

    function verifyProof(bytes32 rootHash, bytes key, bytes value, uint branchMask, bytes32[] siblings) public pure {
        PartialMerkleTree.verifyProof(rootHash, key, value, branchMask, siblings);
    }

    function verifyNonInclusionProof(bytes32 rootHash, bytes key, bytes32 leafLabel, bytes32 leafNode, uint branchMask, bytes32[] siblings) public pure {
        PartialMerkleTree.verifyNonInclusionProof(rootHash, key, leafLabel, leafNode, branchMask, siblings);
    }
}
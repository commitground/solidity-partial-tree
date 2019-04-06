pragma solidity >=0.5.0 <0.6.0;

import {PartialMerkleTree} from "./tree.sol";

contract PartialMerkleTreeImplementation {
    using PartialMerkleTree for PartialMerkleTree.Tree;
    PartialMerkleTree.Tree tree;

    constructor () public {
    }

    function initialize(bytes32 initialRoot) public {
        tree.initialize(initialRoot);
    }

    function insert(bytes memory key, bytes memory value) public {
        tree.insert(key, value);
    }

    function commitBranch(bytes memory key, bytes memory value, uint branchMask, bytes32[] memory siblings) public {
        return tree.commitBranch(key, value, branchMask, siblings);
    }

    function commitBranchOfNonInclusion(bytes memory key, bytes32 potentialSiblingLabel, bytes32 potentialSiblingValue, uint branchMask, bytes32[] memory siblings) public {
        return tree.commitBranchOfNonInclusion(key, potentialSiblingLabel, potentialSiblingValue, branchMask, siblings);
    }

    function get(bytes memory key) public view returns (bytes memory) {
        return tree.get(key);
    }

    function safeGet(bytes memory key) public view returns (bytes memory) {
        return tree.safeGet(key);
    }

    function doesInclude(bytes memory key) public view returns (bool) {
        return tree.doesInclude(key);
    }

    function getValue(bytes32 hash) public view returns (bytes memory) {
        return tree.values[hash];
    }

    function getRootHash() public view returns (bytes32) {
        return tree.getRootHash();
    }

    function getProof(bytes memory key) public view returns (uint branchMask, bytes32[] memory _siblings) {
        return tree.getProof(key);
    }

    function getNonInclusionProof(bytes memory key) public view returns (
        bytes32 leafLabel,
        bytes32 leafNode,
        uint branchMask,
        bytes32[] memory _siblings
    ) {
        return tree.getNonInclusionProof(key);
    }

    function verifyProof(bytes32 rootHash, bytes memory key, bytes memory value, uint branchMask, bytes32[] memory siblings) public pure {
        PartialMerkleTree.verifyProof(rootHash, key, value, branchMask, siblings);
    }

    function verifyNonInclusionProof(bytes32 rootHash, bytes memory key, bytes32 leafLabel, bytes32 leafNode, uint branchMask, bytes32[] memory siblings) public pure {
        PartialMerkleTree.verifyNonInclusionProof(rootHash, key, leafLabel, leafNode, branchMask, siblings);
    }
}

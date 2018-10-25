pragma solidity ^0.4.24;

import {PatriciaTree} from "./tree.sol";

contract PatriciaTreeImplementation {
    using PatriciaTree for PatriciaTree.Tree;
    PatriciaTree.Tree tree;

    constructor () public {
    }

    function get(bytes key) public view returns (bytes) {
        return tree.get(key);
    }

    function getRootHash() public view returns (bytes32) {
        return tree.getRootHash();
    }

    function getNode(bytes32 hash) public view returns (uint, bytes32, bytes32, uint, bytes32, bytes32) {
        return tree.getNode(hash);
    }

    function getRootEdge() public view returns (uint, bytes32, bytes32) {
        return tree.getRootEdge();
    }

    function getProof(bytes key) public view returns (uint branchMask, bytes32[] _siblings) {
        return tree.getProof(key);
    }

    function verifyProof(bytes32 rootHash, bytes key, bytes value, uint branchMask, bytes32[] siblings) public pure {
        PatriciaTree.verifyProof(rootHash, key, value, branchMask, siblings);
    }

    function insert(bytes key, bytes value) public {
        tree.insert(key, value);
    }
}

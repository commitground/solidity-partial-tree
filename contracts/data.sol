pragma solidity ^0.4.0;

/**
 MIT License
 Copyright (c) 2017 chriseth
 */

library D {
    struct Label {
        bytes32 data;
        uint length;
    }

    struct Edge {
        bytes32 header; // variable for sparse tree  <email@wanseob.com>
        bytes32 node;
        Label label;
    }

    struct Node {
        Edge[2] children;
    }

    function isEmpty(Edge edge) internal pure returns (bool) {
        return (edge.header == bytes32(0) && edge.node == bytes32(0));
    }

    function hasNode(Edge edge) internal pure returns (bool) {
        return (edge.node != bytes32(0));
    }
}
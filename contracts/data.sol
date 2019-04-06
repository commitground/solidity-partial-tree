pragma solidity >=0.5.0 <0.6.0;

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
        bytes32 header; // variable for partial merkle tree  <email@wanseob.com>
        bytes32 node;
        Label label;
    }

    struct Node {
        Edge[2] children;
    }

    function isEmpty(Edge memory edge) internal pure returns (bool) {
        return (edge.header == bytes32(0) && edge.node == bytes32(0));
    }

    function hasNode(Edge memory edge) internal pure returns (bool) {
        return (edge.node != bytes32(0));
    }
}

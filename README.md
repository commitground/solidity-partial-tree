# Solidity Sparse Tree

## Credits 

This implementation is based on [Christian Reitwießner](https://github.com/chriseth)'s [patricia-tree](https://github.com/chriseth/patricia-tree) 


##### latest released version
[![npm](https://img.shields.io/npm/v/solidity-sparse-tree/latest.svg)](https://www.npmjs.com/package/solidity-sparse-tree)
[![Build Status](https://travis-ci.org/commitground/solidity-sparse-tree.svg?branch=master)](https://travis-ci.org/commitground/solidity-sparse-tree)
[![Coverage Status](https://coveralls.io/repos/github/commitground/solidity-sparse-tree/badge.svg?branch=master)](https://coveralls.io/github/commitground/solidity-sparse-tree?branch=develop)

##### in progress
[![npm](https://img.shields.io/npm/v/solidity-sparse-tree/next.svg)](https://www.npmjs.com/package/solidity-sparse-tree)
[![Build Status](https://travis-ci.org/commitground/solidity-sparse-tree.svg?branch=develop)](https://travis-ci.org/commitground/solidity-sparse-tree)
[![Coverage Status](https://coveralls.io/repos/github/commitground/solidity-sparse-tree/badge.svg?branch=develop)](https://coveralls.io/github/commitground/solidity-sparse-tree?branch=develop)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)



## Usage

```bash
npm i solidity-sparse-tree
npm i solidity-patricia-tree
```

```solidity
pragma solidity ^0.4.24;

import {SparseTree} from "solidity-sparse-tree/contracts/tree.sol";
import {PatriciaTree} from "solidity-patricia-tree/contracts/tree.sol";

contract TestSparseTree {
    using SparseTree for SparseTree.Tree;
    using PatriciaTree for PatriciaTree.Tree;

    PatriciaTree.Tree patriciaTree;
    SparseTree.Tree sparseTree;

    /**
     * @dev we can reenact merkle tree transformation by submitting only referred siblings instead of submitting all nodes
     */
    function testSparseTree() public {
        // update merkle root
        patriciaTree.insert("key1", "val1");
        patriciaTree.insert("key2", "val2");
        patriciaTree.insert("key3", "val3");

        // root hash of patricia tree @ phase A
        bytes32 phaseAOfPatriciaTree = patriciaTree.getRootHash();

        // get siblings to update "key1"
        uint branchMask;
        bytes32[] memory siblings;
        (branchMask, siblings) = patriciaTree.getProof("key1");

        // Init sparse tree with the root hash
        sparseTree.initialize(phaseAOfPatriciaTree);
        // commit branch (we submit sibling data here)
        sparseTree.commitBranch("key1", "val1", branchMask, siblings);

        // Update key1 of patricia tree
        patriciaTree.insert("key1", "val4");

        // Update key1 of sparse tree
        sparseTree.insert("key1", "val4");

        // get updated root hashes of each tree
        bytes32 phaseBOfPatriciaTree = patriciaTree.getRootHash();
        bytes32 phaseBOfSparseTree = sparseTree.getRootHash();

        // We have succeeded to reenact merkle tree transformation without submitting all node data
        require(phaseBOfPatriciaTree == phaseBOfSparseTree);
    }
}
```


## Development 

### Pre-requisites

```bash
npm install -g truffle
npm install -g ganache-cli
npm install
```

### Tests

Test cases include the information about how the functions work, but also includes a demo scenario.
Running and reading the test cases will help you understand how it works.

```bash
npm run test
```

## Contributors
- [Wanseob Lim](https://github.com/james-lim)<[email@wanseob.com](mailto:email@wanseob.com)>

## License

[MIT LICENSE](./LICENSE)

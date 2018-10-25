# Solidity Patricia Tree

## Credits 

This is a rewritten version of [Christian Reitwießner](https://github.com/chriseth)'s [patricia-tree](https://github.com/chriseth/patricia-tree) to use his patricia tree implementation as a solidity library through npm.


##### latest released version
[![npm](https://img.shields.io/npm/v/solidity-patricia-tree/latest.svg)](https://www.npmjs.com/package/solidity-patricia-tree)
[![Build Status](https://travis-ci.org/commitground/solidity-patricia-tree.svg?branch=master)](https://travis-ci.org/commitground/solidity-patricia-tree)
[![Coverage Status](https://coveralls.io/repos/github/commitground/solidity-patricia-tree/badge.svg?branch=master)](https://coveralls.io/github/commitground/solidity-patricia-tree?branch=develop)

##### in progress
[![npm](https://img.shields.io/npm/v/solidity-patricia-tree/next.svg)](https://www.npmjs.com/package/solidity-patricia-tree)
[![Build Status](https://travis-ci.org/commitground/solidity-patricia-tree.svg?branch=develop)](https://travis-ci.org/commitground/solidity-patricia-tree)
[![Coverage Status](https://coveralls.io/repos/github/commitground/solidity-patricia-tree/badge.svg?branch=develop)](https://coveralls.io/github/commitground/solidity-patricia-tree?branch=develop)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)



## Usage

```bash
npm i solidity-patricia-tree
```

```solidity

pragma solidity ^0.4.25;

import {PatriciaTree} from "solidity-patricia-tree/contracts/tree.sol"; 

contract TestPatriciaTree {
    using PatriciaTree for PatriciaTree.Tree;
    PatriciaTree.Tree tree;

    function test() public {
        // testInsert();
        testProofs();
    }

    function testInsert() internal {
        tree.insert("one", "ONE");
        tree.insert("two", "ONE");
        tree.insert("three", "ONE");
        tree.insert("four", "ONE");
        tree.insert("five", "ONE");
        tree.insert("six", "ONE");
        tree.insert("seven", "ONE");
        // update
        tree.insert("one", "TWO");
    }

    function testProofs() internal {
        tree.insert("one", "ONE");
        uint branchMask;
        bytes32[] memory siblings;
        (branchMask, siblings) = tree.getProof("one");
        PatriciaTree.verifyProof(tree.root, "one", "ONE", branchMask, siblings);
        tree.insert("two", "TWO");
        (branchMask, siblings) = tree.getProof("one");
        PatriciaTree.verifyProof(tree.root, "one", "ONE", branchMask, siblings);
        (branchMask, siblings) = tree.getProof("two");
        PatriciaTree.verifyProof(tree.root, "two", "TWO", branchMask, siblings);
    }
}
```


## Development 

### Pre-requisites

```bash
npm install -g truffle
npm install -g ganache
npm install
```

### Tests

Test cases include the information about how the functions work, but also includes a demo scenario.
Running and reading the test cases will help you understand how it works.

```bash
npm run test
```


## Contributors
- Original author: [Christian Reitwießner](https://github.com/chriseth)
- [Wanseob Lim](https://github.com/james-lim)<[email@wanseob.com](mailto:email@wanseob.com)>

## License

[MIT LICENSE](./LICENSE)

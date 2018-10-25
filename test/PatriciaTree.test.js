const chai = require('chai')
const assert = chai.assert
const BigNumber = web3.BigNumber
const should = chai.use(require('chai-bignumber')(BigNumber)).should()

const PatriciaTreeImplementation = artifacts.require('PatriciaTreeImplementation')
const { toNodeObject, progress } = require('./utils')

const ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000'

contract('PatriciaTree', async ([_, primary, nonPrimary]) => {
  context('inherits the patricia tree smart contract', async () => {
    let tree
    beforeEach('deploy PatriciaTree', async () => {
      tree = await PatriciaTreeImplementation.new({ from: primary })
    })
    describe('insert()', async () => {
      it('should not use gas more than 1 million', async () => {
        let itemCount = 10
        let items = {}
        for (let i = 0; i < itemCount; i++) {
          items[web3.sha3('key' + Math.random())] = web3.sha3('val' + Math.random())
        }
        let count = 1
        for (const key of Object.keys(items)) {
          await tree.insert(key, items[key], { from: primary })
          let estimatedGasToAddNewValue = await tree.insert.estimateGas(web3.sha3('key' + Math.random()), web3.sha3('val' + Math.random()), { from: primary })
          progress.log(`(${count++}/${itemCount}) Required gas for a transaction: ${estimatedGasToAddNewValue}`)
          assert.isTrue(estimatedGasToAddNewValue < 1000000)
        }
        progress.close()
      })
      it('should allow only primary address to put items', async () => {
        await tree.insert('foo', 'bar', { from: primary })
      })
      it('should allow overwriting', async () => {
        await tree.insert('foo', 'bar', { from: primary })
        await tree.insert('foo', 'baz', { from: primary })
        assert.equal(web3.toUtf8(await tree.get('foo')), 'baz')
      })
      it('should revert when a non-primary address tries to insert a new item', async () => {
        try {
          await tree.insert('foo', 'bar', { from: nonPrimary })
          assert.fail('it should throw an error')
        } catch (e) {
          assert.ok('it is successfully reverted')
        }
      })
    })

    describe('getRootHash()', async () => {
      it('should return its root hash value as zero when nothing is stored', async () => {
        assert.equal(await tree.getRootHash(), ZERO)
      })
      it('should update its root hash when every new items are put into', async () => {
        // insert an item
        await tree.insert('foo', 'bar', { from: primary })
        let firstRootHash = await tree.getRootHash()
        // insert an item again
        await tree.insert('baz', 'qux', { from: primary })
        let secondRootHash = await tree.getRootHash()
        assert.notEqual(firstRootHash, secondRootHash)
        // insert an item again
        await tree.insert('foo', 'baz', { from: primary })
        let thirdRootHash = await tree.getRootHash()
        assert.notEqual(secondRootHash, thirdRootHash)
      })

      it('should return same root hash for same write history', async () => {
        //  define items to put
        let items = {
          key1: 'val1',
          key2: 'val2',
          key3: 'val3'
        }

        //  insert items into the first tree
        for (const key of Object.keys(items)) {
          progress.log(`Insert items (${key}, ${items[key]})`)
          await tree.insert(key, items[key], { from: primary })
        }
        progress.close()
        // get root hash of the first tree
        let rootEdgeOfTree = await tree.getRootEdge()
        let rootHashOfTree = rootEdgeOfTree[2]

        // deploy a second tree
        let secondTree = await PatriciaTreeImplementation.new({ from: primary })
        // insert same items into the second tree
        for (const key of Object.keys(items)) {
          await progress.log(`Insert items into the second tree (${key}, ${items[key]})`, 500)
          await secondTree.insert(key, items[key], { from: primary })
        }
        progress.close()
        // get root hash of the second tree
        let rootEdgeOfSecondTree = await secondTree.getRootEdge()
        let rootHashOfSecondTree = rootEdgeOfSecondTree[2]

        // compare the two root hashes
        assert.equal(rootHashOfTree, rootHashOfSecondTree)
      })
    })

    describe('getNode()', async () => {
      it('should able to find all nodes', async () => {
        let items = {
          'key1': 'value1',
          'key2': 'value2',
          'key3': 'value3',
          'key4': 'value4',
          'key5': 'value5'
        }

        // insert items
        for (const key of Object.keys(items)) {
          await tree.insert(key, items[key], { from: primary })
        }

        // find all nodes and check stored value hash
        let leafNodes = []
        let nodeObjs = []

        const getNodeRecursively = (depth, parent, hash) => new Promise(async res => {
          let result = await tree.getNode(hash)
          let nodes = [
            [result[0], result[1], result[2]],
            [result[3], result[4], result[5]]]
          for (let i = 0; i < nodes.length; i++) {
            let nodeObj = toNodeObject(depth, hash, nodes[i])
            nodeObjs.push(nodeObj)
            let nodeHashValue = nodeObj.node
            if (nodeHashValue == ZERO) {
              // Because an edge should always have two nodes, it duplicates a leaf node when only one exist.
              // Therefore, if there already exists a same node, do not push it into the leaf node array.
              let leafNode = {
                parent,
                hash
              }
              let leafNodeAlreadyExist = leafNodes.reduce((val, item) => JSON.stringify(item) === JSON.stringify(leafNode), 0)
              if (!leafNodeAlreadyExist) {
                leafNodes.push(leafNode)
              }
            } else {
              await getNodeRecursively(depth + 1, hash, nodeHashValue)
            }
          }
          progress.close()
          res()
        })

        // Get root hash to start to find nodes recursively
        let rootNode = toNodeObject(0, 'root', await tree.getRootEdge())
        let rootValue = rootNode.node
        // Find nodes recursively and add leaf nodes to the array
        await getNodeRecursively(1, 'root', rootValue)

        // Compare the found leaf nodes and initial items
        let hashValuesFromLeafNodes = leafNodes.map(leafNode => leafNode.hash)
        let hashValuesFromInitialItems = Object.values(items).map(item => web3.sha3(item))
        assert.equal(
          JSON.stringify(hashValuesFromLeafNodes.sort()),
          JSON.stringify(hashValuesFromInitialItems.sort())
        )

        // if you want to see more in detail, you can print the leafNodes and nodeObj arrays.
        // console.log(nodeObjs);
        // console.log(leafNodes);
      })
    })

    describe('getProof() & verifyProof()', async () => {
      it('should be able to verify merkle proof for a given key', async () => {
        let items = { key1: 'value1', key2: 'value2', key3: 'value3' }
        for (const key of Object.keys(items)) {
          await tree.insert(key, items[key], { from: primary })
        }
        let count = 0
        for (const key of Object.keys(items)) {
          let [branchMask, siblings] = await tree.getProof(key)
          let rootHash = await tree.getRootHash()
          await tree.verifyProof(rootHash, key, items[key], branchMask, siblings)
          progress.log(`(${count++}/${Object.keys(items).length}) Merkle proof for ${key}:${items[key]}`)
          assert.ok('is not reverted')
        }
        progress.close()
      })

      it('should throw an error for an invalid merkle proof', async () => {
        let items = { key1: 'value1', key2: 'value2', key3: 'value3' }
        for (const key of Object.keys(items)) {
          await tree.insert(key, items[key], { from: primary })
        }
        let count = 0
        for (const key of Object.keys(items)) {
          let [branchMask, siblings] = await tree.getProof(key)
          let rootHash = await tree.getRootHash()
          try {
            await tree.verifyProof(rootHash, key, `manipulate${items[key]}`, branchMask, siblings)
          } catch (e) {
            progress.log(`(${count++}/${Object.keys(items).length}) fraud proof for ${key}:${items[key]}`)
            assert.ok('reverted')
          }
        }
        progress.close()
      })
    })

    describe('get()', async () => {
      it('should return stored value for the given key', async () => {
        await tree.insert('foo', 'bar', { from: primary })
        assert.equal(web3.toUtf8(await tree.get('foo')), 'bar')
      })
    })
  })
})

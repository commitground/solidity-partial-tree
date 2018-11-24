const chai = require('chai')
const assert = chai.assert
const BigNumber = web3.BigNumber
const should = chai.use(require('chai-bignumber')(BigNumber)).should()

const PartialMerkleTreeImplementation = artifacts.require('PartialMerkleTreeImplementation')
const { toNodeObject, progress } = require('./utils')

const ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000'

contract('PartialMerkleTree', async ([_, primary, nonPrimary]) => {
  context('PartialMerkleTree is also a kind of patricia merkle tree', async () => {
    let tree
    beforeEach('deploy PartialMerkleTree', async () => {
      tree = await PartialMerkleTreeImplementation.new({ from: primary })
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
        let rootHashOfFirstTree = await tree.getRootHash()

        // deploy a second tree
        let secondTree = await PartialMerkleTreeImplementation.new({ from: primary })
        // insert same items into the second tree
        for (const key of Object.keys(items)) {
          await progress.log(`Insert items into the second tree (${key}, ${items[key]})`, 500)
          await secondTree.insert(key, items[key], { from: primary })
        }
        progress.close()
        // get root hash of the second tree
        let rootHashOfSecondTree = await secondTree.getRootHash()

        // compare the two root hashes
        assert.equal(rootHashOfFirstTree, rootHashOfSecondTree)
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

    describe('getNonInclusionProof()', async () => {
      let items = { key1: 'value1', key2: 'value2', key3: 'value3' }
      it('should return proof data when the key does not exist', async () => {
        for (const key of Object.keys(items)) {
          await tree.insert(key, items[key], { from: primary })
        }
        await tree.getNonInclusionProof('key4')
      })
      it('should not return data when the key does exist', async () => {
        for (const key of Object.keys(items)) {
          await tree.insert(key, items[key], { from: primary })
        }
        try {
          await tree.getNonInclusionProof('key1')
          assert.fail('Did not reverted')
        } catch (e) {
          assert.ok('Reverted successfully')
        }
      })
    })

    describe('verifyNonInclusionProof()', async () => {
      it('should be passed when we use correct proof data', async () => {
        let items = { key1: 'value1', key2: 'value2', key3: 'value3' }
        for (const key of Object.keys(items)) {
          await tree.insert(key, items[key], { from: primary })
        }
        let rootHash = await tree.getRootHash()
        let [potentialSiblingLabel, potentialSiblingValue, branchMask, siblings] = await tree.getNonInclusionProof('key4')
        await tree.verifyNonInclusionProof(rootHash, 'key4', potentialSiblingLabel, potentialSiblingValue, branchMask, siblings)
        for (const key of Object.keys(items)) {
          try {
            await tree.verifyNonInclusionProof(rootHash, key, potentialSiblingLabel, potentialSiblingValue, branchMask, siblings)
            assert.fail('Did not reverted')
          } catch (e) {
            assert.ok('Reverted successfully')
          }
        }
      })
    })
  })

  context('We can reenact merkle tree transformation by submitting only referred siblings instead of submitting all nodes', async () => {
    let treeA
    let treeB
    let firstPhaseOfTreeA
    let branchMaskForKey1
    let siblingsForKey1
    let referredValueForKey1
    before(async () => {
      treeA = await PartialMerkleTreeImplementation.new()
      treeB = await PartialMerkleTreeImplementation.new()

      await treeA.insert('key1', 'val1')
      await treeA.insert('key2', 'val2')
      await treeA.insert('key3', 'val3')
      firstPhaseOfTreeA = await treeA.getRootHash()
      referredValueForKey1 = await treeA.get('key1')

      let proof = await treeA.getProof('key1')
      branchMaskForKey1 = proof[0]
      siblingsForKey1 = proof[1]
    })

    it('should start with same root hash by initialization', async () => {
      //initilaze with the first root hash
      await treeB.initialize(firstPhaseOfTreeA)
      assert.equal(await treeB.getRootHash(), firstPhaseOfTreeA)
    })

    it('should not change root after committing branch data', async () => {
      // commit branch data
      await treeB.commitBranch('key1', referredValueForKey1, branchMaskForKey1, siblingsForKey1)
      assert.equal(await treeB.getRootHash(), firstPhaseOfTreeA)
    })

    it('should be able to return proof data', async () => {
      // commit branch data
      await treeB.getProof('key1')
    })

    let secondPhaseOfTreeA
    let secondPhaseOfTreeB
    it('should have same root hash when we update key1', async () => {
      await treeA.insert('key1', 'val4')
      await treeB.insert('key1', 'val4')
      secondPhaseOfTreeA = await treeA.getRootHash()
      secondPhaseOfTreeB = await treeB.getRootHash()
      assert.equal(secondPhaseOfTreeA, secondPhaseOfTreeB)
    })

    it('should revert before the branch data of non inclusion is committed', async () => {
      try {
        await treeB.insert('key4', 'val4')
        assert.fail('Did not reverted')
      } catch (e) {
        assert.ok('Reverted successfully')
      }
    })

    let thirdPhaseOfTreeA
    let thirdPhaseOfTreeB
    it('should be able to insert a non inclusion key-value pair after committting related branch data', async () => {
      let [potentialSiblingLabel, potentialSiblingValue, branchMask, siblings] = await treeA.getNonInclusionProof('key4')
      await treeB.commitBranchOfNonInclusion('key4', potentialSiblingLabel, potentialSiblingValue, branchMask, siblings)
      assert.equal(await treeB.getRootHash(), secondPhaseOfTreeB)

      await treeA.insert('key4', 'val4')
      await treeB.insert('key4', 'val4')
      thirdPhaseOfTreeA = await treeA.getRootHash()
      thirdPhaseOfTreeB = await treeB.getRootHash()
      assert.equal(thirdPhaseOfTreeA, thirdPhaseOfTreeB)
    })
  })
})

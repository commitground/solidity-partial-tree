const chai = require('chai')
const assert = chai.assert
const BigNumber = web3.BigNumber

const PatriciaTreeImplementation = artifacts.require('PatriciaTreeImplementation')
const PatriciaTreeMerkleProof = artifacts.require('PatriciaTreeMerkleProof')

const Status = {
  OPENED: 0,
  ONGOING: 1,
  SUCCESS: 2,
  FAILURE: 3
}

contract('PatriciaTreeMerkleProof', async ([_, primary, nonPrimary]) => {
  let originalRootHash
  let originalRootEdge
  let targetRootEdge
  let targetRootHash
  let snapshotTree
  let testNode1
  let testNode2
  before('Plasma manages its state with PatriciaTreeImplementation', async () => {
    // Data for merkle proof. We can make some transitions on the child chain

    // Get the original root edge
    let plasmaTree = await PatriciaTreeImplementation.new({ from: primary })
    await plasmaTree.insert('key1', 'val1', { from: primary })
    await plasmaTree.insert('key2', 'val2', { from: primary })
    originalRootEdge = await plasmaTree.getRootEdge()
    originalRootHash = await plasmaTree.getRootHash()

    // Get the target root edge
    await plasmaTree.insert('key3', 'val3', { from: primary })
    await plasmaTree.insert('key4', 'val4', { from: primary })
    targetRootEdge = await plasmaTree.getRootEdge()
    targetRootHash = await plasmaTree.getRootHash()

    // Get the target root edge
    await plasmaTree.insert('key5', 'val5', { from: primary })
    let testRootHash = (await plasmaTree.getRootEdge())[2]
    testNode1 = [testRootHash, ...(await plasmaTree.getNode(testRootHash))]
    await plasmaTree.insert('key6', 'val6', { from: primary })
    testRootHash = (await plasmaTree.getRootEdge())[2]
    testNode2 = [testRootHash, ...(await plasmaTree.getNode(testRootHash))]

    // Init a test tree
    snapshotTree = await PatriciaTreeImplementation.new({ from: primary })
    await snapshotTree.insert('key1', 'val1', { from: primary })
    await snapshotTree.insert('key2', 'val2', { from: primary })
  })

  describe('constructor()', async () => {
    let merkleProofCase
    it('should assign the original root edge and the target root edge', async () => {
      merkleProofCase = await PatriciaTreeMerkleProof.new({ from: primary })
      assert.ok('deployed successfully')
    })
    it('should set its initial status as OPENED', async () => {
      merkleProofCase = await PatriciaTreeMerkleProof.new({ from: primary })
      assert.equal((await merkleProofCase.status()).toNumber(), Status.OPENED)
    })
  })

  context('Once deployed successfully', async () => {
    let merkleProofCase
    let dataToCommit
    const commitNodes = async (nodes) => {
      for (const node of nodes) {
        await merkleProofCase.commitNode(...node, { from: primary })
      }
    }

    const commitValues = async (values) => {
      for (const value of values) {
        await merkleProofCase.commitValue(value, { from: primary })
      }
    }

    before('prepare', async () => {
      let rootValueOfOriginalState = originalRootEdge[2]
      dataToCommit = await getDataToCommit(snapshotTree, rootValueOfOriginalState)
    })

    beforeEach('Use a newly deployed PatriciaTreeMerkleProof for every test', async () => {
      merkleProofCase = await PatriciaTreeMerkleProof.new({ from: primary })
      await merkleProofCase.commitOriginalEdge(...originalRootEdge, { from: primary })
      await merkleProofCase.commitTargetEdge(...targetRootEdge, { from: primary })
    })

    describe('commitNode()', async () => {
      it('should be called only when the case is in OPENED status', async () => {
        await commitNodes(dataToCommit.nodes)
        assert.ok('successfully committed nodes')
      })

      it('should revert when an invalid node is added', async () => {
        await merkleProofCase.commitNode(...testNode1, { from: primary })
        assert.ok('Successfully passed because the passed node is valid')
        try {
          await merkleProofCase.commitNode(0, ...originalRootEdge, ...originalRootEdge, { from: primary })
          assert.fail('should revert')
        } catch (e) {
          assert.ok('reverted successfully')
        }
      })

      it('should revert if same hash already exists', async () => {
        await merkleProofCase.commitNode(...testNode1, { from: primary })
        assert.ok('Successfully passed because same hash does not exist')
        try {
          await merkleProofCase.commitNode(...testNode1, { from: primary })
          assert.fail('should revert because the same hash already exists')
        } catch (e) {
          assert.ok('reverted successfully')
        }
      })

      it('should revert when it is not in OPENED status', async () => {
        await commitNodes(dataToCommit.nodes)
        await commitValues(dataToCommit.values)
        await merkleProofCase.seal({ from: primary })
        try {
          await merkleProofCase.commitNode(testNode1, { from: primary })
          assert.fail('it should revert')
        } catch (e) {
          assert.ok('successfully reverted')
        }
      })
    })

    describe('seal()', async () => {
      it('should revert if it does not passes the merkle proof', async () => {
        it('should have enough committed values which it refers', async () => {
          await commitNodes(dataToCommit.nodes)
          try {
            await merkleProofCase.seal({ from: primary })
            assert.fail('should revert')
          } catch (e) {
            assert.ok('reverted successfully')
          }
        })
        it('should have enough committed nodes for its merkle proof', async () => {
          await commitValues(dataToCommit.values)
          try {
            await merkleProofCase.seal({ from: primary })
            assert.fail('should revert')
          } catch (e) {
            assert.ok('reverted successfully')
          }
        })
      })

      it('should change its status as ONGOING and emit an event for it', async () => {
        // make the case have ONGOING status first
        await commitNodes(dataToCommit.nodes)
        await commitValues(dataToCommit.values)
        let response = await merkleProofCase.seal({ from: primary })

        // check it emits an event
        assert.equal(
          web3.toDecimal(response.receipt.logs[0].data),
          Status.ONGOING,
          'event will be logged in the receipt'
        )
        // check it returns its status as ONGOING
        assert.equal(
          (await merkleProofCase.status()).toNumber(),
          Status.ONGOING,
          'it should return its status as ONGOING'
        )
      })
    })

    describe('insert()', async () => {
      it('should be called only when the case is in ONGOING status', async () => {
        try {
          await merkleProofCase.insert('somekey', 'someval', { from: primary })
          assert.fail('should revert')
        } catch (e) {
          assert.ok('reverted successfully')
        }
      })
      it('should be called by only the primary account', async () => {
        // make the case have ONGOING status first
        await commitNodes(dataToCommit.nodes)
        await commitValues(dataToCommit.values)
        await merkleProofCase.seal({ from: primary })

        // insert item with primary account
        await merkleProofCase.insert('somekey', 'someval', { from: primary })
        assert.ok('primary account can insert item')
        try {
          // insert item with non primary account
          await merkleProofCase.insert('somekey', 'someval', { from: nonPrimary })
          assert.fail('should revert')
        } catch (e) {
          assert.ok('non primary account can not insert item')
        }
      })
    })

    describe('proof()', async () => {
      it('should revert when the calculated root hash is not equal to the target hash', async () => {
        // make the case have ONGOING status first
        await commitNodes(dataToCommit.nodes)
        await commitValues(dataToCommit.values)
        await merkleProofCase.seal({ from: primary })

        // insert manipulated items
        await merkleProofCase.insert('key3', 'manipulatedval3', { from: primary }) // original value is 'val3'
        await merkleProofCase.insert('key4', 'manipulatedval4', { from: primary }) // original value is 'val4'

        // try to proof
        try {
          await merkleProofCase.proof({ from: nonPrimary })
          assert.fail('should revert')
        } catch (e) {
          assert.ok('reverted because it was manipulated')
        }
      })

      it('should change its state as SUCCESS when the calculated root hash is equal to the target hash', async () => {
        // make the case have ONGOING status first
        await commitNodes(dataToCommit.nodes)
        await commitValues(dataToCommit.values)
        await merkleProofCase.seal({ from: primary })

        // insert correct items
        await merkleProofCase.insert('key3', 'val3', { from: primary })
        await merkleProofCase.insert('key4', 'val4', { from: primary })

        // try to proof
        await merkleProofCase.proof({ from: primary })
        // check it changes its status as SUCCESS
        assert.equal(
          (await merkleProofCase.status()).toNumber(),
          Status.SUCCESS,
          'it should return its status as SUCCESS'
        )
      })
    })
  })
})

const getDataToCommit = async function (tree, hash) {
  let result = {
    values: [],
    nodes: []
  }

  let response = await tree.getNode(hash)
  // response[2] means the first child's node value
  // response[5] means the second child's node value
  if (web3.toDecimal(response[2]) === 0 && web3.toDecimal(response[5]) === 0) {
    // when if it is a leaf node, push the value to commit
    let value = await tree.getValue(hash)
    result.values.push(web3.toUtf8(value))
  } else {
    // when if it is a branch node, push the node and repeat recursively
    result.nodes.push([hash, ...response])
    let resultFromFirstChild = await getDataToCommit(tree, response[2])
    result.values = [...result.values, ...resultFromFirstChild.values]
    result.nodes = [...result.nodes, ...resultFromFirstChild.nodes]

    if (response[5] != response[2]) {
      let resultFromSecondChild = await getDataToCommit(tree, response[5])
      result.values = [...result.values, ...resultFromSecondChild.values]
      result.nodes = [...result.nodes, ...resultFromSecondChild.nodes]
    }
  }
  return result
}

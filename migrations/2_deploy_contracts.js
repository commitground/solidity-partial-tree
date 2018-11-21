const Tree = artifacts.require('PartialMerkleTree')
const Implementation = artifacts.require('PartialMerkleTreeImplementation')

module.exports = function (deployer) {
  deployer.deploy(Tree).then(() => {
    deployer.deploy(Implementation)
  })
  deployer.link(Tree, Implementation)
}

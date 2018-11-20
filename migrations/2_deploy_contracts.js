const Tree = artifacts.require('SparseTree')
const Implementation = artifacts.require('SparseTreeImplementation')

module.exports = function (deployer) {
  deployer.deploy(Tree).then(() => {
    deployer.deploy(Implementation)
  })
  deployer.link(Tree, Implementation)
}

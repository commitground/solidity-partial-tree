const Tree = artifacts.require('PatriciaTree')
const Implementation = artifacts.require('PatriciaTreeImplementation')

module.exports = function (deployer) {
  deployer.deploy(Tree).then(() => {
    deployer.deploy(Implementation)
  })
  deployer.link(Tree, Implementation)
}

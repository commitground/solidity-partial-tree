module.exports = {
  compileCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle compile --network development',
  testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle tests --network development',
  skipFiles: [
    'contracts/Migrations.sol',
    'contracts/implementation.sol'
  ]
}

module.exports = {
  compileCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle compile --network development',
  testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network development',
  skipFiles: [
    'contracts/Migrations.sol',
    'contracts/implementation.sol'
  ]
}

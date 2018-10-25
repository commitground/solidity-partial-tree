const readline = require('readline')

const toNodeObject = (depth, label, node) => {
  return {
    parent: label,
    depth,
    labelLength: node[0].toNumber(),
    labelData: node[1],
    node: node[2]
  }
}

const progress = {
  log: async (output, ms) => {
    readline.cursorTo(process.stdout, 0)
    process.stdout.write(`Progress >>\t${output}`)
    if (ms) {
      let sleep = () => new Promise(resolve => setTimeout(resolve, ms))
      await sleep()
    }
  },
  close: () => {
    readline.cursorTo(process.stdout, 0)
    process.stdout.write('')
  }
}

module.exports = {
  toNodeObject,
  progress
}

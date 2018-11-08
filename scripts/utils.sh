#!/bin/bash

# Test script should be run in the base directory
check_truffle_project() {
  cd `dirname "$0"` && cd ../
  if [ -f "truffle.js" ]
  then
    echo "Start testing"
  else
    echo "You should run this script in the base directory of this project"
    exit 1
  fi
}

# Terminate running ganaches for testing
kill_ganache() {
  echo "Terminate ganache"
  if !([ -z ${pid+x} ]);then
    kill $pid > /dev/null 2>&1
  fi
}

# Compile contracts
compile() {
  truffle compile --all
  [ $? -ne 0 ] && exit 1
}

# Run private block-chain for test cases
run_ganache() {
  ganache-cli > /dev/null & pid=$!
  if ps -p $pid > /dev/null
  then
    echo "Running ganache..."
  else
    echo "Failed to run a chain"
    exit 1
  fi
}

# Deploy contracts on the block-chain for testing
migrate() {
  truffle migrate --network development
  [ $? -ne 0 ] && exit 1
}

# Run test cases with truffle
run_test() {
  truffle test --network development
  [ $? -ne 0 ] && exit 1
}

# Check test coverage
run_coverage() {
  ./node_modules/.bin/solidity-coverage
}

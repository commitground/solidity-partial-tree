#!/bin/bash

source $(dirname "$0")/utils.sh
check_truffle_project
trap kill_ganache SIGINT SIGTERM SIGTSTP
run_ganache
run_coverage
kill_ganache
exit 0

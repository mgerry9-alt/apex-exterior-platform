#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "================================================================="
echo " Starting Apex Exterior legacy evidence-review demo"
echo "================================================================="
APEX_PORT="${APEX_PORT:-3001}"
export APEX_PORT

ruby server.rb

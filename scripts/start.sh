#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "================================================================="
echo " Starting ApexExterior Outreach & Response Intelligence Platform"
echo "================================================================="
PORT="${PORT:-3000}"
export PORT

ruby server.rb

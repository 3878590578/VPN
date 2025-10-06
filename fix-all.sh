#!/usr/bin/env bash
# 全角→半角 + 补反引号 + 中文括号→英文
sed -i \
  -e 's/，/,/g' \
  -e 's/。/./g' \
  -e 's/；/;/g' \
  -e 's/‘/'"'"'/g' \
  -e 's/’/'"'"'/g' \
  -e 's/（/(/g' \
  -e 's/）/)/g' \
  -e 's/console\.log(/console.log(`/g' \
  -e 's/console\.warn(/console.warn(`/g' \
  -e 's/);$/`);/g' \
  fast8888.js
echo "✅ 已一次性修复全角符号 & 反引号"

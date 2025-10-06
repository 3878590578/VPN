#!/usr/bin/env bash
# 全角 → 半角一键替换
sed -i 's/，/,/g; s/。/./g; s/‘/'"'"'/g; s/’/'"'"'/g; s/（/(/g; s/）/)/g; s/；/;/g' fast8888.js
echo "✅ 已修复全角符号"

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re, pathlib, json

FILE_IN  = pathlib.Path('luanxu.txt')
FILE_OUT = pathlib.Path('dy.txt')

# 1. 国家关键词及顺序
REGION_MAP = [
    ('香港', '🇭🇰'),
    ('台湾', '🇨🇳'),
    ('日本', '🇯🇵'),
    ('新加坡', '🇸🇬'),
    ('美国', '🇺🇸'),
    ('印度', '🇮🇳'),
]
OTHER = '其它'

# 2. 协议顺序
PROTO_ORDER = {'vless': 0, 'hysteria2': 1, 'hysteria': 2, 'trojan': 3}

def region_of(name: str) -> str:
    """根据节点名判断归属区域"""
    for r, emoji in REGION_MAP:
        if r in name or emoji in name:
            return r
    return OTHER

def proto_of(line: str) -> str:
    """取协议前缀"""
    return line.split('://', 1)[0].strip()

def sort_key(line: str):
    name = line.split('#', 1)[-1]          # 取备注名
    region = region_of(name)
    proto  = proto_of(line)
    # 区域顺序
    region_idx = next((i for i, (r, _) in enumerate(REGION_MAP) if r == region), 99)
    # 协议顺序
    proto_idx = PROTO_ORDER.get(proto, 99)
    return (region_idx, proto_idx, name)

def main():
    text = FILE_IN.read_text(encoding='utf-8')
    # 按行拆分，去掉空行
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    lines_sorted = sorted(lines, key=sort_key)

    # 写回 dy.txt
    FILE_OUT.write_text('\n'.join(lines_sorted) + '\n', encoding='utf-8')
    print(f'Sorted {len(lines)} nodes → dy.txt')

if __name__ == '__main__':
    main()

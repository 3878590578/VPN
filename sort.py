#!/usr/bin/env python3
import pathlib, urllib.parse

FILE_IN  = pathlib.Path('luanxu.txt')
FILE_OUT = pathlib.Path('dy.txt')

# 1. 关键词顺序
KEYWORDS = ['香港', '台湾', '日本', '新加坡', '美国', '印度']

def key(line: str):
    """解码后看关键词，返回排序键"""
    decoded = urllib.parse.unquote(line)   # 把 %E9%A6%99%E6%B8%AF 等还原
    for idx, kw in enumerate(KEYWORDS):
        if kw in decoded:
            return idx
    return len(KEYWORDS)

def main():
    lines = [ln.strip() for ln in FILE_IN.read_text(encoding='utf-8').splitlines() if ln.strip()]
    lines.sort(key=key)
    FILE_OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Sorted {len(lines)} lines → dy.txt')

if __name__ == '__main__':
    main()
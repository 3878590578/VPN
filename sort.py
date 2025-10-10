#!/usr/bin/env python3
import pathlib, re

SRC = pathlib.Path('luanxu.txt')
DST = pathlib.Path('dy.txt')

# 关键词顺序
KEYWORDS = ['台湾', '香港', '日本', '新加坡', '美国', '印度']
KW_RE = [re.compile(re.escape(kw)) for kw in KEYWORDS]

def sort_key(line: str):
    """返回排序用的整数，行内容不改"""
    for prio, pattern in enumerate(KW_RE):
        if pattern.search(line):
            return prio
    return len(KEYWORDS)

def main():
    lines = [ln.strip() for ln in SRC.read_text(encoding='utf-8').splitlines() if ln.strip()]
    lines.sort(key=sort_key)
    DST.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Sorted {len(lines)} lines → {DST} (plain text)')

if __name__ == '__main__':
    main()

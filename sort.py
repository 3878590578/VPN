#!/usr/bin/env python3
import pathlib, re

FILE_IN  = pathlib.Path('luanxu.txt')
FILE_OUT = pathlib.Path('dy.txt')

# 1. 关键词顺序（越靠前优先级越高）
KEYWORDS = ['香港', '台湾', '日本', '新加坡', '美国', '印度']

def key(line: str):
    """返回排序键：下标越小越靠前，未匹配排最后"""
    line_upper = line.upper()
    for idx, kw in enumerate(KEYWORDS):
        if kw in line:
            return idx
    return len(KEYWORDS)      # 其它

def main():
    lines = [ln.strip() for ln in FILE_IN.read_text(encoding='utf-8').splitlines() if ln.strip()]
    lines.sort(key=key)       # 只按关键词顺序
    FILE_OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Sorted {len(lines)} lines → dy.txt')

if __name__ == '__main__':
    main()

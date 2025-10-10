#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pathlib
import urllib.parse
import re
import base64
import opencc   # pip install opencc-python-reimplemented

FILE_IN  = pathlib.Path('luanxu.txt')
FILE_OUT = pathlib.Path('dy.txt')

# 1. 关键词顺序（越靠前优先级越高）
KEYWORDS = ['香港', '台湾', '日本', '新加坡', '美国', '印度']
KW_RE = [re.compile(rf'\b{re.escape(kw)}\b') for kw in KEYWORDS]

# 2. 繁→简 + 全半角 + 小写 统一
CC = opencc.OpenCC('t2s')
def normalize(text: str) -> str:
    text = CC.convert(text)
    text = text.translate(str.maketrans({chr(0xFF01 + i): chr(0x21 + i) for i in range(94)}))
    return text.lower()

def sort_key(line: str):
    """对 base64 字符串排序：先解码再匹配"""
    decoded_bytes = base64.b64decode(line, validate=True)   # 如果文件里混了脏数据会抛异常
    decoded_str   = decoded_bytes.decode('utf-8')
    norm = normalize(urllib.parse.unquote(decoded_str))
    for prio, pattern in enumerate(KW_RE):
        if pattern.search(norm):
            return prio
    return len(KEYWORDS)

def main():
    # 1. 读入 base64 行
    b64_lines = [ln.strip() for ln in FILE_IN.read_text(encoding='utf-8').splitlines() if ln.strip()]
    # 2. 排序
    b64_lines.sort(key=sort_key)
    # 3. 写回 base64
    FILE_OUT.write_text('\n'.join(b64_lines) + '\n', encoding='utf-8')
    print(f'Sorted {len(b64_lines)} base64 lines → {FILE_OUT}')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
import pathlib, urllib.parse, base64, re

SRC = pathlib.Path('luanxu.txt')
DST = pathlib.Path('dy.txt')

# 关键词顺序
KEYWORDS = ['香港', '台湾', '日本', '新加坡', '美国', '印度']
KW_RE    = [re.compile(re.escape(kw)) for kw in KEYWORDS]

def normalize(text: str) -> str:
    """全角→半角 + 小写"""
    text = text.translate(str.maketrans({chr(0xFF01 + i): chr(0x21 + i) for i in range(94)}))
    return text.lower()

def sort_key(line: str):
    """先解码再匹配"""
    try:
        decoded_bytes = base64.b64decode(line, validate=True)
        decoded_str   = decoded_bytes.decode('utf-8')
    except Exception:
        return len(KEYWORDS)   # 非法行沉底
    norm = normalize(urllib.parse.unquote(decoded_str))
    for prio, pattern in enumerate(KW_RE):
        if pattern.search(norm):
            return prio
    return len(KEYWORDS)

def main():
    b64_lines = [ln.strip() for ln in SRC.read_text(encoding='utf-8').splitlines() if ln.strip()]
    b64_lines.sort(key=sort_key)
    DST.write_text('\n'.join(b64_lines) + '\n', encoding='utf-8')
    print(f'Sorted {len(b64_lines)} base64 lines → {DST}')

if __name__ == '__main__':
    main()

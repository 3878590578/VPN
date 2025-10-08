#!/usr/bin/env python3
import subprocess, time, concurrent.futures, re, sys, os

def speed_test(link):
    name = link.split('#')[-1]
    try:
        # 用 curl 下载 50 MB 到内存，取平均速度
        out = subprocess.run(
            ['curl', '-s', '-o', '/dev/null',
             '-w', '%{speed_download}',
             'https://speed.cloudflare.com/__down?bytes=50000000'],
            capture_output=True, text=True, timeout=15
        ).stdout.strip()
        speed_bps = float(out)
        mbps = speed_bps * 8 / 1_000_000   # bps → Mbps
    except:
        mbps = 0
    mb_per_s = mbps / 8
    new_name = re.sub(r'\s+', '_', name) + f'-{mb_per_s:.1f}MB/s'
    return re.sub(r'#[^|]+$', f'#{new_name}', link)

lines = [l.strip() for l in open('yuanshi_raw.txt') if l.strip() and not l.startswith('#')]
done = list(concurrent.futures.ThreadPoolExecutor(max_workers=1).map(speed_test, lines))
done.sort(key=lambda x: float(x.split('-')[-1].replace('MB/s', '')), reverse=True)
with open('speedpaixu.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(done) + '\n')
print('>>> 写盘完成，共', len(done), '条')

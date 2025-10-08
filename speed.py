#!/usr/bin/env python3
import subprocess, json, concurrent.futures, re, os, time

def speed_test(link):
    name = link.split('#')[-1]
    # 最小 sing-box 配置：本地 socks5 → 单节点出口
    cfg = {
        "log": {"level": "error"},
        "inbounds":  [{"type": "socks", "listen": "127.0.0.1", "listen_port": 2080}],
        "outbounds": [{"type": "urltest", "outbounds": ["proxy"]},
                      {"type": "direct", "tag": "direct"},
                      {"tag": "proxy", "type": "shadowsocks", "server": "dummy"}]  # 占位
    }
    try:
        out = subprocess.run(['sing-box', 'convert', '--share', link],
                             capture_output=True, text=True, timeout=8).stdout.strip()
        outbound = json.loads(out)
    except Exception as e:
        print(f'>>> convert 失败: {e}')
        return link.replace(name, name + '-0.0MB/s')

    cfg['outbounds'][-1] = outbound   # 替换占位
    with open('tmp.json', 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False)

    sb = subprocess.Popen(['sing-box', 'run', '-c', 'tmp.json'],
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    time.sleep(3)          # 等 socks 启动
    try:
        # 走 socks5 下载 50 MB
        out = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '--socks5', '127.0.0.1:2080',
             '-w', '%{speed_download}', 'https://speed.cloudflare.com/__down?bytes=50000000'],
            capture_output=True, text=True, timeout=15
        ).stdout.strip()
        speed_bps = float(out)
        mbps = speed_bps * 8 / 1_000_000
    except Exception as e:
        mbps = 0
        print(f'>>> curl 失败: {e}')
    finally:
        sb.terminate()
        sb.wait()
        os.remove('tmp.json')

    mb_per_s = mbps / 8
    new_name = re.sub(r'\s+', '_', name) + f'-{mb_per_s:.1f}MB/s'
    return re.sub(r'#[^|]+$', f'#{new_name}', link)

if __name__ == '__main__':
    lines = [l.strip() for l in open('yuanshi_raw.txt') if l.strip() and not l.startswith('#')]
    done = list(concurrent.futures.ThreadPoolExecutor(max_workers=1).map(speed_test, lines))
    done.sort(key=lambda x: float(re.search(r'-(\d+\.\d+)MB/s$', x).group(1)), reverse=True)
    with open('speedpaixu.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(done) + '\n')
    print('>>> 真实代理测速完成，共', len(done), '条')

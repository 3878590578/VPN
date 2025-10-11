#!/usr/bin/env python3
# DY.py - 全协议节点提取器
# 输出：ss / vmess / vless / hysteria2 / tuic 单行订阅，直接导入任何客户端

import base64, json, yaml, os, datetime, urllib.request, urllib.error
from typing import List, Dict
from urllib.parse import urlparse, parse_qs, unquote

PROTOCOLS = {
    'ss': ['ss://'],
    'ssr': ['ssr://'],
    'vmess': ['vmess://'],
    'vless': ['vless://'],
    'trojan': ['trojan://', 'trojan-go://'],
    'hysteria': ['hysteria://', 'hysteria2://'],
    'tuic': ['tuic://'],
    'wireguard': ['wireguard://'],
    'brook': ['brook://'],
    'naive': ['naive+https://'],
    'ssh': ['ssh://'],
    'surge': ['surge://'],
    'loon': ['loon://'],
    'stash': ['stash://'],
    'clash': ['clash://'],
}

class UniversalExtractor:
    def __init__(self):
        self.nodes: List[Dict] = []

    # ---------- 工具 ----------
    def b64_decode(self, s: str) -> str:
        try:
            s += '=' * (-len(s) % 4)
            return base64.urlsafe_b64decode(s).decode('utf-8')
        except Exception:
            return ''

    # ---------- 单行URL ----------
    def parse_url(self, url: str) -> Dict:
        try:
            for proto, prefixes in PROTOCOLS.items():
                for prefix in prefixes:
                    if url.startswith(prefix):
                        raw = url[len(prefix):]
                        if proto == 'vmess':
                            return self._parse_vmess(raw)
                        elif proto == 'ss':
                            return self._parse_ss(raw)
                        elif proto == 'ssr':
                            return self._parse_ssr(raw)
                        elif proto in ['vless', 'trojan', 'hysteria', 'hysteria2', 'tuic']:
                            return self._parse_qs_url(proto, prefix + raw)
                        elif proto == 'wireguard':
                            return self._parse_wireguard(raw)
                        else:
                            return {'type': proto, 'raw': url}
        except Exception as e:
            print('parse_url fail:', e, url[:60])
        return None

    def _parse_vmess(self, b64: str) -> Dict:
        try:
            obj = json.loads(self.b64_decode(b64))
            return {
                'type': 'vmess',
                'server': obj['add'],
                'port': int(obj['port']),
                'uuid': obj['id'],
                'aid': int(obj.get('aid', 0)),
                'net': obj.get('net', 'tcp'),
                'tls': obj.get('tls', ''),
                'sni': obj.get('sni', ''),
                'raw': f"vmess://{b64}"
            }
        except Exception:
            return None

    def _parse_ss(self, raw: str) -> Dict:
        if '@' in raw:
            auth, addr = raw.split('@', 1)
            method, password = base64.urlsafe_b64decode(auth).decode().split(':', 1)
            server, port = addr.split(':', 1)
            if '?' in port:
                port = port.split('?')[0]
            return {'type': 'ss', 'server': server, 'port': int(port), 'method': method, 'password': password, 'raw': f"ss://{raw}"}
        else:
            decoded = self.b64_decode(raw)
            if '@' in decoded:
                return self._parse_ss(decoded)
        return None

    def _parse_ssr(self, b64: str) -> Dict:
        try:
            decoded = self.b64_decode(b64)
            parts = decoded.split(':')
            server, port, protocol, method, obfs = parts[:5]
            password_and_params = ':'.join(parts[5:])
            password = self.b64_decode(password_and_params.split('/?')[0])
            node = {
                'type': 'ssr',
                'server': server,
                'port': int(port),
                'protocol': protocol,
                'method': method,
                'obfs': obfs,
                'password': password,
                'raw': f"ssr://{b64}"
            }
            if '/?' in password_and_params:
                for kv in password_and_params.split('/?')[1].split('&'):
                    if '=' in kv:
                        k, v = kv.split('=', 1)
                        node[k] = self.b64_decode(v)
            return node
        except Exception:
            return None

    def _parse_qs_url(self, proto: str, url: str) -> Dict:
        try:
            u = urlparse(url)
            node = {
                'type': proto,
                'server': u.hostname,
                'port': u.port,
                'raw': url
            }
            if u.username:
                node['uuid'] = u.username
            if u.password:
                node['password'] = u.password
            qs = parse_qs(u.query)
            for k, v in qs.items():
                node[k] = unquote(v[0])
            return node
        except Exception:
            return None

    def _parse_wireguard(self, b64: str) -> Dict:
        try:
            decoded = self.b64_decode(b64)
            return {'type': 'wireguard', 'raw': f"wireguard://{b64}", 'config': decoded}
        except Exception:
            return None

    # ---------- YAML ----------
    def parse_yaml(self, content: str) -> List[Dict]:
        try:
            y = yaml.safe_load(content)
            proxies = []
            if isinstance(y, dict) and 'proxies' in y:
                proxies = y['proxies']
            elif isinstance(y, list):
                proxies = y
            return [self._yaml_node_to_dict(n) for n in proxies if isinstance(n, dict)]
        except Exception as e:
            print('yaml fail:', e)
            return []

    def _yaml_node_to_dict(self, n: Dict) -> Dict:
        return {
            'type': n.get('type', 'unknown'),
            'server': n.get('server', ''),
            'port': n.get('port', 0),
            'name': n.get('name', ''),
            'raw': yaml.dump(n, default_flow_style=False)
        }

    # ---------- 订阅获取 ----------
    def fetch(self, url: str) -> str:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            return urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        except Exception as e:
            print('fetch fail:', e, url[:60])
            return ''

    # ---------- 主逻辑 ----------
    def extract_from_line(self, line: str):
        line = line.strip()
        if not line or line.startswith('#'):
            return
        if line.startswith('http'):
            content = self.fetch(line)
            if content:
                yaml_nodes = self.parse_yaml(content)
                if yaml_nodes:
                    self.nodes.extend(yaml_nodes)
                else:
                    for l in content.splitlines():
                        l = l.strip()
                        node = self.parse_url(l) or self.parse_url(self.b64_decode(l))
                        if node:
                            self.nodes.append(node)
        else:
            try:
                with open(line, encoding='utf-8') as f:
                    content = f.read()
                yaml_nodes = self.parse_yaml(content)
                if yaml_nodes:
                    self.nodes.extend(yaml_nodes)
                else:
                    for l in content.splitlines():
                        l = l.strip()
                        node = self.parse_url(l) or self.parse_url(self.b64_decode(l))
                        if node:
                            self.nodes.append(node)
            except Exception as e:
                print('local file fail:', e, line)

    def dedup(self) -> List[Dict]:
        seen = set()
        ret = []
        for n in self.nodes:
            key = f"{n.get('type')}://{n.get('server')}:{n.get('port')}"
            if key not in seen:
                seen.add(key)
                ret.append(n)
        return ret

    # ---------- 保存：全部转成单行订阅 ----------
    def save(self, nodes: List[Dict], file: str):
        # 1. 人类可读列表（照旧）
        readable = file.replace('.txt', '_readable.txt')
        with open(readable, 'w', encoding='utf-8') as f:
            f.write(f"总计 {len(nodes)} 个节点\n")
            for i, n in enumerate(nodes, 1):
                f.write(f"\n{i}. {n.get('name') or n.get('server')}\n")
                f.write(f"   类型: {n.get('type')}\n")
                f.write(f"   服务器: {n.get('server')}:{n.get('port')}\n")
                if 'method' in n:
                    f.write(f"   加密: {n.get('method')}\n")
                if 'uuid' in n:
                    f.write(f"   UUID: {n.get('uuid')}\n")
                if 'password' in n:
                    f.write(f"   密码: {n.get('password')}\n")

        # 2. 全部节点 → 原始单行链接（ss/vmess/vless/hysteria2/tuic）
        lines = []
        for n in nodes:
            raw = n.get('raw', '').strip()
            if raw and '://' in raw:           # 必须是合法协议头
                lines.append(raw)
        with open('DYjieguo.txt', 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        print(f"已输出 {len(lines)} 条单行订阅到 DYjieguo.txt（直接导入）")

def main():
    print("全协议节点提取器启动...")
    extractor = UniversalExtractor()
    if not os.path.isfile('DYyuan.txt'):
        print("DYyuan.txt 不存在！")
        return
    with open('DYyuan.txt', encoding='utf-8') as f:
        for line in f:
            extractor.extract_from_line(line)
    nodes = extractor.dedup()
    print(f"提取完成，共 {len(nodes)} 个唯一节点")
    extractor.save(nodes, 'DYjieguo.txt')

    # ====== 强制提交：时间戳保证一定有变更 ======
    stamp = datetime.datetime.utcnow().isoformat()
    with open('.timestamp', 'w', encoding='utf-8') as f:
        f.write(stamp)
    print(f"生成时间戳 .timestamp {stamp}")
    print("Git 将强制提交所有输出文件！")

if __name__ == '__main__':
    main()

import os
import json
from models.network import VpnPeer

# Simulated host configuration paths
HOST_WG_DIR = os.getenv("HOST_WG_DIR", "/etc/wireguard")
VPN_CONFIG_STORE = "/opt/uac-controller/vpn_peers.json"

class VpnConfigService:
    @staticmethod
    def get_all_peers() -> list:
        if not os.path.exists(VPN_CONFIG_STORE):
            return []
        with open(VPN_CONFIG_STORE, "r") as f:
            return json.load(f)

    @staticmethod
    def save_peers(peers: list):
        with open(VPN_CONFIG_STORE, "w") as f:
            json.dump(peers, f, indent=4)

    @staticmethod
    def add_peer(peer_data: VpnPeer):
        peers = VpnConfigService.get_all_peers()
        peer_dict = peer_data.model_dump()
        peers.append(peer_dict)
        VpnConfigService.save_peers(peers)
        
        # Trigger config generation
        VpnConfigService.generate_configs(peers)
        return peer_dict

    @staticmethod
    def delete_peer(peer_name: str):
        peers = VpnConfigService.get_all_peers()
        peers = [p for p in peers if p["name"] != peer_name]
        VpnConfigService.save_peers(peers)
        VpnConfigService.generate_configs(peers)

    @staticmethod
    def generate_configs(peers: list):
        """
        Translates the JSON peer list into absolute system configurations.
        """
        l3_peers = [p for p in peers if p.get("mode") == "L3"]
        l2_peers = [p for p in peers if p.get("mode") == "L2"]
        
        # 1. WireGuard Config (L3)
        wg_conf = "[Interface]\n# UAC WireGuard (L3) Interface\nPrivateKey = <LOCAL_PRIVATE_KEY>\nListenPort = 51820\n\n"
        for p in l3_peers:
            wg_conf += f"# Peer: {p['name']}\n"
            wg_conf += f"[Peer]\nPublicKey = {p['public_key']}\nEndpoint = {p['endpoint']}\nAllowedIPs = {p.get('allowed_ips', '0.0.0.0/0')}\nPersistentKeepalive = 25\n\n"
        
        # Write wg0.conf
        os.makedirs(HOST_WG_DIR, exist_ok=True)
        try:
            with open(f"{HOST_WG_DIR}/wg0.conf", "w") as f:
                f.write(wg_conf)
        except PermissionError:
            print("Warning: Permission denied writing WireGuard configurations (expected if not root).")
            
        # 2. SoftEther vpncmd scripts (L2)
        # We generate a virtual hub configuration script
        vpncmd_script = "Hub UACBRIDGE\n"
        for p in l2_peers:
            vpncmd_script += f"CascadeCreate {p['name']} /SERVER:{p['endpoint']} /HUB:DEFAULT /USERNAME:bridge\n"
            vpncmd_script += f"CascadeOnline {p['name']}\n"
            if p.get("target_vlan"):
                vpncmd_script += f"BridgeCreate {p['name']} /DEVICE:{p['target_vlan']} /TAP:no\n"
        
        try:
            with open("/opt/uac-controller/softether_bridge.cmd", "w") as f:
                f.write(vpncmd_script)
        except Exception:
            pass

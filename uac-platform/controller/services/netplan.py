import yaml
import os
from typing import List, Dict, Any
from models.network import VlanCreate, InterfaceConfig
from services.hardware import HardwareService

# Simulated Host Paths
HOST_FS_ROOT = os.getenv("HOST_FS_ROOT", "/host-fs") # Mounted in Docker
NETPLAN_DIR = os.path.join(HOST_FS_ROOT, "etc/netplan")
CHILLI_DIR = os.path.join(HOST_FS_ROOT, "etc/chilli/config.d")

class NetplanService:
    @staticmethod
    def _ensure_dirs():
        os.makedirs(NETPLAN_DIR, exist_ok=True)
        os.makedirs(CHILLI_DIR, exist_ok=True)

    @staticmethod
    def list_interfaces() -> List[Dict[str, Any]]:
        """
        In a real scenario, we'd use 'netifaces' or parse 'ip addr'.
        For now, we return a mock list + any generated config files.
        """
        # Mock Physical Interfaces
        interfaces = [
            {"name": "eth0", "type": "physical", "status": "up", "ip": "192.168.1.100/24"},
            {"name": "eth1", "type": "physical", "status": "up", "ip": "10.0.0.1/24"}
        ]
        
        # Scan generated Netplan files for VLANs
        NetplanService._ensure_dirs()
        for filename in os.listdir(NETPLAN_DIR):
            if filename.endswith(".yaml"):
                try:
                    with open(os.path.join(NETPLAN_DIR, filename), 'r') as f:
                        config = yaml.safe_load(f)
                        if 'network' in config and 'vlans' in config['network']:
                            for vlan_name, vlan_data in config['network']['vlans'].items():
                                interfaces.append({
                                    "name": vlan_name,
                                    "type": "vlan",
                                    "status": "configured", 
                                    "ip": vlan_data.get('addresses', [''])[0],
                                    "vlan_id": vlan_data.get('id'),
                                    "parent": vlan_data.get('link')
                                })
                except Exception as e:
                    print(f"Error reading {filename}: {e}")

        return interfaces

    @staticmethod
    def create_vlan(vlan: VlanCreate):
        NetplanService._ensure_dirs()
        
        vlan_interface_name = f"{vlan.parent_interface}.{vlan.vlan_id}"
        filename = f"10-uac-vlan{vlan.vlan_id}.yaml"
        filepath = os.path.join(NETPLAN_DIR, filename)

        # 1. Generate Netplan Config
        netplan_config = {
            "network": {
                "version": 2,
                "vlans": {
                    vlan_interface_name: {
                        "id": vlan.vlan_id,
                        "link": vlan.parent_interface,
                        "addresses": [vlan.ip_cidr]
                    }
                }
            }
        }

        with open(filepath, 'w') as f:
            yaml.dump(netplan_config, f, default_flow_style=False)

        # 2. Generate Chilli Mock Config (Placeholder)
        if vlan.dhcp_server_enabled:
            chilli_conf_path = os.path.join(CHILLI_DIR, f"vlan{vlan.vlan_id}.conf")
            with open(chilli_conf_path, 'w') as f:
                f.write(f"# CoovaChilli Config for {vlan_interface_name}\n")
                f.write(f"hs_wanif={vlan_interface_name}\n")
                f.write(f"hs_lanif={vlan_interface_name}\n")
                f.write(f"hs_network={vlan.ip_cidr}\n") # Simplified

        return {
            "status": "created", 
            "interface": vlan_interface_name,
            "netplan_file": filepath
        }

    @staticmethod
    def modify_interface(config: InterfaceConfig):
        NetplanService._ensure_dirs()
        filename = f"10-uac-iface-{config.name}.yaml"
        filepath = os.path.join(NETPLAN_DIR, filename)

        iface_dict = {}
        if config.dhcp4:
            iface_dict["dhcp4"] = True
        else:
            iface_dict["dhcp4"] = False
            if config.addresses:
                iface_dict["addresses"] = config.addresses
            if config.gateway4:
                iface_dict["routes"] = [{"to": "default", "via": config.gateway4}]
            if config.nameservers:
                iface_dict["nameservers"] = {"addresses": config.nameservers}

        netplan_config = {
            "network": {
                "version": 2,
                "ethernets": {
                    config.name: iface_dict
                }
            }
        }

        with open(filepath, 'w') as f:
            yaml.dump(netplan_config, f, default_flow_style=False)

        return {
            "status": "modified",
            "interface": config.name,
            "netplan_file": filepath
        }

    @staticmethod
    def apply_config():
        """
        Simulates 'netplan apply'.
        In production, this would subprocess.call(['netplan', 'apply'])
        """
        return {"status": "applied", "message": "Netplan configuration simulated apply successful."}

    @staticmethod
    def generate_from_profiles():
        """
        Reads all physical ports, looks up their assigned profiles, 
        and generates the required Netplan YAML and CoovaChilli config.
        """
        NetplanService._ensure_dirs()
        ports = HardwareService.get_physical_ports()
        profiles = {p["id"]: p for p in HardwareService.get_network_profiles()}
        
        # Clean old generated profile configs
        for filename in os.listdir(NETPLAN_DIR):
            if filename.startswith("20-profile-"):
                os.remove(os.path.join(NETPLAN_DIR, filename))
        for filename in os.listdir(CHILLI_DIR):
            if filename.startswith("profile-"):
                os.remove(os.path.join(CHILLI_DIR, filename))
                
        for port in ports:
            profile_id = port.get("assigned_profile_id")
            if profile_id and profile_id in profiles:
                prof = profiles[profile_id]
                NetplanService._apply_profile_to_port(prof, port["name"])
                
    @staticmethod
    def _apply_profile_to_port(profile: dict, port_name: str):
        vlan_id = profile.get("vlan_id")
        ip_cidr = profile.get("ip_cidr")
        
        # Scenario A: Untagged Native Port
        iface_name = port_name
        
        # Scenario B: Tagged VLAN Port
        if vlan_id:
            iface_name = f"{port_name}.{vlan_id}"
            
        filename = f"20-profile-{iface_name}.yaml"
        filepath = os.path.join(NETPLAN_DIR, filename)
        
        netplan_config = {
            "network": {
                "version": 2
            }
        }
        
        if vlan_id:
            netplan_config["network"]["vlans"] = {
                iface_name: {
                    "id": int(vlan_id),
                    "link": port_name,
                    "addresses": [ip_cidr] if ip_cidr else []
                }
            }
        else:
            netplan_config["network"]["ethernets"] = {
                iface_name: {
                    "addresses": [ip_cidr] if ip_cidr else []
                }
            }
            
        with open(filepath, 'w') as f:
            yaml.dump(netplan_config, f, default_flow_style=False)
            
        # Write CoovaChilli Config
        if profile.get("dhcp_server_enabled"):
            chilli_conf_path = os.path.join(CHILLI_DIR, f"profile-{iface_name}.conf")
            with open(chilli_conf_path, 'w') as f:
                f.write(f"# CoovaChilli Config for Profile: {profile.get('name')} on {iface_name}\n")
                f.write(f"hs_wanif={iface_name}\n")
                f.write(f"hs_lanif={iface_name}\n")
                if ip_cidr:
                    f.write(f"hs_network={ip_cidr}\n")

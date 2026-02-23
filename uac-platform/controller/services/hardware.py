import os
import glob
import json
from typing import List, Dict

# Mock hardware storage for MVP
PORTS_STORE = "/opt/uac-controller/ports.json"
PROFILES_STORE = "/opt/uac-controller/network_profiles.json"

class HardwareService:
    @staticmethod
    def get_physical_ports() -> List[Dict]:
        """
        In production, reads from /sys/class/net/
        Simulating dynamic hardware discovery for development.
        """
        # Read saved state if exists (for assigned profiles)
        saved_ports_map = {}
        if os.path.exists(PORTS_STORE):
            try:
                with open(PORTS_STORE, "r") as f:
                    saved_ports = json.load(f)
                    saved_ports_map = {p["name"]: p for p in saved_ports}
            except Exception:
                pass

        discovered_ports = []
        try:
            # Read from Linux sysfs
            interfaces = [os.path.basename(p) for p in glob.glob('/sys/class/net/*')]
            # Filter out virtual interfaces
            interfaces = [i for i in interfaces if i != 'lo' and not i.startswith('veth') and not i.startswith('wg') and not i.startswith('bridge') and not i.startswith('docker') and not i.startswith('br-') and '.' not in i]
            
            for iface in interfaces:
                mac = "unknown"
                operstate = "down"
                speed = -1
                try:
                    with open(f"/sys/class/net/{iface}/address", "r") as f:
                        mac = f.read().strip()
                    with open(f"/sys/class/net/{iface}/operstate", "r") as f:
                        operstate = f.read().strip()
                    with open(f"/sys/class/net/{iface}/speed", "r") as f:
                        speed = int(f.read().strip())
                except Exception:
                    pass
                
                port_data = {
                    "name": iface,
                    "mac_address": mac,
                    "operstate": operstate,
                    "speed": speed,
                    "assigned_profile_id": saved_ports_map.get(iface, {}).get("assigned_profile_id")
                }
                discovered_ports.append(port_data)
        except Exception as e:
            # Removed mock ports for production staging
            print(f"Warning: Hardware discovery failed: {e}")
            discovered_ports = []

        # Sync store
        with open(PORTS_STORE, "w") as f:
            json.dump(discovered_ports, f, indent=4)
            
        return discovered_ports

    @staticmethod
    def assign_profile_to_port(port_name: str, profile_id: str):
        ports = HardwareService.get_physical_ports()
        for p in ports:
            if p["name"] == port_name:
                p["assigned_profile_id"] = profile_id if profile_id else None
                break
        
        with open(PORTS_STORE, "w") as f:
            json.dump(ports, f, indent=4)
            
        # Here we would normally trigger `NetplanService` and `ChilliConfigService`
        return ports

    @staticmethod
    def get_network_profiles() -> List[Dict]:
        if not os.path.exists(PROFILES_STORE):
            return []
        with open(PROFILES_STORE, "r") as f:
            return json.load(f)

    @staticmethod
    def save_network_profile(profile_data: dict):
        profiles = HardwareService.get_network_profiles()
        # Update or append
        updated = False
        for i, p in enumerate(profiles):
            if p["id"] == profile_data["id"]:
                profiles[i] = profile_data
                updated = True
                break
        if not updated:
            profiles.append(profile_data)
            
        with open(PROFILES_STORE, "w") as f:
            json.dump(profiles, f, indent=4)
        return profile_data
        
    @staticmethod
    def delete_network_profile(profile_id: str):
        profiles = HardwareService.get_network_profiles()
        profiles = [p for p in profiles if p["id"] != profile_id]
        with open(PROFILES_STORE, "w") as f:
            json.dump(profiles, f, indent=4)
            
        # Remove from any mapped ports
        ports = HardwareService.get_physical_ports()
        modified = False
        for p in ports:
            if p.get("assigned_profile_id") == profile_id:
                p["assigned_profile_id"] = None
                modified = True
        if modified:
            with open(PORTS_STORE, "w") as f:
                json.dump(ports, f, indent=4)

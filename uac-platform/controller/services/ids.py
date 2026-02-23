import os
import json
from models.security import IdsConfig # type: ignore

# Simulated storage paths
CONFIG_STORE = "/opt/uac-controller/ids_config.json"
SURICATA_LOG = "/var/log/suricata/eve.json"
SNORT_LOG = "/var/log/snort/alert_json.txt"

class IDSService:
    @staticmethod
    def get_config() -> dict:
        if not os.path.exists(CONFIG_STORE):
            return {
                "enabled": False,
                "engine": "suricata",
                "mode": "detection",
                "interfaces": ["eth0"]
            }
        with open(CONFIG_STORE, "r") as f:
            return json.load(f)

    @staticmethod
    def save_config(config: IdsConfig):
        with open(CONFIG_STORE, "w") as f:
            json.dump(config.model_dump(), f, indent=4)
        
        IDSService.apply_config(config)
        return config.model_dump()

    @staticmethod
    def apply_config(config: IdsConfig):
        """
        In production, this translates the request to systemctl commands
        and generates the massive YAML/CONF files.
        """
        if not config.enabled:
            print("Stopping all IDS engines...")
            return

        mode_str = "IPS (Prevention/NFQ)" if config.mode == "prevention" else "IDS (Detection)"
        print(f"Applying {config.engine.upper()} ruleset in {mode_str} mode on interfaces: {config.interfaces}")

    @staticmethod
    def generate_mock_logs():
        """ Helper function to seed mock logs for testing the UI """
        os.makedirs("/var/log/suricata", exist_ok=True)
        os.makedirs("/var/log/snort", exist_ok=True)
        
        suricata_mock = '{"timestamp":"2026-02-23T10:15:30.000000+0000","event_type":"alert","src_ip":"192.168.1.100","dest_ip":"8.8.8.8","alert":{"action":"allowed","signature":"ET MALWARE Suspicious User-Agent","category":"A Network Trojan was detected","severity":1}}\n'
        with open(SURICATA_LOG, "w") as f:
            f.write(suricata_mock * 3)
            
        snort_mock = '{"timestamp":"26/02/23-10:15:32.00000","action":"allow","src_addr":"10.0.0.50","dst_addr":"104.28.14.3","class_desc":"Misc activity","msg":"GPL ICMP_INFO PING *NIX","priority":3}\n'
        with open(SNORT_LOG, "w") as f:
            f.write(snort_mock * 2)

    @staticmethod
    def get_recent_alerts(limit=50):
        config = IDSService.get_config()
        alerts = []
        
        # In a real environment, you'd parse logs dynamically.
        # For this MVP, we will read the mock logs to demonstrate the parser wrapper.
        if not os.path.exists(SURICATA_LOG) or not os.path.exists(SNORT_LOG):
            IDSService.generate_mock_logs()

        try:
            if config.get("engine") == "suricata":
                with open(SURICATA_LOG, "r") as f:
                    for line in f.readlines():
                        if not line.strip(): continue
                        data = json.loads(line)
                        if data.get("event_type") == "alert":
                            alerts.append({
                                "timestamp": data.get("timestamp"),
                                "source_ip": data.get("src_ip"),
                                "dest_ip": data.get("dest_ip"),
                                "signature": data.get("alert", {}).get("signature", "Unknown"),
                                "severity": data.get("alert", {}).get("severity", 3),
                                "category": data.get("alert", {}).get("category", "Generic"),
                                "engine": "Suricata"
                            })
            else: # Snort 3 logic
                with open(SNORT_LOG, "r") as f:
                    for line in f.readlines():
                        if not line.strip(): continue
                        data = json.loads(line)
                        alerts.append({
                            "timestamp": data.get("timestamp"),
                            "source_ip": data.get("src_addr"),
                            "dest_ip": data.get("dst_addr"),
                            "signature": data.get("msg", "Unknown"),
                            "severity": data.get("priority", 3),
                            "category": data.get("class_desc", "Generic"),
                            "engine": "Snort"
                        })
        except Exception as e:
            print(f"Error parsing logs: {e}")
            
        return alerts[:limit]

import socket
from zeroconf import ServiceInfo, Zeroconf

_zeroconf = None
_info = None

def advertise(app_name: str, port: int, local_ip: str):
  global _zeroconf, _info

  # convert string to bytes
  packed_ip = socket.inet_aton(local_ip)

  _info = ServiceInfo(
    # standard http service over tcp
    "_http._tcp.local.",
    # full service name
    f"{app_name}._http._tcp.local.",

    addresses=[packed_ip],
    port=port,

    properties={
      "path": "/",
      "version": "1.0",
    },

    server=f"{app_name}.local."
  )

  _zeroconf = Zeroconf()
  _zeroconf.register_service(_info)
  print(f"mDNS: https://{app_name}.local:{port}")
  return _zeroconf

def stop():
  global _zeroconf, _info

  if _zeroconf and _info:
    _zeroconf.unregister_service(_info)
    _zeroconf.close()
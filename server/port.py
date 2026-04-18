import socket

# AF_INET = iPv4, SOCK_STREAM = TCP, SOCK_DGRAM = UDP
def find_free_port(start=7676, end=7776):
  for port in range(start, end):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
      try:
        s.bind(("", port))
        return port
      except OSError:
        continue
  raise RuntimeError("No free port found")

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except:
        return "127.0.0.1"
    finally:
        s.close()
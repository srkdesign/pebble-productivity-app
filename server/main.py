from server.db.session import engine, SessionLocal
from server.models.base import Base
from server.services.project_service import ensure_default_project
from server.port import find_free_port, get_local_ip
from server.certs import get_or_create_cert
from server.mdns import advertise, stop
import ssl, threading, webbrowser, time, atexit
from waitress import create_server
from server.app import app

def start():
  # Init DB
  Base.metadata.create_all(engine)
  session = SessionLocal()
  ensure_default_project(session)
  session.close()

  # Network Setup
  port = find_free_port()
  ip = get_local_ip()
  cert, key = get_or_create_cert()

  # mDNS
  zc = advertise("pebble", port, ip)
  atexit.register(stop)

  # Waitress
  ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
  ssl_ctx.load_cert_chain(cert, key)

  server = create_server(app, host="0.0.0.0", port=port)
  server.socket = ssl_ctx.wrap_socket(server.socket, server_side=True)

  url = f"https://localhost:{port}"
  print(f"\n  Local:   {url}")
  print(f"  Network: https://{ip}:{port}\n")

  server.run()

if __name__ == "__main__":
  start()
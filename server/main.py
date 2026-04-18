from server.db.session import engine, SessionLocal
from server.models.base import Base
from server.services.project_service import ensure_default_project
from server.port import find_free_port, get_local_ip
from server.certs import get_or_create_cert
from server.mdns import advertise, stop
import ssl, atexit
from server.app import app

from wsgiref.simple_server import WSGIServer, WSGIRequestHandler
from socketserver import ThreadingMixIn

class SilentHandler(WSGIRequestHandler):
  def log_message(self, format, *args):
    pass

class ThreadedHTTPSServer(ThreadingMixIn, WSGIServer):
  daemon_threads = True

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

  # SSL Context
  ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
  ssl_ctx.minimum_version = ssl.TLSVersion.TLSv1_2
  ssl_ctx.load_cert_chain(certfile=cert, keyfile=key)

  # Server
  server = ThreadedHTTPSServer(("0.0.0.0", port), SilentHandler)
  server.set_app(app)
  server.socket = ssl_ctx.wrap_socket(server.socket, server_side=True)

  url = f"https://localhost:{port}"
  print(f"\n  Local:   {url}")
  print(f"  Network: https://{ip}:{port}\n")
  print("Press Ctrl/Cmd + C to stop\n")

  try:
    server.serve_forever()
  except KeyboardInterrupt:
    print("\n Shutting Down...")
    server.shutdown()

if __name__ == "__main__":
  start()
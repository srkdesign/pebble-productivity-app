import sys, os
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric import rsa
import socket, ipaddress
from cryptography import x509
from cryptography.x509.oid import NameOID
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives import hashes, serialization


def get_app_dir():
  if getattr(sys, "frozen", False):
    return os.path.dirname(sys.executable)
  else:
    return os.path.dirname(os.path.abspath(__file__))

CERT_DIR = Path(get_app_dir()) / "certs"

def get_or_create_cert():
  CERT_DIR.mkdir(parents=True, exist_ok=True)

  cert_file = CERT_DIR / "cert.pem"
  key_file = CERT_DIR / "key.pem"

  if cert_file.exists() and key_file.exists():
    return str(cert_file), str(key_file)

  # 65537 - standard public exponent used by every SSL certificate, 2048 - minimum accepted by al browsers
  key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

  # Disocver local IPs at runtime

  hostname = socket.gethostname()
  local_ips = [ipaddress.ip_address("127.0.0.1")]

  try:
    local_ips.append(ipaddress.ip_address(socket.gethostbyname(hostname)))
  except Exception:
    pass


  subject = x509.Name([
    x509.NameAttribute(NameOID.COMMON_NAME, "pebble.local")
  ])

  cert = (
    x509.CertificateBuilder().subject_name(subject).issuer_name(subject).public_key(key.public_key()).serial_number(x509.random_serial_number()).not_valid_before(datetime.now(timezone.utc)).not_valid_after(datetime.now(timezone.utc) + timedelta(days=365))
  ).add_extension(x509.SubjectAlternativeName([
    x509.DNSName("localhost"),
    x509.DNSName(hostname),
    *[x509.IPAddress(ip) for ip in local_ips],
  ]), critical=False).sign(key, hashes.SHA256())

  cert_file.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
  key_file.write_bytes(key.private_bytes(
    serialization.Encoding.PEM,
    serialization.PrivateFormat.TraditionalOpenSSL,
    serialization.NoEncryption(),
  ))

  return str(cert_file), str(key_file)


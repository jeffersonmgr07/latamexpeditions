#!/usr/bin/env python3
"""Genera auth-config.json a partir del catálogo (única fuente de verdad).
Uso: python3 tools/build_auth_config.py
No publicar aquí claves secretas ni tokens.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "assets/data/catalog.json"
OUTPUT = ROOT / "assets/data/auth-config.json"

def main():
    booking = json.loads(CATALOG.read_text(encoding="utf-8"))["booking"]
    fields = ("endpoint", "googleClientId")
    if not all(booking.get(field) for field in fields):
        raise ValueError("Faltan endpoint/googleClientId en el catálogo.")
    data = {"booking": {field: booking[field] for field in fields}}
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Configuración pública de autenticación actualizada.")

if __name__ == "__main__":
    main()

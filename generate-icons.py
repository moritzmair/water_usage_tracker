#!/usr/bin/env python3
"""
Generiert PNG-Icons aus der SVG-Datei.
Benötigt: pip install cairosvg
"""

import cairosvg
import os

def generate_icons():
    sizes = [192, 512]
    
    if not os.path.exists('icon.svg'):
        print("Fehler: icon.svg nicht gefunden!")
        return
    
    for size in sizes:
        output_file = f'icon-{size}.png'
        cairosvg.svg2png(
            url='icon.svg',
            write_to=output_file,
            output_width=size,
            output_height=size
        )
        print(f"✓ {output_file} erstellt")
    
    print("\nAlle Icons erfolgreich generiert!")
    print("\nAlternativ: Online SVG zu PNG Konverter verwenden:")
    print("- https://cloudconvert.com/svg-to-png")
    print("- icon.svg hochladen")
    print("- Größe auf 192x192 und 512x512 einstellen")
    print("- Als icon-192.png und icon-512.png speichern")

if __name__ == '__main__':
    try:
        generate_icons()
    except ImportError:
        print("cairosvg nicht installiert.")
        print("\nInstallation:")
        print("  pip install cairosvg")
        print("\nOder Icons manuell erstellen:")
        print("1. icon.svg in einem Online-Konverter öffnen")
        print("2. https://cloudconvert.com/svg-to-png")
        print("3. 192x192 und 512x512 PNG erstellen")
        print("4. Als icon-192.png und icon-512.png speichern")
    except Exception as e:
        print(f"Fehler: {e}")

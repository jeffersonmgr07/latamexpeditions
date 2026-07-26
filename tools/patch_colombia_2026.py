#!/usr/bin/env python3
"""Unifica Colombia: catálogo, páginas, precios, hoteles, categorías e imágenes.

Ejecutar desde la raíz del proyecto:
    python tools/patch_colombia_2026.py
"""
from __future__ import annotations

import html
import json
import math
import re
import sys
from pathlib import Path
from typing import Iterable

from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import partials as P  # noqa: E402

CATALOG_PATH = ROOT / "assets/data/catalog.json"
I18N_PATH = ROOT / "assets/data/i18n/en/content.json"
IMG_DIR = ROOT / "assets/img"

PRICE_FROM = {
    "bogota-esencial": 329,
    "bogota-zipaquira-y-guatavita": 459,
    "bogota-y-villa-de-leyva": 469,
    "medellin-esencial": 299,
    "medellin-cultural-y-cafetera": 399,
    "medellin-guatape-y-pueblos-de-antioquia": 529,
    "cartagena-esencial": 349,
    "cartagena-caribe": 469,
    "cartagena-islas-premium": 599,
    "santa-marta-tayrona-y-minca": 369,
    "santa-marta-y-caribe-natural": 499,
    "ciudad-perdida-trek": 749,
    "eje-cafetero-esencial": 299,
    "eje-cafetero-completo": 419,
    "eje-cafetero-familiar": 529,
    "cali-salsa-y-cultura": 349,
    "cali-y-valle-del-cauca": 449,
    "san-andres-caribe": 499,
    "san-andres-completo": 649,
    "cartagena-y-santa-marta": 649,
    "cali-y-eje-cafetero": 549,
    "medellin-y-eje-cafetero": 549,
    "medellin-y-cartagena": 649,
    "bogota-y-medellin": 649,
    "bogota-medellin-y-cartagena": 949,
}

HOTELS = {
    "Bogotá": {
        "3e": "ibis Bogotá Museo",
        "4e": "Hotel B3 Virrey",
        "5e": "Sofitel Bogotá Victoria Regia",
    },
    "Medellín": {
        "3e": "ibis Medellín",
        "4e": "Sites Hotel Medellín",
        "5e": "Medellín Marriott Hotel",
    },
    "Cartagena": {
        "3e": "Hotel Don Pedro de Heredia",
        "4e": "Holiday Inn Express Cartagena Bocagrande",
        "5e": "Hyatt Regency Cartagena",
    },
    "Santa Marta": {
        "3e": "Hotel Tayromar",
        "4e": "Best Western Plus Santa Marta Hotel",
        "5e": "Santa Marta Marriott Resort Playa Dormida",
    },
    "Eje Cafetero": {
        "3e": "Salento Real Eje Cafetero",
        "4e": "Hotel Mocawa Plaza Armenia",
        "5e": "Bio Habitat Hotel",
    },
    "Cali": {
        "3e": "ibis Cali Granada",
        "4e": "Hotel Dann Cali",
        "5e": "Movich Casa del Alférez",
    },
    "San Andrés": {
        "3e": "Sea Colors Hotel",
        "4e": "Hotel Casablanca",
        "5e": "Aquamare Hotel",
    },
    "Villa de Leyva": {
        "3e": "Hotel Casa de los Fundadores",
        "4e": "Hotel Casa Terra",
        "5e": "Hospedería Duruelo",
    },
    "Sierra Nevada": {
        "3e": "Campamentos autorizados del trek + Hotel Tayromar",
        "4e": "Campamentos autorizados del trek + Best Western Plus Santa Marta",
        "5e": "Campamentos autorizados del trek + Santa Marta Marriott Playa Dormida",
    },
}

PACKAGE_HOTEL_CITIES = {
    "bogota-esencial": ["Bogotá"],
    "bogota-zipaquira-y-guatavita": ["Bogotá"],
    "bogota-y-villa-de-leyva": ["Bogotá", "Villa de Leyva"],
    "medellin-esencial": ["Medellín"],
    "medellin-cultural-y-cafetera": ["Medellín"],
    "medellin-guatape-y-pueblos-de-antioquia": ["Medellín"],
    "cartagena-esencial": ["Cartagena"],
    "cartagena-caribe": ["Cartagena"],
    "cartagena-islas-premium": ["Cartagena"],
    "santa-marta-tayrona-y-minca": ["Santa Marta"],
    "santa-marta-y-caribe-natural": ["Santa Marta"],
    "ciudad-perdida-trek": ["Sierra Nevada"],
    "eje-cafetero-esencial": ["Eje Cafetero"],
    "eje-cafetero-completo": ["Eje Cafetero"],
    "eje-cafetero-familiar": ["Eje Cafetero"],
    "cali-salsa-y-cultura": ["Cali"],
    "cali-y-valle-del-cauca": ["Cali"],
    "san-andres-caribe": ["San Andrés"],
    "san-andres-completo": ["San Andrés"],
    "cartagena-y-santa-marta": ["Cartagena", "Santa Marta"],
    "cali-y-eje-cafetero": ["Cali", "Eje Cafetero"],
    "medellin-y-eje-cafetero": ["Medellín", "Eje Cafetero"],
    "medellin-y-cartagena": ["Medellín", "Cartagena"],
    "bogota-y-medellin": ["Bogotá", "Medellín"],
    "bogota-medellin-y-cartagena": ["Bogotá", "Medellín", "Cartagena"],
}

STYLE_LABELS = {
    "aventura": "Aventura",
    "playa": "Playa y verano",
    "familia": "En familia",
    "cultura": "Cultura viva",
    "naturaleza": "Naturaleza",
    "gastronomia": "Gastronomía",
}

# Clasificación múltiple realista. Un producto puede aparecer en varias selecciones.
STYLE_OVERRIDES = {
    "cartagena-centro-getsemani": ["cultura", "familia"],
    "islas-rosario-baru": ["playa", "naturaleza", "familia"],
    "city-tour-medellin": ["cultura", "familia"],
    "comuna-13-medellin": ["cultura", "familia"],
    "guatape-piedra-penol": ["naturaleza", "cultura", "familia", "aventura"],
    "tour-pablo-escobar": ["cultura"],
    "parapente-medellin": ["aventura", "naturaleza"],
    "medellin-nocturno-gastronomia-rooftops": ["gastronomia", "cultura"],
    "bogota-monserrate-candelaria": ["cultura", "familia"],
    "zipaquira-catedral-de-sal": ["cultura", "familia"],
    "guatavita-zipaquira": ["cultura", "naturaleza", "familia"],
    "villa-de-leyva-full-day": ["cultura", "familia"],
    "rosario-vip-catamaran": ["playa", "naturaleza", "familia"],
    "bahia-cholon": ["playa"],
    "volcan-totumo": ["aventura", "naturaleza", "familia"],
    "cartagena-gastronomica": ["gastronomia", "cultura", "familia"],
    "cartagena-nocturna": ["cultura", "gastronomia"],
    "chiva-rumbera-cartagena": ["cultura"],
    "santa-marta-city-tour": ["cultura", "familia"],
    "parque-tayrona-full-day": ["naturaleza", "playa", "aventura"],
    "minca-cascadas-cafe": ["naturaleza", "aventura", "familia", "gastronomia"],
    "playa-cristal-siete-olas": ["playa", "naturaleza", "familia"],
    "ciudad-perdida-4-dias": ["aventura", "naturaleza"],
    "ciudad-perdida-5-dias": ["aventura", "naturaleza"],
    "valle-cocora-salento": ["naturaleza", "cultura", "familia", "aventura"],
    "tour-cafe-colombiano": ["gastronomia", "cultura", "familia"],
    "filandia-miradores": ["cultura", "naturaleza", "familia"],
    "parque-del-cafe": ["familia", "cultura"],
    "termales-santa-rosa-cabal": ["naturaleza", "familia"],
    "cali-city-tour": ["cultura", "familia"],
    "cali-tour-salsa": ["cultura"],
    "hacienda-el-paraiso": ["cultura", "familia"],
    "gastronomia-valle-cauca": ["gastronomia", "cultura", "familia"],
    "san-andres-johnny-cay-acuario": ["playa", "naturaleza", "familia"],
    "san-andres-vuelta-isla": ["playa", "cultura", "familia"],
    "san-andres-mantarrayas": ["naturaleza", "playa", "familia"],
    "san-andres-snorkel-sea-walk": ["aventura", "playa", "naturaleza"],
    "san-andres-catamaran": ["playa", "familia"],
    "chicamocha-panachi": ["naturaleza", "aventura", "familia"],
    "barichara-full-day": ["cultura", "familia"],
    "santander-aventura-rafting-canopy": ["aventura", "naturaleza"],
    "desierto-tatacoa": ["naturaleza", "aventura", "familia"],
    "san-agustin-arqueologico": ["cultura", "naturaleza", "familia"],
    "leticia-tres-fronteras": ["cultura", "naturaleza", "familia"],
    "comunidad-ticuna-amazonas": ["cultura", "naturaleza", "familia"],
    "rio-amazonas-delfines-rosados": ["naturaleza", "familia"],
    "avistamiento-ballenas-pacifico": ["naturaleza", "familia"],
    "nuqui-playas-termales": ["naturaleza", "playa", "aventura"],
    "bahia-solano-playas-pacifico": ["naturaleza", "playa", "aventura"],
    "cano-cristales": ["naturaleza", "aventura"],
}

PACKAGE_STYLE_OVERRIDES = {
    "bogota-esencial": ["cultura", "familia"],
    "bogota-zipaquira-y-guatavita": ["cultura", "naturaleza", "familia"],
    "bogota-y-villa-de-leyva": ["cultura", "familia"],
    "medellin-esencial": ["cultura", "familia"],
    "medellin-cultural-y-cafetera": ["cultura", "gastronomia", "familia"],
    "medellin-guatape-y-pueblos-de-antioquia": ["cultura", "naturaleza", "familia"],
    "cartagena-esencial": ["cultura", "playa", "familia"],
    "cartagena-caribe": ["cultura", "playa", "naturaleza", "familia"],
    "cartagena-islas-premium": ["playa", "naturaleza", "familia"],
    "santa-marta-tayrona-y-minca": ["cultura", "playa", "naturaleza", "familia"],
    "santa-marta-y-caribe-natural": ["cultura", "playa", "naturaleza", "familia"],
    "ciudad-perdida-trek": ["aventura", "naturaleza"],
    "eje-cafetero-esencial": ["cultura", "naturaleza", "gastronomia", "familia"],
    "eje-cafetero-completo": ["cultura", "naturaleza", "gastronomia", "familia"],
    "eje-cafetero-familiar": ["familia", "naturaleza", "cultura", "gastronomia"],
    "cali-salsa-y-cultura": ["cultura", "gastronomia"],
    "cali-y-valle-del-cauca": ["cultura", "gastronomia", "familia"],
    "san-andres-caribe": ["playa", "naturaleza", "familia"],
    "san-andres-completo": ["playa", "naturaleza", "familia"],
    "cartagena-y-santa-marta": ["cultura", "playa", "naturaleza", "familia"],
    "cali-y-eje-cafetero": ["cultura", "naturaleza", "gastronomia", "familia"],
    "medellin-y-eje-cafetero": ["cultura", "naturaleza", "gastronomia", "familia"],
    "medellin-y-cartagena": ["cultura", "playa", "familia"],
    "bogota-y-medellin": ["cultura", "familia"],
    "bogota-medellin-y-cartagena": ["cultura", "playa", "familia"],
}

GENERIC_TRANSLATIONS = {
    "Información esencial del tour": "Essential tour information",
    "Información del paquete": "Package information",
    "Precio desde": "Price from",
    "por persona": "per person",
    "Reservar": "Book now",
    "Reservar ahora": "Book now",
    "Elegir país": "Choose country",
    "En familia": "Family travel",
    "Playa y verano": "Beach & summer",
    "Cultura viva": "Living culture",
    "Categorías de alojamiento": "Accommodation categories",
    "Itinerario día a día": "Day-by-day itinerary",
    "Horario referencial": "Reference schedule",
    "Los horarios pueden ajustarse por vuelos, clima, tráfico, disponibilidad y operación local. El voucher final confirma la hora exacta.": "Schedules may change due to flights, weather, traffic, availability and local operations. Your final voucher confirms the exact time.",
    "Ocupación": "Room occupancy",
    "Habitación simple": "Single room",
    "Habitación doble": "Twin room",
    "Habitación matrimonial": "Double room",
    "Habitación triple": "Triple room",
    "Habitación familiar": "Family room",
    "Adultos": "Adults",
    "Niños": "Children",
    "Total de viajeros": "Total travelers",
    "Nacionalidad": "Nationality",
    "Carnet de extranjería": "Foreigner ID card",
    "Selecciona una nacionalidad": "Select a nationality",
    "Selecciona la categoría y ocupación para ver el precio final.": "Select the hotel category and room occupancy to see the final price.",
    "Tarifa referencial por persona en habitación doble o matrimonial.": "Reference price per person in a twin or double room.",
    "Hoteles previstos": "Planned hotels",
    "Precio por persona": "Price per person",
    "Simple": "Single",
    "Doble / matrimonial": "Twin / double",
    "Triple": "Triple",
    "Familiar": "Family",
    "El precio infantil se calcula al 70% de la tarifa adulta seleccionada. Puede variar si un proveedor aplica una política distinta.": "The child price is calculated at 70% of the selected adult fare. It may vary when a supplier applies a different policy.",
    "Tarifas dinámicas": "Dynamic rates",
    "Precios referenciales actualizados en julio de 2026. Pueden variar por fecha, ocupación, temporada, disponibilidad, eventos y tipo de cambio del proveedor.": "Reference prices updated in July 2026. They may change by date, occupancy, season, availability, events and the supplier's exchange rate.",
    "Desayuno en el hotel": "Breakfast at the hotel",
    "Recogida o inicio de actividades": "Pickup or start of activities",
    "Desarrollo del programa": "Program activities",
    "Tiempo para almuerzo": "Lunch break",
    "Continuación de visitas": "Continuation of sightseeing",
    "Retorno al hotel o tiempo libre": "Return to the hotel or free time",
    "Recepción y traslado privado o compartido al hotel": "Meet-and-greet and private or shared transfer to the hotel",
    "Registro en el hotel y tiempo para instalarse": "Hotel check-in and time to settle in",
    "Orientación inicial y recomendaciones para la cena": "Initial briefing and dinner recommendations",
    "Desayuno y verificación del horario de salida": "Breakfast and confirmation of departure time",
    "Traslado al aeropuerto o terminal": "Transfer to the airport or bus terminal",
    "Fin de nuestros servicios": "End of our services",
    "Traslado entre ciudades": "Transfer between cities",
    "Llegada, recepción y registro en el nuevo hotel": "Arrival, meet-and-greet and check-in at the new hotel",
    "Cena libre y descanso": "Dinner on your own and overnight stay",
}

COUNTRY_FLAGS = {
    "Perú": "🇵🇪", "Colombia": "🇨🇴", "Chile": "🇨🇱", "Argentina": "🇦🇷",
    "Bolivia": "🇧🇴", "Brasil": "🇧🇷", "Ecuador": "🇪🇨", "México": "🇲🇽",
    "Venezuela": "🇻🇪", "Uruguay": "🇺🇾", "Costa Rica": "🇨🇷", "Otro país": "🌎",
}


def round_9(value: float) -> int:
    return max(9, int(math.ceil((value + 1) / 10.0) * 10 - 1))


def parse_nights(code: str) -> int:
    m = re.search(r"/(\d+)N", code or "")
    return int(m.group(1)) if m else 3


def package_hotels(slug: str, code: str) -> list[str]:
    names = []
    for city in PACKAGE_HOTEL_CITIES.get(slug, ["Bogotá"]):
        names.append(HOTELS[city][code])
    return names


def build_tiers(pkg: dict) -> list[dict]:
    base = PRICE_FROM[pkg["slug"]]
    nights = parse_nights(pkg["nights"])
    city_count = len(PACKAGE_HOTEL_CITIES.get(pkg["slug"], [])) or 1
    prices = {
        "3e": base,
        "4e": round_9(base + 38 * nights + 25 * (city_count - 1)),
        "5e": round_9(base + 115 * nights + 75 * (city_count - 1)),
    }
    names = {"3e": ("Turista", "Standard", "3★"), "4e": ("Primera", "Superior", "4★"), "5e": ("Lujo", "Luxury", "5★")}
    tiers = []
    for code in ("3e", "4e", "5e"):
        p = prices[code]
        tiers.append({
            "code": code,
            "stars": names[code][2],
            "name": names[code][0],
            "nameEn": names[code][1],
            "pricePerPerson": p,
            "hotels": package_hotels(pkg["slug"], code),
            "occupancyPrices": {
                "single": round_9(p * 1.40),
                "double": p,
                "matrimonial": p,
                "triple": round_9(p * 0.94),
                "family": round_9(p * 0.92),
            },
        })
    return tiers


def add_translation(dic: dict, es: str | None, en: str | None) -> None:
    if not es or not en:
        return
    es = re.sub(r"\s+", " ", es).strip()
    en = re.sub(r"\s+", " ", en).strip()
    if es and en and es != en:
        dic[es] = en


def split_day(text: str) -> tuple[str, str]:
    parts = re.split(r"\s*[·:]\s*", text, maxsplit=1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return "Día", text


def detailed_schedule(es_day: str, en_day: str) -> list[tuple[str, str, str, str]]:
    """Build a realistic reference schedule without presenting estimated times as guaranteed."""
    _, es_desc = split_day(es_day)
    _, en_desc = split_day(en_day)
    low = es_desc.lower()

    def rows(*items: tuple[str, str, str, str]) -> list[tuple[str, str, str, str]]:
        return list(items)

    # Arrival and final departure days depend on the passenger's flight.
    if any(w in low for w in ["llegada", "arribo"]):
        return rows(
            ("Según vuelo", "Recepción y traslado privado o compartido al hotel", "According to flight", "Meet-and-greet and private or shared transfer to the hotel"),
            ("14:00", "Registro en el hotel y tiempo para instalarse", "2:00 PM", "Hotel check-in and time to settle in"),
            ("18:00", "Orientación inicial y recomendaciones para la cena", "6:00 PM", "Initial briefing and dinner recommendations"),
        )
    if any(w in low for w in ["traslado de salida", "salida desde", "fin del viaje", "regreso a casa"]) or ("aeropuerto" in low and "vuelo a" not in low and "vuelo doméstico" not in low):
        return rows(
            ("07:00", "Desayuno y verificación del horario de salida", "7:00 AM", "Breakfast and confirmation of departure time"),
            ("Según vuelo", "Traslado al aeropuerto o terminal", "According to flight", "Transfer to the airport or bus terminal"),
            ("—", "Fin de nuestros servicios", "—", "End of our services"),
        )

    # Lost City requires trekking logistics rather than a conventional city-tour template.
    if "el mamey" in low and "inicio" in low:
        return rows(
            ("07:00", "Recogida en Santa Marta y salida en vehículo hacia El Mamey", "7:00 AM", "Pickup in Santa Marta and road transfer to El Mamey"),
            ("11:30", "Almuerzo y charla de seguridad con el guía local", "11:30 AM", "Lunch and safety briefing with the local guide"),
            ("13:00", "Inicio de la caminata por la Sierra Nevada", "1:00 PM", "Start of the hike through the Sierra Nevada"),
            ("17:00", "Llegada al primer campamento, cena y descanso", "5:00 PM", "Arrival at the first camp, dinner and overnight stay"),
        )
    if "trekking por la sierra nevada" in low:
        return rows(
            ("05:30", "Desayuno y preparación del equipo", "5:30 AM", "Breakfast and gear preparation"),
            ("06:30", "Caminata por senderos de la Sierra Nevada y territorios de comunidades locales", "6:30 AM", "Hike along Sierra Nevada trails and through local community territories"),
            ("12:00", "Almuerzo y descanso en ruta", "12:00 PM", "Lunch and rest along the route"),
            ("13:30", "Continuación de la caminata hacia el siguiente campamento", "1:30 PM", "Continue hiking toward the next camp"),
            ("17:00", "Llegada al campamento, cena y descanso", "5:00 PM", "Arrival at camp, dinner and overnight stay"),
        )
    if "ciudad perdida" in low and ("ascenso" in low or "visita guiada" in low):
        return rows(
            ("05:00", "Desayuno temprano y salida hacia las escalinatas de Teyuna", "5:00 AM", "Early breakfast and departure toward the Teyuna stairway"),
            ("07:00", "Ascenso final y recorrido guiado por las terrazas de Ciudad Perdida", "7:00 AM", "Final ascent and guided tour of the Lost City terraces"),
            ("10:30", "Descenso y retorno por el sendero", "10:30 AM", "Descent and return along the trail"),
            ("12:30", "Almuerzo en ruta", "12:30 PM", "Lunch along the route"),
            ("17:00", "Llegada al campamento, cena y descanso", "5:00 PM", "Arrival at camp, dinner and overnight stay"),
        )
    if "inicio del retorno" in low and "campamento" in low:
        return rows(
            ("05:30", "Desayuno y organización del equipaje", "5:30 AM", "Breakfast and luggage preparation"),
            ("06:30", "Inicio del retorno por los senderos de la Sierra Nevada", "6:30 AM", "Start the return hike along Sierra Nevada trails"),
            ("12:00", "Almuerzo y descanso en ruta", "12:00 PM", "Lunch and rest along the route"),
            ("13:30", "Continuación hacia el campamento de la última noche", "1:30 PM", "Continue toward the final-night camp"),
            ("17:00", "Llegada, cena y descanso en campamento", "5:00 PM", "Arrival, dinner and overnight stay at camp"),
        )
    if "caminata a el mamey" in low:
        return rows(
            ("05:30", "Desayuno y salida del campamento", "5:30 AM", "Breakfast and departure from camp"),
            ("06:30", "Último tramo de caminata hacia El Mamey", "6:30 AM", "Final hiking section toward El Mamey"),
            ("11:30", "Almuerzo y cierre de la expedición", "11:30 AM", "Lunch and trek debrief"),
            ("13:00", "Traslado por carretera de regreso a Santa Marta", "1:00 PM", "Road transfer back to Santa Marta"),
            ("17:00", "Llegada aproximada a Santa Marta", "5:00 PM", "Approximate arrival in Santa Marta"),
        )

    # Combined sightseeing + transfer days.
    if "zipaquirá" in low and any(w in low for w in ["vuelo", "continuación"]):
        return rows(
            ("06:30", "Desayuno, salida del hotel y viaje hacia Zipaquirá", "6:30 AM", "Breakfast, hotel departure and transfer toward Zipaquirá"),
            ("09:00", "Ingreso y recorrido por la Catedral de Sal", "9:00 AM", "Admission and tour of the Salt Cathedral"),
            ("11:30", "Tiempo breve en el centro histórico y almuerzo", "11:30 AM", "Brief time in the historic center and lunch"),
            ("14:00", "Continuación por carretera o traslado al aeropuerto, según el programa", "2:00 PM", "Continue by road or transfer to the airport, according to the program"),
            ("Según salida", "Llegada al nuevo destino y traslado al hotel", "According to departure", "Arrival at the new destination and hotel transfer"),
        )
    if "vuelo" in low and "cartagena" in low and "centro histórico" in low:
        return rows(
            ("07:00", "Desayuno, salida del hotel y traslado al aeropuerto", "7:00 AM", "Breakfast, hotel departure and airport transfer"),
            ("Según vuelo", "Vuelo doméstico a Cartagena", "According to flight", "Domestic flight to Cartagena"),
            ("14:00", "Recepción, traslado y registro en el hotel", "2:00 PM", "Meet-and-greet, transfer and hotel check-in"),
            ("16:30", "Caminata introductoria por el centro histórico, según la hora de llegada", "4:30 PM", "Introductory historic-center walk, depending on arrival time"),
            ("19:00", "Cena libre y descanso", "7:00 PM", "Dinner on your own and overnight stay"),
        )
    if "traslado terrestre a santa marta" in low:
        return rows(
            ("07:00", "Desayuno y salida del hotel en Cartagena", "7:00 AM", "Breakfast and hotel departure in Cartagena"),
            ("08:30", "Traslado terrestre hacia Santa Marta", "8:30 AM", "Road transfer toward Santa Marta"),
            ("13:00", "Llegada, almuerzo y registro en el hotel", "1:00 PM", "Arrival, lunch and hotel check-in"),
            ("15:30", "Recorrido introductorio por el centro histórico y la bahía", "3:30 PM", "Introductory tour of the historic center and bay"),
            ("18:00", "Retorno al hotel", "6:00 PM", "Return to the hotel"),
        )

    # Inter-city transfer days.
    if any(w in low for w in ["vuelo a", "vuelo doméstico", "traslado a ", "traslado al ", "traslado hacia", "traslado terrestre", "viaje a ", "continuación hacia", "regreso a bogotá"]):
        return rows(
            ("07:00", "Desayuno y salida del hotel", "7:00 AM", "Breakfast and hotel departure"),
            ("Según salida", "Traslado entre ciudades por vía aérea o terrestre, según el programa", "According to departure", "Air or road transfer between cities, according to the program"),
            ("14:00", "Llegada, recepción y registro en el nuevo hotel", "2:00 PM", "Arrival, meet-and-greet and check-in at the new hotel"),
            ("16:00", "Orientación del destino y tiempo libre", "4:00 PM", "Destination orientation and free time"),
            ("19:00", "Cena libre y descanso", "7:00 PM", "Dinner on your own and overnight stay"),
        )

    # Bogotá and Boyacá.
    if "monserrate" in low or ("bogotá histórica" in low and "zipaquirá" not in low):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:30", "Recogida y traslado al centro histórico", "8:30 AM", "Pickup and transfer to the historic center"),
            ("09:00", "Ascenso a Monserrate y vista panorámica de Bogotá", "9:00 AM", "Ascent to Monserrate and panoramic views of Bogotá"),
            ("11:00", "Recorrido por La Candelaria y la Plaza de Bolívar", "11:00 AM", "Walking tour through La Candelaria and Bolívar Square"),
            ("13:00", "Tiempo para almuerzo", "1:00 PM", "Lunch break"),
            ("14:30", "Visita al Museo del Oro y/o Museo Botero, según disponibilidad", "2:30 PM", "Visit to the Gold Museum and/or Botero Museum, subject to availability"),
            ("17:30", "Retorno al hotel", "5:30 PM", "Return to the hotel"),
        )
    if "zipaquirá" in low and "vuelo" not in low and "continuación" not in low:
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Salida desde Bogotá hacia Zipaquirá", "8:00 AM", "Departure from Bogotá toward Zipaquirá"),
            ("10:00", "Ingreso y recorrido guiado por la Catedral de Sal", "10:00 AM", "Admission and guided tour of the Salt Cathedral"),
            ("12:30", "Tiempo para almuerzo", "12:30 PM", "Lunch break"),
            ("14:00", "Caminata por la plaza y el centro histórico de Zipaquirá", "2:00 PM", "Walk through Zipaquirá's main square and historic center"),
            ("17:00", "Retorno a Bogotá", "5:00 PM", "Return to Bogotá"),
        )
    if "guatavita" in low:
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Salida desde Bogotá hacia la reserva de Guatavita", "8:00 AM", "Departure from Bogotá toward the Guatavita reserve"),
            ("10:00", "Caminata interpretativa por el sendero de la Laguna de Guatavita", "10:00 AM", "Interpretive walk along the Guatavita Lagoon trail"),
            ("12:30", "Almuerzo en la zona", "12:30 PM", "Lunch in the area"),
            ("14:00", "Visita al pueblo de Guatavita y sus miradores", "2:00 PM", "Visit to Guatavita town and its viewpoints"),
            ("17:00", "Retorno al hotel en Bogotá", "5:00 PM", "Return to the hotel in Bogotá"),
        )
    if "villa de leyva" in low:
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:30", "Inicio del recorrido por Villa de Leyva", "8:30 AM", "Start of the Villa de Leyva tour"),
            ("09:00", "Plaza Mayor, calles coloniales y principales edificios históricos", "9:00 AM", "Main Square, colonial streets and key historic buildings"),
            ("12:30", "Tiempo para almuerzo", "12:30 PM", "Lunch break"),
            ("14:00", "Visita a atractivos cercanos incluidos en el programa contratado", "2:00 PM", "Visit to nearby attractions included in the booked program"),
            ("17:30", "Retorno al hotel y tiempo libre", "5:30 PM", "Return to the hotel and free time"),
        )

    # Medellín and Antioquia.
    if any(w in low for w in ["comuna 13", "plaza botero"]) or ("medellín" in low and "city tour" in low):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:30", "Recogida e inicio del city tour", "8:30 AM", "Pickup and start of the city tour"),
            ("09:00", "Plaza Botero, Museo de Antioquia y centro de Medellín", "9:00 AM", "Botero Square, Museum of Antioquia and downtown Medellín"),
            ("11:30", "Recorrido en Metro y Metrocable", "11:30 AM", "Metro and Metrocable ride"),
            ("13:00", "Tiempo para almuerzo", "1:00 PM", "Lunch break"),
            ("14:30", "Comuna 13: grafitis, escaleras eléctricas e historia local", "2:30 PM", "Comuna 13: murals, outdoor escalators and local history"),
            ("17:30", "Retorno al hotel", "5:30 PM", "Return to the hotel"),
        )
    if "guatapé" in low or "piedra del peñol" in low:
        return rows(
            ("06:30", "Desayuno y salida desde Medellín", "6:30 AM", "Breakfast and departure from Medellín"),
            ("09:00", "Parada en la Piedra del Peñol y tiempo opcional para el ascenso", "9:00 AM", "Stop at El Peñol Rock with optional time to climb"),
            ("11:30", "Recorrido por los zócalos y la plaza de Guatapé", "11:30 AM", "Tour of Guatapé's colorful zócalos and main square"),
            ("13:00", "Almuerzo en Guatapé", "1:00 PM", "Lunch in Guatapé"),
            ("14:30", "Paseo por el embalse cuando esté incluido en la opción contratada", "2:30 PM", "Reservoir boat ride when included in the booked option"),
            ("18:00", "Retorno aproximado a Medellín", "6:00 PM", "Approximate return to Medellín"),
        )
    if ("finca cafetera" in low and "filandia" not in low) or ("cultivo" in low and "degustación" in low):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:30", "Salida hacia la finca cafetera", "8:30 AM", "Departure toward the coffee farm"),
            ("10:00", "Recorrido por cultivos y explicación de cosecha y beneficio", "10:00 AM", "Tour of the coffee fields and explanation of harvesting and processing"),
            ("12:30", "Almuerzo en la zona", "12:30 PM", "Lunch in the area"),
            ("14:00", "Proceso de tostado, preparación y degustación de café", "2:00 PM", "Roasting, brewing and coffee tasting experience"),
            ("17:00", "Retorno al hotel", "5:00 PM", "Return to the hotel"),
        )
    if "jardín" in low or "jericó" in low:
        return rows(
            ("06:30", "Salida temprana desde Medellín", "6:30 AM", "Early departure from Medellín"),
            ("09:30", "Llegada al pueblo seleccionado y recorrido por su plaza principal", "9:30 AM", "Arrival at the selected town and tour of its main square"),
            ("11:00", "Calles tradicionales, miradores y patrimonio local", "11:00 AM", "Traditional streets, viewpoints and local heritage"),
            ("13:00", "Almuerzo", "1:00 PM", "Lunch"),
            ("14:30", "Tiempo para artesanías, café y recorrido libre", "2:30 PM", "Time for crafts, coffee and independent exploration"),
            ("19:00", "Retorno aproximado a Medellín", "7:00 PM", "Approximate return to Medellín"),
        )

    # Cartagena and Caribbean islands.
    if ("cartagena" in low or "ciudad amurallada" in low) and any(w in low for w in ["histórica", "getsemaní", "castillo", "visita privada"]):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:30", "Recogida e inicio del recorrido", "8:30 AM", "Pickup and start of the tour"),
            ("09:00", "Castillo de San Felipe y panorámica del sector amurallado", "9:00 AM", "San Felipe Castle and panoramic view of the walled district"),
            ("11:00", "Caminata por plazas, murallas y calles del centro histórico", "11:00 AM", "Walk through the squares, walls and streets of the historic center"),
            ("13:00", "Tiempo para almuerzo", "1:00 PM", "Lunch break"),
            ("15:00", "Recorrido cultural y de arte urbano por Getsemaní", "3:00 PM", "Cultural and street-art tour through Getsemaní"),
            ("17:30", "Retorno al hotel", "5:30 PM", "Return to the hotel"),
        )
    if any(w in low for w in ["islas del rosario", "johnny cay", "acuario", "catamarán", "club de playa", "barú", "cholón"]):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Traslado al muelle y registro para la navegación", "8:00 AM", "Transfer to the pier and check-in for the boat trip"),
            ("09:00", es_desc, "9:00 AM", en_desc),
            ("11:00", "Tiempo de playa, baño o actividad acuática incluida", "11:00 AM", "Beach time, swimming or included water activity"),
            ("13:00", "Almuerzo según la opción contratada", "1:00 PM", "Lunch according to the booked option"),
            ("15:30", "Navegación de regreso", "3:30 PM", "Return boat trip"),
            ("17:00", "Retorno al hotel", "5:00 PM", "Return to the hotel"),
        )
    if "volcán del totumo" in low:
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Salida hacia el Volcán del Totumo", "8:00 AM", "Departure toward Totumo Mud Volcano"),
            ("10:00", "Baño de lodo y tiempo para el aseo en la zona", "10:00 AM", "Mud bath and time to rinse off in the area"),
            ("12:30", "Almuerzo o continuación de la experiencia seleccionada", "12:30 PM", "Lunch or continuation of the selected experience"),
            ("16:30", "Retorno a Cartagena", "4:30 PM", "Return to Cartagena"),
        )

    # Santa Marta, Tayrona and Minca.
    if "tayrona" in low or "cabo san juan" in low or "playa cristal" in low:
        return rows(
            ("06:30", "Desayuno y salida desde Santa Marta", "6:30 AM", "Breakfast and departure from Santa Marta"),
            ("08:00", "Ingreso al área autorizada del Parque Tayrona", "8:00 AM", "Entry into the authorized area of Tayrona National Park"),
            ("09:00", "Caminata o navegación hacia el sector previsto, según la opción", "9:00 AM", "Hike or boat ride to the planned sector, depending on the option"),
            ("12:30", "Tiempo de playa y almuerzo", "12:30 PM", "Beach time and lunch"),
            ("15:00", "Inicio del retorno", "3:00 PM", "Start of the return journey"),
            ("17:30", "Llegada aproximada al hotel", "5:30 PM", "Approximate arrival at the hotel"),
        )
    if "minca" in low:
        return rows(
            ("07:00", "Desayuno y salida hacia la Sierra Nevada", "7:00 AM", "Breakfast and departure toward the Sierra Nevada"),
            ("09:00", "Recorrido por una finca de café y cacao", "9:00 AM", "Tour of a coffee and cacao farm"),
            ("12:00", "Almuerzo en Minca", "12:00 PM", "Lunch in Minca"),
            ("13:30", "Caminata y visita a una cascada habilitada", "1:30 PM", "Walk and visit to an accessible waterfall"),
            ("16:00", "Regreso a Santa Marta", "4:00 PM", "Return to Santa Marta"),
            ("17:30", "Llegada al hotel", "5:30 PM", "Arrival at the hotel"),
        )

    # Coffee Region.
    if "cocora" in low or ("salento" in low and "finca" not in low):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Salida hacia Salento y el Valle del Cocora", "8:00 AM", "Departure toward Salento and Cocora Valley"),
            ("09:30", "Caminata interpretativa entre palmas de cera, adaptada al programa", "9:30 AM", "Interpretive walk among wax palms, adapted to the program"),
            ("12:30", "Almuerzo en Salento", "12:30 PM", "Lunch in Salento"),
            ("14:00", "Recorrido por la Calle Real, plaza y miradores", "2:00 PM", "Tour of Calle Real, the main square and viewpoints"),
            ("17:30", "Retorno al alojamiento", "5:30 PM", "Return to the accommodation"),
        )
    if "filandia" in low or ("finca cafetera" in low and "eje" in low):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:30", "Visita a finca cafetera y recorrido del cultivo a la taza", "8:30 AM", "Coffee farm visit and bean-to-cup tour"),
            ("12:30", "Almuerzo", "12:30 PM", "Lunch"),
            ("14:00", "Traslado a Filandia y caminata por el centro tradicional", "2:00 PM", "Transfer to Filandia and walk through its traditional center"),
            ("16:00", "Mirador y tiempo para artesanías o café", "4:00 PM", "Viewpoint and time for crafts or coffee"),
            ("17:30", "Retorno al hotel", "5:30 PM", "Return to the hotel"),
        )
    if "termales" in low:
        return rows(
            ("07:30", "Desayuno en el hotel", "7:30 AM", "Breakfast at the hotel"),
            ("09:00", "Salida hacia Santa Rosa de Cabal", "9:00 AM", "Departure toward Santa Rosa de Cabal"),
            ("10:30", "Ingreso a los termales y tiempo de descanso", "10:30 AM", "Admission to the hot springs and relaxation time"),
            ("13:00", "Almuerzo", "1:00 PM", "Lunch"),
            ("15:00", "Tiempo adicional en piscinas termales o recorrido del entorno", "3:00 PM", "Additional hot-spring time or exploration of the surroundings"),
            ("17:30", "Retorno al alojamiento", "5:30 PM", "Return to the accommodation"),
        )
    if "parque del café" in low:
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Traslado al Parque del Café", "8:00 AM", "Transfer to the Coffee Park"),
            ("09:00", "Ingreso y recorrido por atracciones culturales y recreativas", "9:00 AM", "Admission and access to cultural and recreational attractions"),
            ("13:00", "Almuerzo por cuenta del pasajero o según plan contratado", "1:00 PM", "Lunch on your own or according to the booked plan"),
            ("14:00", "Continuación de actividades y espectáculos programados", "2:00 PM", "Continue with scheduled activities and shows"),
            ("18:00", "Retorno al hotel", "6:00 PM", "Return to the hotel"),
        )
    if "panaca" in low:
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Salida hacia la actividad elegida", "8:00 AM", "Departure toward the selected activity"),
            ("09:00", "Ingreso a PANACA o al complejo termal confirmado", "9:00 AM", "Admission to PANACA or the confirmed hot-spring complex"),
            ("13:00", "Tiempo para almuerzo", "1:00 PM", "Lunch break"),
            ("14:00", "Continuación de actividades", "2:00 PM", "Continuation of activities"),
            ("18:00", "Retorno al hotel", "6:00 PM", "Return to the hotel"),
        )

    # Cali and Valle del Cauca.
    if "salsa" in low and any(w in low for w in ["clase", "espectáculo", "vida nocturna"]):
        return rows(
            ("08:00", "Desayuno y mañana libre", "8:00 AM", "Breakfast and free morning"),
            ("15:00", "Clase de salsa con instructor local", "3:00 PM", "Salsa lesson with a local instructor"),
            ("17:00", "Regreso al hotel y tiempo para prepararse", "5:00 PM", "Return to the hotel and time to get ready"),
            ("20:00", "Salida hacia el espectáculo o circuito cultural nocturno incluido", "8:00 PM", "Departure for the included show or evening cultural circuit"),
            ("23:00", "Retorno coordinado al hotel", "11:00 PM", "Coordinated return to the hotel"),
        )
    if "city tour" in low and ("cali" in low or "gastron" in low):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("09:00", "Recorrido panorámico por los principales sectores de Cali", "9:00 AM", "Panoramic tour of Cali's main districts"),
            ("10:30", "Visita al centro histórico, plazas y referentes culturales", "10:30 AM", "Visit to the historic center, squares and cultural landmarks"),
            ("13:00", "Almuerzo o degustación de cocina vallecaucana", "1:00 PM", "Lunch or tasting of Valle del Cauca cuisine"),
            ("15:00", "Continuación del recorrido y mirador", "3:00 PM", "Continuation of the tour and viewpoint visit"),
            ("17:30", "Retorno al hotel", "5:30 PM", "Return to the hotel"),
        )
    if "hacienda el paraíso" in low:
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Salida hacia el Valle del Cauca", "8:00 AM", "Departure toward Valle del Cauca"),
            ("10:00", "Visita guiada a la Hacienda El Paraíso", "10:00 AM", "Guided visit to Hacienda El Paraíso"),
            ("12:30", "Almuerzo", "12:30 PM", "Lunch"),
            ("14:00", "Recorrido por poblaciones o atractivos cercanos incluidos", "2:00 PM", "Tour of nearby towns or included attractions"),
            ("17:30", "Retorno a Cali", "5:30 PM", "Return to Cali"),
        )

    # San Andrés.
    if "vuelta a la isla" in low:
        return rows(
            ("07:30", "Desayuno en el hotel", "7:30 AM", "Breakfast at the hotel"),
            ("09:00", "Inicio de la vuelta panorámica a San Andrés", "9:00 AM", "Start of the panoramic San Andrés island tour"),
            ("10:00", "Paradas en atractivos costeros incluidos en el circuito", "10:00 AM", "Stops at coastal attractions included in the circuit"),
            ("12:30", "Tiempo para almuerzo", "12:30 PM", "Lunch break"),
            ("14:00", "Continuación por playas y miradores", "2:00 PM", "Continue through beaches and viewpoints"),
            ("16:30", "Retorno al hotel y tarde libre", "4:30 PM", "Return to the hotel and free afternoon"),
        )
    if any(w in low for w in ["mantarrayas", "snorkel"]):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:30", "Traslado al punto de embarque y charla de seguridad", "8:30 AM", "Transfer to the embarkation point and safety briefing"),
            ("09:30", es_desc, "9:30 AM", en_desc),
            ("12:30", "Almuerzo según opción", "12:30 PM", "Lunch according to the selected option"),
            ("14:00", "Continuación de la actividad acuática o tiempo de playa", "2:00 PM", "Continue the water activity or enjoy beach time"),
            ("16:30", "Retorno al hotel", "4:30 PM", "Return to the hotel"),
        )

    # Generic beach day, only after specific island and park rules.
    if any(w in low for w in ["isla", "playa", "navegación"]):
        return rows(
            ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
            ("08:00", "Recogida o inicio de actividades", "8:00 AM", "Pickup or start of activities"),
            ("09:00", es_desc, "9:00 AM", en_desc),
            ("12:30", "Tiempo para almuerzo", "12:30 PM", "Lunch break"),
            ("14:00", "Continuación de la experiencia seleccionada", "2:00 PM", "Continuation of the selected experience"),
            ("17:00", "Retorno al hotel o tiempo libre", "5:00 PM", "Return to the hotel or free time"),
        )

    # Safe generic schedule for any activity not covered above.
    return rows(
        ("07:00", "Desayuno en el hotel", "7:00 AM", "Breakfast at the hotel"),
        ("08:30", "Recogida o inicio de actividades", "8:30 AM", "Pickup or start of activities"),
        ("09:00", es_desc, "9:00 AM", en_desc),
        ("13:00", "Tiempo para almuerzo", "1:00 PM", "Lunch break"),
        ("14:30", "Continuación de la actividad programada", "2:30 PM", "Continuation of the scheduled activity"),
        ("17:30", "Retorno al hotel o tiempo libre", "5:30 PM", "Return to the hotel or free time"),
    )


def el_text(es: str, en: str, tag: str = "span", cls: str = "") -> str:
    attrs = f' class="{cls}"' if cls else ""
    return f'<{tag}{attrs} data-en="{html.escape(en, quote=True)}">{html.escape(es)}</{tag}>'


def package_main(pkg: dict, translations: dict) -> str:
    title = pkg["title"]
    title_en = pkg.get("titleEn") or pkg.get("en", {}).get("title") or title
    excerpt = pkg["excerpt"]
    excerpt_en = pkg.get("excerptEn") or pkg.get("en", {}).get("excerpt") or excerpt
    tiers = pkg["hotelTiers"]
    for es, en in [(title, title_en), (excerpt, excerpt_en)]: add_translation(translations, es, en)

    itinerary_html = []
    en_itinerary = pkg.get("itineraryEn") or pkg.get("en", {}).get("itinerary") or pkg["itinerary"]
    for idx, (es_day, en_day) in enumerate(zip(pkg["itinerary"], en_itinerary), 1):
        _, es_desc = split_day(es_day)
        _, en_desc = split_day(en_day)
        add_translation(translations, es_desc, en_desc)
        rows = []
        for time_es, text_es, time_en, text_en in detailed_schedule(es_day, en_day):
            add_translation(translations, time_es, time_en)
            add_translation(translations, text_es, text_en)
            rows.append(f'''<li class="package-day__row"><time data-en="{html.escape(time_en, quote=True)}">{html.escape(time_es)}</time><span data-en="{html.escape(text_en, quote=True)}">{html.escape(text_es)}</span></li>''')
        itinerary_html.append(f'''<article class="package-day">
          <div class="package-day__head"><span data-en="Day {idx}">Día {idx}</span><h3 data-en="{html.escape(en_desc, quote=True)}">{html.escape(es_desc)}</h3></div>
          <ul>{''.join(rows)}</ul>
        </article>''')

    hotel_rows = []
    for tier in tiers:
        o = tier["occupancyPrices"]
        hotels = " · ".join(tier["hotels"])
        hotel_rows.append(f'''<tr>
          <th>{tier['stars']} · <span data-en="{tier['nameEn']}">{tier['name']}</span></th>
          <td>{html.escape(hotels)}</td>
          <td>USD {o['single']}</td><td>USD {o['double']}</td><td>USD {o['triple']}</td><td>USD {o['family']}</td>
        </tr>''')

    inc = "".join(f'<li><i class="fa-solid fa-check" aria-hidden="true"></i><span data-en="{html.escape(en, quote=True)}">{html.escape(es)}</span></li>' for es, en in zip(pkg["includes"], pkg["includesEn"]))
    noinc = "".join(f'<li><i class="fa-solid fa-xmark" aria-hidden="true"></i><span data-en="{html.escape(en, quote=True)}">{html.escape(es)}</span></li>' for es, en in zip(pkg["notIncludes"], pkg["notIncludesEn"]))
    for es, en in zip(pkg["includes"], pkg["includesEn"]): add_translation(translations, es, en)
    for es, en in zip(pkg["notIncludes"], pkg["notIncludesEn"]): add_translation(translations, es, en)

    tiers_json = html.escape(json.dumps(tiers, ensure_ascii=False), quote=True)
    img = pkg["img"]
    alt = pkg["alt"]
    alt_en = pkg.get("altEn", alt)
    add_translation(translations, alt, alt_en)

    return f'''  <main id="contenido">
    <section class="product-hero-clean package-hero-clean">
      <div class="container">
        <h1 data-en="{html.escape(title_en, quote=True)}">{html.escape(title)}</h1>
        <p data-en="{html.escape(excerpt_en, quote=True)}">{html.escape(excerpt)}</p>
      </div>
    </section>

    <section class="section product-detail-section">
      <div class="detail-layout detail-layout--aligned">
        <div class="detail-main">
          <section class="detail-card">
            <h2 data-en="Package information">Información del paquete</h2>
            <div class="tour-facts product-facts">
              <div><span data-en="Destinations">Destinos</span><strong>{html.escape(pkg['region'])}, Colombia</strong></div>
              <div><span data-en="Duration">Duración</span><strong>{html.escape(pkg['nights'])}</strong></div>
              <div><span data-en="Category">Categoría</span><strong data-en="Multi-day journey">Viaje multidía</strong></div>
              <div><span data-en="Pace">Ritmo</span><strong data-en="Balanced">Equilibrado</strong></div>
              <div><span data-en="Meals">Comidas</span><strong data-en="Breakfasts included">Desayunos incluidos</strong></div>
              <div><span data-en="Languages">Idiomas</span><strong data-en="Spanish · English">Español · Inglés</strong></div>
              <div><span data-en="Code">Código</span><strong>{html.escape(pkg['code'])}</strong></div>
            </div>
          </section>

          <section class="detail-card">
            <h2 data-en="About this package">Sobre este paquete</h2>
            <p class="tour-lead" data-en="{html.escape(excerpt_en, quote=True)}">{html.escape(excerpt)}</p>
            <p data-en="This program includes accommodation with breakfast, scheduled transfers, the guided visits listed below and WhatsApp assistance. The exact order may change due to flights, weather, traffic, admission availability or local operations.">Este programa incluye alojamiento con desayuno, traslados programados, las visitas guiadas detalladas a continuación y asistencia por WhatsApp. El orden exacto puede variar por vuelos, clima, tráfico, disponibilidad de entradas u operación local.</p>
          </section>

          <section class="detail-card">
            <h2 data-en="Day-by-day itinerary">Itinerario día a día</h2>
            <p class="tour-note"><strong data-en="Reference schedule">Horario referencial</strong>. <span data-en="Schedules may change due to flights, weather, traffic, availability and local operations. Your final voucher confirms the exact time.">Los horarios pueden ajustarse por vuelos, clima, tráfico, disponibilidad y operación local. El voucher final confirma la hora exacta.</span></p>
            <div class="package-itinerary">{''.join(itinerary_html)}</div>
          </section>

          <section class="detail-card">
            <h2 data-en="Accommodation categories">Categorías de alojamiento</h2>
            <div class="tour-table-wrap"><table class="tour-table hotel-pricing-table">
              <thead><tr><th data-en="Category">Categoría</th><th data-en="Planned hotels">Hoteles previstos</th><th data-en="Single">Simple</th><th data-en="Twin / double">Doble / matrimonial</th><th data-en="Triple">Triple</th><th data-en="Family">Familiar</th></tr></thead>
              <tbody>{''.join(hotel_rows)}</tbody>
            </table></div>
            <p class="tour-note" data-en="Reference price per person. The child price is calculated at 70% of the selected adult fare. The final hotel or an equivalent property in the same category is confirmed before payment.">Precio referencial por persona. La tarifa infantil se calcula al 70% de la tarifa adulta seleccionada. El hotel final o uno equivalente de la misma categoría se confirma antes del pago.</p>
          </section>

          <div class="tour-split">
            <section class="detail-card"><h2 data-en="What's included">Qué incluye</h2><ul class="detail-list">{inc}</ul></section>
            <section class="detail-card"><h2 data-en="Not included">No incluye</h2><ul class="detail-list detail-list--x">{noinc}</ul></section>
          </div>

          <section class="detail-card">
            <h2 data-en="Important information before booking">Información importante antes de reservar</h2>
            <ul class="tour-bullet-list">
              <li data-en="Prices are reference rates per person and may change by date, occupancy, season, events and supplier availability.">Los precios son referenciales por persona y pueden variar por fecha, ocupación, temporada, eventos y disponibilidad del proveedor.</li>
              <li data-en="International flights are not included. Domestic flights are included only when expressly shown in the selected option.">Los vuelos internacionales no están incluidos. Los vuelos domésticos solo se incluyen cuando la opción elegida lo indique expresamente.</li>
              <li data-en="Hotel check-in is usually from 3:00 PM and check-out by 12:00 noon, subject to each property.">El check-in suele realizarse desde las 15:00 y el check-out hasta las 12:00, sujeto a cada hotel.</li>
              <li data-en="Your final voucher confirms hotels, exact pickup times, contacts and cancellation terms.">El voucher final confirma hoteles, horarios exactos de recogida, contactos y condiciones de cancelación.</li>
            </ul>
          </section>
        </div>

        <aside class="detail-aside tour-booking-aside">
          <div class="detail-card tour-booking-card product-booking-card">
            <img src="../assets/img/{html.escape(img)}" alt="{html.escape(alt)}" data-en-alt="{html.escape(alt_en, quote=True)}" width="1200" height="800" loading="lazy" decoding="async" />
            <div class="price-block"><small data-en="Price from">Precio desde</small><strong>USD {pkg['priceFrom']:.2f}</strong><span data-en="per person">por persona</span></div>
            <div class="fact-row"><span data-en="Duration">Duración</span><strong>{html.escape(pkg['nights'])}</strong></div>
            <div class="fact-row"><span data-en="Destinations">Destinos</span><strong>{html.escape(pkg['region'])}</strong></div>
            <div class="fact-row"><span data-en="Hotels">Hoteles</span><strong data-en="3 categories to choose from">3 categorías a elegir</strong></div>
            <div class="fact-row"><span data-en="Flights">Vuelos</span><strong data-en="Quoted separately unless indicated">Cotizables aparte salvo indicación</strong></div>
            <div class="cta-stack">
              <button type="button" class="btn-primary btn-book" data-book="{pkg['slug']}" data-book-kind="package" data-book-title="{html.escape(title, quote=True)}" data-book-price="{pkg['priceFrom']}" data-book-country="Colombia" data-book-duration="{html.escape(pkg['nights'], quote=True)}" data-book-tiers="{tiers_json}" data-book-child-factor="0.70">Reservar ahora</button>
              <a class="btn-outline" href="https://wa.me/51900608980?text={html.escape('Hola, quiero información sobre el paquete ' + title, quote=True)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i> <span data-en="Ask on WhatsApp">Consultar por WhatsApp</span></a>
            </div>
            <p class="tour-booking-note" data-en="Select the hotel category and room occupancy in the booking form. The price updates automatically before payment.">Selecciona la categoría de hotel y la ocupación en el formulario de reserva. El precio se actualiza automáticamente antes del pago.</p>
            <div class="dynamic-rate-note"><strong data-en="Dynamic rates">Tarifas dinámicas</strong><p data-en="Reference prices updated in July 2026. They may change by date, occupancy, season, availability, events and the supplier's exchange rate.">Precios referenciales actualizados en julio de 2026. Pueden variar por fecha, ocupación, temporada, disponibilidad, eventos y tipo de cambio del proveedor.</p></div>
          </div>
        </aside>
      </div>
    </section>
  </main>'''


def jsonld_product(item: dict, kind: str) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": item["title"],
        "description": item.get("description") or item.get("excerpt", ""),
        "url": f"https://latamexpeditions.com/{'experiencias' if kind == 'experience' else 'paquetes'}/{item['slug']}.html",
        "image": f"https://latamexpeditions.com/assets/img/{item['img']}",
        "touristType": item.get("styles", [item.get("style", "")]),
        "itinerary": {"@type": "Place", "name": f"{item.get('region','')}, {item.get('country','')}"},
        "provider": {"@type": "TravelAgency", "name": "Latam Expeditions", "url": "https://latamexpeditions.com"},
        "offers": {"@type": "Offer", "price": item.get("priceFrom", 0), "priceCurrency": "USD", "availability": "https://schema.org/InStock"},
    }
    return P.jsonld(data)


def render_package(pkg: dict, translations: dict) -> None:
    title = f"{pkg['title']} {pkg['nights']} | Paquete en Colombia | Latam Expeditions"
    desc = f"Paquete {pkg['nights']} en Colombia: {pkg['excerpt']}"
    add_translation(translations, title, f"{pkg.get('titleEn', pkg['title'])} {pkg['nights']} | Colombia package | Latam Expeditions")
    add_translation(translations, desc, f"{pkg['nights']} package in Colombia: {pkg.get('excerptEn', pkg['excerpt'])}")
    page = (
        P.head(title=title, description=desc, canonical=f"paquetes/{pkg['slug']}.html", base="../", image=f"assets/img/{pkg['img']}", extra=jsonld_product(pkg, "package"))
        + P.header("../")
        + package_main(pkg, translations)
        + P.country_modal()
        + P.footer("../", '<script src="../assets/js/booking.js" defer></script>\n')
    )
    (ROOT / "paquetes" / f"{pkg['slug']}.html").write_text(page, encoding="utf-8")


def extract_experience_content(path: Path) -> str:
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    source = soup.select_one(".detail-main") or soup.select_one(".tour-section-stack")
    if not source:
        return ""
    # Eliminar bloques de reserva incrustados por si existieran.
    for bad in source.select(".tour-booking-card, .detail-aside, script"):
        bad.decompose()
    return "".join(str(c) for c in source.contents)


def render_experience(exp: dict, translations: dict) -> None:
    path = ROOT / "experiencias" / f"{exp['slug']}.html"
    old_content = extract_experience_content(path)
    title = f"{exp['title']} | Tour en Colombia | Latam Expeditions"
    desc = exp.get("description") or exp.get("excerpt", "")
    title_en = translations.get(exp["title"], exp["title"])
    excerpt_en = translations.get(exp.get("excerpt", ""), exp.get("excerpt", ""))
    alt_en = translations.get(exp.get("alt", ""), exp.get("alt", ""))
    add_translation(translations, title, f"{title_en} | Tour in Colombia | Latam Expeditions")

    departures = exp.get("departures", [])
    departures_attr = html.escape(json.dumps(departures, ensure_ascii=False), quote=True)
    departures_text = " · ".join(departures) if departures else "Según disponibilidad"
    img = exp["img"]
    main = f'''  <main id="contenido">
    <section class="product-hero-clean experience-hero-clean">
      <div class="container"><h1 data-en="{html.escape(title_en, quote=True)}">{html.escape(exp['title'])}</h1><p data-en="{html.escape(excerpt_en, quote=True)}">{html.escape(exp.get('excerpt',''))}</p></div>
    </section>
    <section class="section product-detail-section">
      <div class="detail-layout detail-layout--aligned">
        <div class="detail-main">{old_content}</div>
        <aside class="detail-aside tour-booking-aside">
          <div class="detail-card tour-booking-card product-booking-card">
            <img src="../assets/img/{html.escape(img)}" alt="{html.escape(exp.get('alt',''))}" data-en-alt="{html.escape(alt_en, quote=True)}" width="1200" height="800" loading="lazy" decoding="async" />
            <div class="price-block"><small data-en="Price from">Precio desde</small><strong>USD {float(exp['priceFrom']):.2f}</strong><span data-en="per person">por persona</span></div>
            <div class="fact-row"><span data-en="Duration">Duración</span><strong>{html.escape(str(exp.get('duration','')))}</strong></div>
            <div class="fact-row"><span data-en="Location">Ubicación</span><strong>{html.escape(exp.get('region',''))}, Colombia</strong></div>
            <div class="fact-row"><span data-en="Departure times">Horarios de salida</span><strong>{html.escape(departures_text)}</strong></div>
            <div class="fact-row"><span data-en="Available languages">Idiomas disponibles</span><strong data-en="Spanish · English">Español · Inglés</strong></div>
            <div class="cta-stack">
              <button type="button" class="btn-primary btn-book" data-book="{exp['slug']}" data-book-kind="experience" data-book-title="{html.escape(exp['title'], quote=True)}" data-book-price="{exp['priceFrom']}" data-book-country="Colombia" data-book-duration="{html.escape(str(exp.get('duration','')), quote=True)}" data-book-departures="{departures_attr}" data-book-child-factor="0.75">Reservar ahora</button>
              <a class="btn-outline" href="../contacto.html?experiencia={exp['slug']}" data-en="Request a private option">Solicitar opción privada</a>
            </div>
            <p class="tour-booking-note" data-en="Choose adults and children separately. The total number of travelers and price are calculated automatically.">Elige adultos y niños por separado. La cantidad total de viajeros y el precio se calculan automáticamente.</p>
          </div>
        </aside>
      </div>
    </section>
  </main>'''
    page = (
        P.head(title=title, description=desc, canonical=f"experiencias/{exp['slug']}.html", base="../", image=f"assets/img/{img}", extra=jsonld_product(exp, "experience"))
        + P.header("../") + main + P.country_modal()
        + P.footer("../", '<script src="../assets/js/booking.js" defer></script>\n')
    )
    path.write_text(page, encoding="utf-8")


def patch_listing(path: Path, items: list[dict], kind: str) -> None:
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    by_slug = {x["slug"]: x for x in items}
    for card in soup.select("article.trip-card"):
        link = card.select_one("a.card-btn[href]")
        if not link:
            continue
        slug = Path(link.get("href", "").split("?")[0]).stem
        item = by_slug.get(slug)
        if not item:
            continue
        tags = list(dict.fromkeys((item.get("styles") or [item.get("style")]) + ["colombia"]))
        if kind == "package":
            m = re.match(r"(\d+)D", item.get("nights", ""))
            if m: tags.append(f"d{m.group(1)}")
        card["data-tags"] = " ".join(t for t in tags if t)
        img = card.select_one("img")
        if img:
            img["src"] = f"assets/img/{item['img']}"
            img["alt"] = item.get("alt", item["title"])
        tag = card.select_one(".tag")
        if tag:
            tag.string = STYLE_LABELS.get((item.get("styles") or [item.get("style")])[0], item.get("styleLabel", "Colombia"))
        price = card.select_one(".price strong")
        if price:
            price.string = f"USD {float(item['priceFrom']):.2f}"
    path.write_text(str(soup), encoding="utf-8")


def update_build_py() -> None:
    path = ROOT / "tools/build.py"
    text = path.read_text(encoding="utf-8")
    old = "tags = f\"{item['style']} {item['country'].lower()}\""
    new = "tags = \" \".join(dict.fromkeys((item.get('styles') or [item['style']]) + [item['country'].lower()]))"
    if old in text:
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")


def make_placeholder(filename: str, title: str, subtitle: str, kind: str) -> None:
    path = IMG_DIR / filename
    W, H = 1200, 800
    im = Image.new("RGB", (W, H), (10, 61, 44))
    draw = ImageDraw.Draw(im)
    # Patrón geométrico sobrio; cada archivo es independiente y reemplazable.
    for i in range(0, W, 80):
        tone = 42 + (i // 80) % 3 * 10
        draw.polygon([(i, 0), (min(W, i + 260), 0), (max(0, i - 80), H), (max(0, i - 320), H)], fill=(10, tone + 35, tone))
    draw.rectangle((0, H - 230, W, H), fill=(4, 35, 25))
    try:
        f_big = ImageFont.truetype("DejaVuSans-Bold.ttf", 48)
        f_mid = ImageFont.truetype("DejaVuSans.ttf", 29)
        f_small = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
    except OSError:
        f_big = f_mid = f_small = ImageFont.load_default()
    def wrap(text: str, max_chars: int) -> list[str]:
        words = text.split(); lines=[]; cur=[]
        for w in words:
            if len(" ".join(cur+[w])) > max_chars and cur:
                lines.append(" ".join(cur)); cur=[w]
            else: cur.append(w)
        if cur: lines.append(" ".join(cur))
        return lines[:3]
    draw.text((70, 70), "LATAM EXPEDITIONS", font=f_small, fill=(235, 185, 64))
    draw.text((70, 115), "IMAGEN TEMPORAL · REEMPLAZAR", font=f_small, fill=(255,255,255))
    y = H - 205
    for line in wrap(title, 38):
        draw.text((70, y), line, font=f_big, fill=(255,255,255)); y += 57
    draw.text((70, H - 48), f"{kind} · {subtitle}", font=f_mid, fill=(235,185,64))
    im.save(path, "JPEG", quality=88, optimize=True)


def image_description(item: dict, kind: str) -> str:
    base = item.get("alt") or item["title"]
    if kind == "Experiencia":
        return f"Fotografía auténtica de {base.lower()}, con viajeros en escala natural y sin texto sobreimpreso."
    return f"Imagen principal que represente {item['title']} mediante un atractivo emblemático de {item.get('region','Colombia')}; sin collage, sin texto y con luz natural."


def write_image_manifest(exps: list[dict], pkgs: list[dict]) -> None:
    lines = [
        "# Imágenes requeridas — Colombia",
        "",
        "Todas las imágenes deben ser propias, licenciadas o descargadas de una fuente con permiso de uso comercial. Formato recomendado: JPG, 1200 × 800 px, relación 3:2; encuadre horizontal y sin texto incrustado.",
        "",
        "Los archivos incluidos en `assets/img/` son marcadores temporales únicos. Reemplázalos conservando exactamente el mismo nombre.",
        "",
        "| Tipo | Producto | Archivo exacto | Qué debe mostrar |",
        "|---|---|---|---|",
    ]
    for kind, items in [("Experiencia", exps), ("Paquete", pkgs)]:
        for x in items:
            desc = image_description(x, kind).replace("|", "/")
            lines.append(f"| {kind} | {x['title']} | `{x['img']}` | {desc} |")
    (ROOT / "IMAGENES_REQUERIDAS_COLOMBIA.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def redirect_english_package(pkg: dict) -> None:
    dest = f"../../paquetes/{pkg['slug']}.html?lang=en"
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(pkg.get('titleEn', pkg['title']))} | Latam Expeditions</title><meta http-equiv="refresh" content="0;url={dest}"><link rel="canonical" href="https://latamexpeditions.com/paquetes/{pkg['slug']}.html"></head><body><p>Redirecting to the English version… <a href="{dest}">Continue</a>.</p></body></html>'''
    path = ROOT / "en/packages" / f"{pkg['slug']}.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(page, encoding="utf-8")


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    translations = json.loads(I18N_PATH.read_text(encoding="utf-8"))
    translations.update(GENERIC_TRANSLATIONS)

    exps = [x for x in catalog["experiences"] if x.get("country") == "Colombia"]
    pkgs = [x for x in catalog["packages"] if x.get("country") == "Colombia"]

    for exp in exps:
        exp["styles"] = STYLE_OVERRIDES.get(exp["slug"], [exp.get("style", "cultura")])
        exp["style"] = exp["styles"][0]
        exp["styleLabel"] = STYLE_LABELS[exp["style"]]
        exp["img"] = f"colombia-experiencia-{exp['slug']}.jpg"
        exp["childPriceFactor"] = 0.75
        exp["pricingUpdated"] = "2026-07-25"
        exp["pricingBasis"] = "Referencia de mercado OTA; tarifa final sujeta a fecha y disponibilidad."
        make_placeholder(exp["img"], exp["title"], exp.get("region", "Colombia"), "EXPERIENCIA")

    for pkg in pkgs:
        pkg["priceFrom"] = PRICE_FROM[pkg["slug"]]
        pkg["img"] = f"colombia-paquete-{pkg['slug']}.jpg"
        pkg["hotelTiers"] = build_tiers(pkg)
        pkg["styles"] = PACKAGE_STYLE_OVERRIDES.get(pkg["slug"], [pkg.get("style", "cultura")])
        pkg["styles"] = list(dict.fromkeys(pkg["styles"]))
        pkg["childPriceFactor"] = 0.70
        pkg["pricingUpdated"] = "2026-07-25"
        pkg["pricingBasis"] = "Tarifa desde por persona en habitación doble/matrimonial, categoría 3★, sin vuelos internacionales."
        make_placeholder(pkg["img"], pkg["title"], pkg.get("region", "Colombia"), "PAQUETE")
        for es, en in zip(pkg.get("itinerary", []), pkg.get("itineraryEn", [])): add_translation(translations, es, en)

    # Configuración global del formulario.
    booking = catalog.setdefault("booking", {})
    docs = booking.setdefault("documentTypes", ["DNI", "Pasaporte", "Cédula", "Otro"])
    if "Carnet de extranjería" not in docs:
        docs.insert(-1 if "Otro" in docs else len(docs), "Carnet de extranjería")
    booking["maxAdults"] = 12
    booking["maxChildren"] = 8
    booking["defaultAdults"] = 2
    booking["defaultChildren"] = 0

    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for exp in exps: render_experience(exp, translations)
    for pkg in pkgs:
        render_package(pkg, translations)
        redirect_english_package(pkg)

    patch_listing(ROOT / "experiencias.html", exps, "experience")
    patch_listing(ROOT / "paquetes.html", pkgs, "package")
    # Landing específica Colombia, si contiene las mismas cards.
    if (ROOT / "paquetes-colombia.html").exists(): patch_listing(ROOT / "paquetes-colombia.html", pkgs, "package")

    update_build_py()
    translations.update(GENERIC_TRANSLATIONS)
    I18N_PATH.write_text(json.dumps(dict(sorted(translations.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_image_manifest(exps, pkgs)

    print(f"Actualizadas {len(exps)} experiencias y {len(pkgs)} paquetes de Colombia.")


if __name__ == "__main__":
    main()

/** Precarga pública de Atacama Premium: vuelos OPCIONALES, precio REFERENCIAL, sin costos netos ni márgenes privados. */
const ATACAMA_PREMIUM_DRAFT = {
  "schemaVersion": 1,
  "id": "",
  "code": "",
  "status": "BORRADOR",
  "version": 1,
  "approved": false,
  "public": false,
  "identity": {
    "type": "package",
    "title": "Desierto de Atacama Premium · 5 días / 4 noches",
    "internalName": "CHILE · Atacama 5D/4N · piloto 22–26/03/2027",
    "slug": "desierto-atacama-premium-5d4n",
    "country": "Chile",
    "region": "Antofagasta",
    "city": "San Pedro de Atacama",
    "destination": "San Pedro de Atacama, Chile",
    "days": 5,
    "nights": 4,
    "category": "Naturaleza, aventura, astronomía",
    "modality": "Excursiones y traslados compartidos",
    "difficulty": "Moderada · excursiones de altura",
    "language": "Español · inglés sujeto a confirmación",
    "startPoint": "Aeropuerto El Loa de Calama (CJC)",
    "endPoint": "Aeropuerto El Loa de Calama (CJC)",
    "minAge": 18,
    "minTravelers": 1,
    "maxTravelers": 4,
    "defaultAdults": 2,
    "defaultChildren": 0
  },
  "dates": {
    "pilotCheckin": "2027-03-22",
    "pilotCheckout": "2027-03-26",
    "onlyPilotWindow": false,
    "minLeadDays": 21,
    "notes": "Fechas flexibles, siempre sujetas a confirmación y recotización. Piloto 22–26/03/2027 incluye Viernes Santo el día 26; revisar la operación y la actividad astrolunar por luna llena."
  },
  "commercial": {
    "short": "Cinco días y cuatro noches en San Pedro de Atacama con Hotel Terrantai 4★, tours por el desierto, traslados desde Calama y desayuno. Vuelos opcionales.",
    "description": "Descubre los paisajes de Atacama con cuatro noches en el hotel boutique Terrantai 4★, traslados compartidos desde el aeropuerto de Calama y excursiones por Valle de la Luna, Valle del Arcoíris, Piedras Rojas, Lagunas Altiplánicas, Géiseres del Tatio y Laguna Cejar. Los vuelos no están incluidos en el precio base y pueden añadirse durante la reserva. La actividad nocturna se adapta a la luna y el clima; horarios, guías y alojamiento sujetos a confirmación.",
    "highlights": [
      "Valle de la Luna y atardecer en el desierto",
      "Valle del Arcoíris y Yerbas Buenas",
      "Piedras Rojas, Lagunas Miscanti y Miñiques y Salar de Atacama",
      "Géiseres del Tatio y Machuca",
      "Laguna Cejar y Ojos del Salar",
      "Experiencia astronómica/lunar condicionada"
    ],
    "includes": [
      "4 noches en Hotel Terrantai 4★, habitación doble o matrimonial, sujeto a cotización",
      "Desayuno diario durante 4 mañanas",
      "Traslados compartidos aeropuerto CJC–hotel–aeropuerto CJC",
      "3 jornadas de excursiones agrupadas en 5 salidas",
      "Guías locales (idioma sujeto a confirmación)",
      "Entradas a los atractivos incluidos en las excursiones",
      "Una actividad astronómica/lunar por confirmar",
      "Actividad astrolunar nocturna, sujeta a confirmación de operador y condiciones climáticas"
    ],
    "excludes": [
      "Vuelos nacionales e internacionales, incluido Santiago–Calama–Santiago (opcional al configurar reserva)",
      "Equipaje y asientos aéreos; tasas o servicios no incluidos por la aerolínea",
      "Traslados en Santiago entre aeropuerto y hotel",
      "Almuerzos y cenas salvo confirmación de los operadores",
      "Seguro, propinas y gastos personales",
      "Servicios no señalados expresamente como incluidos"
    ],
    "optional": [
      "Traslado privado a cotizar",
      "Excursiones privadas en inglés a cotizar",
      "Añadir vuelos desde el origen del viajero hasta Calama (CJC), según tarifa dinámica disponible",
      "Habitación individual: suplemento según tarifa efectiva y ocupación, sujeto a cotización"
    ],
    "policies": "Precio preliminar para base doble. Hotel, excursiones y entradas sujetos a disponibilidad y confirmación del proveedor. Si no se puede cumplir un servicio, se ofrecerá una alternativa aceptada o la devolución correspondiente. No incluye vuelos. Condiciones definitivas de cancelación al confirmar los servicios.",
    "recommendations": "Abrigo por capas, calzado cerrado, protector solar, sombrero, hidratación y documento de viaje.",
    "restrictions": "Altura superior a 4.000 m en El Tatio; cambios de temperatura; evaluar condiciones físicas. Piloto solo para adultos (18+).",
    "accessibility": "No verificada; excursiones en altitud y caminatas en terreno irregular."
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Llegada a Calama, traslado y aclimatación en San Pedro",
      "date": "2027-03-22",
      "intro": "Llegada al aeropuerto de Calama (vuelo no incluido), traslado compartido a San Pedro, registro en Terrantai y descanso para aclimatación. Posible actividad astrolunar, condicionada a confirmar operador y clima.",
      "activities": [
        {
          "time": "Según vuelo",
          "activity": "Llegada al Aeropuerto El Loa (CJC)",
          "detail": "Los vuelos son opcionales y no forman parte del precio base."
        },
        {
          "time": "Según llegada",
          "activity": "Recepción y traslado a San Pedro",
          "detail": "Transfer compartido de aproximadamente 1 h 15 a 1 h 30; sujeto a horario de vuelo."
        },
        {
          "time": "Desde 15:00",
          "activity": "Check-in y descanso en Hotel Terrantai",
          "detail": "Aclimatación y paseo libre por el centro de San Pedro."
        },
        {
          "time": "Noche",
          "activity": "Actividad astrolunar opcional/condicionada",
          "detail": "Luna llena cercana; solo si se confirma un operador para modalidad lunar. Se informará antes de reservar."
        }
      ],
      "meals": "No se incluyen comidas el día de llegada",
      "lodging": "Terrantai 4★, primera noche sujeto a confirmación",
      "transport": "Traslado compartido aeropuerto CJC–San Pedro (sin vuelo incluido)",
      "difficulty": "Aclimatación progresiva a ~2.400 m",
      "operationalNote": "Luna llena el 22/03/2027; no anunciar observación de estrellas de cielo oscuro. Reconfirmar horarios y disponibilidad de actividad lunar."
    },
    {
      "day": 2,
      "title": "Valle del Arcoíris, Yerbas Buenas y Valle de la Luna",
      "date": "2027-03-23",
      "intro": "Visita a Yerbas Buenas y al Valle del Arcoíris por la mañana; Valle de la Luna y atardecer por la tarde.",
      "activities": [
        {
          "time": "07:00",
          "activity": "Desayuno en hotel",
          "detail": "Horario sujeto a recogida."
        },
        {
          "time": "08:00",
          "activity": "Salida a Yerbas Buenas",
          "detail": "Excursión guiada en inglés por confirmar."
        },
        {
          "time": "09:30",
          "activity": "Valle del Arcoíris",
          "detail": "Interpretación, caminatas y fotografía."
        },
        {
          "time": "12:30",
          "activity": "Almuerzo libre",
          "detail": "No incluido salvo confirmación del operador."
        },
        {
          "time": "15:00",
          "activity": "Valle de la Luna",
          "detail": "Entradas dentro de estimación."
        },
        {
          "time": "17:30",
          "activity": "Miradores y puesta del sol",
          "detail": "Sujeto a regulación de acceso."
        },
        {
          "time": "19:00",
          "activity": "Regreso al hotel",
          "detail": "Fin de excursiones."
        }
      ],
      "meals": "Desayuno; almuerzo y cena no incluidos",
      "lodging": "Terrantai 4★, segunda noche",
      "transport": "Excursiones terrestres compartidas",
      "difficulty": "Fácil a moderada; sol intenso",
      "operationalNote": "El orden mañana/tarde puede cambiar por proveedores."
    },
    {
      "day": 3,
      "title": "Piedras Rojas, Lagunas Altiplánicas y Salar de Atacama",
      "date": "2027-03-24",
      "intro": "Recorrido de día completo por Piedras Rojas, Miscanti y Miñiques, y Salar de Atacama/Laguna Chaxa.",
      "activities": [
        {
          "time": "06:30",
          "activity": "Desayuno y recojo",
          "detail": "Puede ser desayuno para llevar."
        },
        {
          "time": "07:00",
          "activity": "Salida hacia el altiplano",
          "detail": "Visita guiada por Socaire."
        },
        {
          "time": "09:30",
          "activity": "Lagunas Miscanti y Miñiques",
          "detail": "Caminatas y accesos autorizados."
        },
        {
          "time": "12:00",
          "activity": "Sector Piedras Rojas",
          "detail": "Recorrido autorizado y fotos."
        },
        {
          "time": "13:30",
          "activity": "Pausa para almuerzo",
          "detail": "A confirmar si está incluido."
        },
        {
          "time": "15:30",
          "activity": "Salar de Atacama / Laguna Chaxa",
          "detail": "Secuencia condicionada a accesos."
        },
        {
          "time": "18:30",
          "activity": "Regreso a San Pedro",
          "detail": "Horario aproximado."
        }
      ],
      "meals": "Desayuno; almuerzo por confirmar; cena no incluida",
      "lodging": "Terrantai 4★, tercera noche",
      "transport": "Bus turístico o miniván compartida",
      "difficulty": "Altitud elevada, aclimatación necesaria",
      "operationalNote": "La secuencia cambia por clima y condiciones de protección del área natural."
    },
    {
      "day": 4,
      "title": "Géiseres del Tatio, Machuca y Laguna Cejar",
      "date": "2027-03-25",
      "intro": "Madrugada en El Tatio, visita a Machuca y, tras un descanso, Laguna Cejar y Ojos del Salar.",
      "activities": [
        {
          "time": "04:30",
          "activity": "Recojo en hotel",
          "detail": "Desayuno puede sustituirse por box breakfast."
        },
        {
          "time": "06:30",
          "activity": "Géiseres del Tatio",
          "detail": "Senderos autorizados y seguridad geotérmica."
        },
        {
          "time": "09:30",
          "activity": "Machuca",
          "detail": "Parada cultural según ruta."
        },
        {
          "time": "12:00",
          "activity": "Regreso y almuerzo libre",
          "detail": "Descanso antes de la tarde."
        },
        {
          "time": "15:00",
          "activity": "Laguna Cejar",
          "detail": "Baño y permisos según normas."
        },
        {
          "time": "17:00",
          "activity": "Ojos del Salar",
          "detail": "Paradas para fotos."
        },
        {
          "time": "19:00",
          "activity": "Regreso al hotel",
          "detail": "Fin de excursiones."
        }
      ],
      "meals": "Desayuno o box breakfast; resto no incluido salvo acuerdo",
      "lodging": "Terrantai 4★, cuarta noche",
      "transport": "Excursiones terrestres compartidas",
      "difficulty": "El Tatio supera 4.000 m; jornada físicamente exigente",
      "operationalNote": "Revisar ritmo del viajero; la visita de tarde podría reprogramarse."
    },
    {
      "day": 5,
      "title": "Regreso a Santiago de Chile",
      "date": "2027-03-26",
      "intro": "Desayuno, salida del hotel y traslado al aeropuerto de Calama (CJC) para tomar el vuelo contratado por el viajero u opcionalmente añadido.",
      "activities": [
        {
          "time": "08:00",
          "activity": "Desayuno",
          "detail": "Horario del hotel y salida sujetos a la programación."
        },
        {
          "time": "11:00",
          "activity": "Check-out y tiempo libre",
          "detail": "Consultar con recepción guarda de equipaje."
        },
        {
          "time": "Según vuelo",
          "activity": "Traslado San Pedro → Aeropuerto Calama",
          "detail": "Salidas según horarios del vuelo que contrate o añada el viajero."
        },
        {
          "time": "—",
          "activity": "Fin de nuestros servicios en Calama",
          "detail": "Vuelos no incluidos en el paquete base."
        }
      ],
      "meals": "Desayuno",
      "lodging": "Fin del programa",
      "transport": "Traslado compartido a CJC (vuelos opcionales)",
      "difficulty": "Planear tiempo suficiente para embarque",
      "operationalNote": "26/03/2027 Viernes Santo en Chile. Revisar salidas de operadores y transfer, sin prometer vuelo SCL."
    }
  ],
  "lodging": {
    "name": "Hotel Terrantai",
    "stars": 4,
    "address": "Tocopilla 411, San Pedro de Atacama, Chile",
    "nights": 4,
    "roomType": "doble / matrimonial",
    "preferredRoom": "Andina (doble o twin, sujeta a disponibilidad)",
    "included": true,
    "breakfast": true,
    "minHotelGuestAge": 14,
    "costDoubleRoomNightUSD": null,
    "costSingleRoomNightUSD": null,
    "source": "https://terrantai.com/es/",
    "rateStatus": "PENDIENTE_COTIZACION_FECHAS",
    "note": "Confirmar disponibilidad y precio de habitación doble y uso individual para 22–26/03/2027."
  },
  "flights": {
    "included": false,
    "availableAsAddOn": true,
    "route": "CJC (Calama) como aeropuerto de destino; origen seleccionable",
    "preferredAirlines": [
      "LATAM",
      "SKY",
      "JetSMART"
    ],
    "flightConfirmed": false,
    "originDomesticSCL": false,
    "note": "Vuelos no incluidos. El turista puede añadir vuelo desde su aeropuerto de origen con motor SerpApi y pago como suplemento validado."
  },
  "transfers": {
    "included": true,
    "route": "CJC–San Pedro–CJC",
    "mode": "compartido",
    "confirmed": false
  },
  "pricing": {
    "currency": "USD",
    "basisOccupancy": 2,
    "defaultAdults": 2,
    "defaultChildren": 0,
    "pricePerAdultOnDoubleUSD": 1499.9,
    "baseGroupPriceForTwoUSD": 2999.8,
    "priceStatus": "REFERENCIAL_NO_PUBLICAR",
    "childrenPriceUSD": null,
    "soloRateStatus": "PENDIENTE_TARIFA_SINGLE",
    "costValidationRequired": true,
    "note": "Precio público indicativo para 2 adultos en doble; no garantizado hasta confirmar hotel y excursiones para las fechas. Vuelos adicionales."
  },
  "seo": {
    "title": "Atacama Premium 5D/4N con Hotel Terrantai | LATAM Expeditions",
    "description": "Desierto de Atacama 5 días y 4 noches con Hotel Terrantai 4★, excursiones, traslados desde Calama y vuelos opcionales. Consulta disponibilidad.",
    "keywords": "desierto de atacama 5 días, san pedro de atacama paquete, piedras rojas, géiseres del tatio, chile 5d4n",
    "heroImage": "https://latamexpeditions.com/assets/img/chile-experiencia-atacama-valle-luna.jpg",
    "gallery": [],
    "translationEnglishReady": false,
    "relatedSlugs": [
      "atacama-valle-luna",
      "geiseres-tatio",
      "chile-atacama-5d4n"
    ]
  },
  "quality": {
    "copyReady": true,
    "suppliersConfirmed": false,
    "pricesConfirmed": false,
    "hotelConfirmed": false,
    "flightConfirmed": false,
    "photosLicensed": false,
    "policiesApproved": false,
    "datesVerified": false,
    "englishApproved": false,
    "bookingTested": false,
    "notes": "Investigación referencial 10/11/2026. Precios netos no confirmados para 22–26/03/2027. Producto visible como cotización, no pago garantizado."
  }
};

/** Semilla administrativa del paquete Atacama. Nunca exportar tarifas internas ni verificaciones al HTML público. */
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
    "description": "Cinco días para descubrir el Desierto de Atacama, con cuatro noches en el boutique Hotel Terrantai, traslados desde Calama y visitas a Valle de la Luna, Valle del Arcoíris, Piedras Rojas, Lagunas Altiplánicas, Géiseres del Tatio y Laguna Cejar. Añade tus vuelos a Calama al personalizar la reserva.",
    "highlights": [
      "Valle de la Luna y atardecer en el desierto",
      "Valle del Arcoíris y Yerbas Buenas",
      "Piedras Rojas, Lagunas Miscanti y Miñiques y Salar de Atacama",
      "Géiseres del Tatio y Machuca",
      "Laguna Cejar y Ojos del Salar",
      "Experiencia de observación lunar en el desierto"
    ],
    "includes": [
      "4 noches en Hotel Terrantai 4★, habitación Andina doble o matrimonial",
      "Desayuno buffet diario",
      "Traslados compartidos Calama–San Pedro–Calama",
      "Excursiones guiadas por los principales paisajes de Atacama",
      "Entradas a los atractivos incluidos en el itinerario",
      "Actividad de observación lunar, según las condiciones del cielo"
    ],
    "excludes": [
      "Vuelos nacionales e internacionales (opcionales al reservar)",
      "Equipaje y servicios adicionales de las aerolíneas",
      "Almuerzos y cenas",
      "Seguro de viaje, propinas y gastos personales",
      "Servicios no indicados en el programa"
    ],
    "optional": [
      "Vuelos a Calama desde la ciudad de origen",
      "Traslados privados",
      "Excursiones privadas o en otros idiomas",
      "Habitación individual y otras acomodaciones"
    ],
    "policies": "Programa de 5 días y 4 noches con vuelos opcionales. Los servicios, horarios y términos de reserva se muestran al completar la compra.",
    "recommendations": "Abrigo por capas, calzado cerrado, protector solar, sombrero, hidratación y documento de viaje.",
    "restrictions": "Excursiones en altura, especialmente El Tatio; se recomienda aclimatación, ropa de abrigo e hidratación. Programa para adultos.",
    "accessibility": "No verificada; excursiones en altitud y caminatas en terreno irregular."
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Llegada a Calama, traslado y aclimatación en San Pedro",
      "date": "2027-03-22",
      "intro": "Llegada al aeropuerto de Calama, traslado a San Pedro de Atacama y tiempo libre para conocer el centro y descansar antes de las excursiones.",
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
          "activity": "Experiencia de observación lunar",
          "detail": "Actividad nocturna según las condiciones del cielo."
        }
      ],
      "meals": "No se incluyen comidas el día de llegada",
      "lodging": "Hotel Terrantai 4★",
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
          "detail": "Excursión con guía local. Otros idiomas a solicitud."
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
      "meals": "Desayuno; almuerzo y cena no incluidos",
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
    "description": "Atacama Premium 5D/4N: Hotel Terrantai 4★, Valle de la Luna, Piedras Rojas, Géiseres del Tatio, traslados y vuelos opcionales.",
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

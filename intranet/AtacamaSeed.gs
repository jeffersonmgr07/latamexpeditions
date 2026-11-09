/** Precarga pública SANITIZADA: no incluye costos, proveedores ni márgenes privados. */
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
    "language": "Inglés (por confirmar)",
    "startPoint": "Aeropuerto de Santiago (SCL)",
    "endPoint": "Aeropuerto de Santiago (SCL)",
    "minAge": 18,
    "minTravelers": 1,
    "maxTravelers": 4,
    "defaultAdults": 2,
    "defaultChildren": 0
  },
  "dates": {
    "pilotCheckin": "2027-03-22",
    "pilotCheckout": "2027-03-26",
    "onlyPilotWindow": true,
    "minLeadDays": 30,
    "notes": "El 26/03/2027 es Viernes Santo en Chile. El vuelo de retorno debe ser tarde/noche. Fuera de estas fechas, recotizar."
  },
  "commercial": {
    "short": "Descubre el desierto de Atacama en 5 días: salares, lagunas, géiseres y Valle de la Luna, con hotel 4 estrellas, vuelos internos y guías en inglés.",
    "description": "Viaja desde Santiago al corazón del desierto de Atacama y descubre salares, lagunas de altura, géiseres y formaciones rocosas. La llegada a Calama y el primer día libre permiten aclimatarse. Las siguientes jornadas combinan Valle del Arcoíris y Yerbas Buenas, Valle de la Luna, Piedras Rojas, Lagunas Altiplánicas, Salar de Atacama, Géiseres del Tatio, Machuca, Laguna Cejar y Ojos del Salar. Las excursiones se plantean en servicio compartido con guías en inglés. Se contempla una actividad astronómica adaptada a luna llena, pendiente de aceptación del pasajero y confirmación operativa. Todos los servicios y horarios siguen sujetos a disponibilidad.",
    "highlights": [
      "Valle de la Luna y atardecer en el desierto",
      "Valle del Arcoíris y Yerbas Buenas",
      "Piedras Rojas, Lagunas Miscanti y Miñiques y Salar de Atacama",
      "Géiseres del Tatio y Machuca",
      "Laguna Cejar y Ojos del Salar",
      "Experiencia astronómica/lunar condicionada"
    ],
    "includes": [
      "Vuelos domésticos Santiago–Calama–Santiago (tarifa y aerolínea por confirmar)",
      "4 noches en Hotel Terrantai 4★, habitación doble o matrimonial, sujeto a cotización",
      "Desayuno diario durante 4 mañanas",
      "Traslados compartidos aeropuerto CJC–hotel–aeropuerto CJC",
      "3 jornadas de excursiones agrupadas en 5 salidas",
      "Guías en inglés por confirmar",
      "Entradas a los atractivos incluidos en las excursiones",
      "Una actividad astronómica/lunar por confirmar"
    ],
    "excludes": [
      "Vuelos internacionales y noches en Santiago",
      "Traslados en Santiago entre aeropuerto y hotel",
      "Almuerzos y cenas salvo confirmación de los operadores",
      "Equipaje extra, asientos y servicios aéreos no tarifados",
      "Seguro, propinas y gastos personales",
      "Servicios no señalados expresamente como incluidos"
    ],
    "optional": [
      "Traslado privado a cotizar",
      "Excursiones privadas en inglés a cotizar",
      "Habitación individual: suplemento calculado con tarifa real del hotel, pendiente"
    ],
    "policies": "Cancelación y reprogramación pendientes de condiciones firmes de vuelos, hotel y excursiones.",
    "recommendations": "Abrigo por capas, calzado cerrado, protector solar, sombrero, hidratación y documento de viaje.",
    "restrictions": "Altura superior a 4.000 m en El Tatio; cambios de temperatura; evaluar condiciones físicas. Piloto solo para adultos (18+).",
    "accessibility": "No verificada; excursiones en altitud y caminatas en terreno irregular."
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Llegada a Calama y aclimatación en San Pedro",
      "date": "2027-03-22",
      "intro": "Vuelo Santiago–Calama, transfer a San Pedro, registro en hotel y tarde de aclimatación. Actividad lunar solo si el proveedor confirma operación.",
      "activities": [
        {
          "time": "09:00",
          "activity": "Presentación en aeropuerto de Santiago",
          "detail": "Hora estimada; depende del vuelo."
        },
        {
          "time": "11:00",
          "activity": "Vuelo Santiago → Calama",
          "detail": "Aerolínea y vuelo por confirmar; duración aproximada de 2 horas."
        },
        {
          "time": "13:00",
          "activity": "Recepción y traslado en Calama",
          "detail": "Transfer compartido de 1 h 15 a 1 h 30 aproximadamente."
        },
        {
          "time": "15:00",
          "activity": "Check-in y descanso",
          "detail": "Hidratación y aclimatación; comidas por cuenta del viajero."
        },
        {
          "time": "20:30",
          "activity": "Experiencia astronómica / lunar",
          "detail": "Solo si se confirma bajo condiciones de luna llena."
        }
      ],
      "meals": "No se incluyen comidas; desayuno desde el día siguiente.",
      "lodging": "Terrantai 4★, primera noche sujeto a confirmación",
      "transport": "Vuelo SCL–CJC y transfer compartido",
      "difficulty": "Aclimatación progresiva a ~2.400 m",
      "operationalNote": "No fijar la excursión nocturna sin horarios y proveedor confirmados."
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
      "intro": "Desayuno y salida del hotel. Transfer al aeropuerto de Calama y vuelo CJC–SCL en la tarde/noche del Viernes Santo.",
      "activities": [
        {
          "time": "08:00",
          "activity": "Desayuno",
          "detail": "Según disponibilidad del comedor."
        },
        {
          "time": "11:00",
          "activity": "Check-out y tiempo libre",
          "detail": "Entregar habitación a la hora oficial."
        },
        {
          "time": "13:00",
          "activity": "Transfer San Pedro → Calama",
          "detail": "Hora definitiva en función del vuelo."
        },
        {
          "time": "16:00–22:00",
          "activity": "Vuelo Calama → Santiago",
          "detail": "Franja solicitada, vuelo no confirmado."
        }
      ],
      "meals": "Desayuno",
      "lodging": "Fin del programa",
      "transport": "Transfer CJC y vuelo CJC–SCL",
      "difficulty": "Planear tiempo suficiente para embarque",
      "operationalNote": "El 26/03 es feriado; verificar vuelos y transfer."
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
    "included": true,
    "route": "SCL-CJC-SCL",
    "preferredAirlines": [
      "LATAM",
      "SKY",
      "JetSMART"
    ],
    "returnWindow": "2027-03-26 tarde/noche",
    "flightConfirmed": false,
    "originDomesticSCL": true
  },
  "transfers": {
    "included": true,
    "route": "CJC–hotel San Pedro–CJC",
    "mode": "compartido",
    "confirmed": false
  },
  "pricing": {
    "currency": "USD",
    "basisOccupancy": 2,
    "defaultAdults": 2,
    "defaultChildren": 0,
    "pricePerAdultOnDoubleUSD": 1449.5,
    "baseGroupPriceForTwoUSD": 2899,
    "priceStatus": "REFERENCIAL_NO_PUBLICAR",
    "childrenPriceUSD": null,
    "soloRateStatus": "PENDIENTE_TARIFA_SINGLE",
    "costValidationRequired": true
  },
  "seo": {
    "title": "Desierto de Atacama Premium 5D/4N | LATAM Expeditions",
    "description": "Viaja 5 días al desierto de Atacama con hotel Terrantai 4 estrellas, vuelos internos, traslados y excursiones guiadas. Cotización bajo solicitud.",
    "keywords": "desierto de atacama 5 días, san pedro de atacama paquete, piedras rojas, géiseres del tatio, chile 5d4n",
    "heroImage": "",
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
    "notes": "Plantilla de prueba: requiere tarifas hoteleras y validación antes de publicar."
  }
};

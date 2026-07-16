// Nombre del negocio del cliente en esta demo. Se personaliza por instalación.
export const CLIENT_BUSINESS_NAME = "Clínica Dental López";

// Dato de ejemplo: en una implementación real este número saldría de un contador
// registrado por el agente de WhatsApp en cada conversación. Aquí solo se muestra
// para ilustrar la capacidad, sin montar el tracking real.
export const DEMO_AI_CONVERSATIONS_TODAY = 12;
export const DEMO_AI_CONVERSATIONS_DELTA = "+3 vs ayer";

// Mensajes de ejemplo para el widget "Conversaciones por WhatsApp". Los nombres
// se emparejan en tiempo de render con pacientes reales de la base de datos;
// el contenido del mensaje en sí es ilustrativo, no viene de una conversación real.
export const DEMO_WHATSAPP_MESSAGES: { text: string; minutesAgo: number }[] = [
  { text: "Quiero agendar una cita para limpieza", minutesAgo: 0 },
  { text: "Perfecto, muchas gracias", minutesAgo: 2 },
  { text: "¿Cuánto cuesta el blanqueamiento?", minutesAgo: 5 },
];

require("dotenv").config();
const twilio = require("twilio");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

function normalizarNumero(numeroIngresado, paisISO2 = "AR") {
  let raw = String(numeroIngresado || "").trim();

  const clean = raw.replace(/[^\d+]/g, "");
  const tieneMas = clean.startsWith("+");

  console.log("Normalizar: entrada", { numeroIngresado, clean, paisISO2 });

  if (paisISO2 === "AR") {
    let digits = tieneMas ? clean.slice(1) : clean;

    if (digits.startsWith("54")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    if (!digits.startsWith("9")) {
      digits = "9" + digits;
    }

    const e164 = "+54" + digits;

    const p = parsePhoneNumberFromString(e164);
    if (p && p.isValid()) {
      console.log("Normalizar: salida AR", { e164 });
      return p.number;
    }

    console.warn("Normalizar: librería no validó AR, devolviendo construcción manual", { e164 });
    return e164;
  }

  const parsed = tieneMas
    ? parsePhoneNumberFromString(clean)
    : parsePhoneNumberFromString(clean, paisISO2);

  if (parsed && parsed.isValid()) {
    const e164 = parsed.number;
    console.log("Normalizar: salida otros países", { e164 });
    return e164;
  }

  throw new Error(`Número inválido para país ${paisISO2}: "${numeroIngresado}"`);
}

async function enviarWhatsappReserva({ telefono, telefonoPais, nombre, personas, numeroReserva }) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  console.log("Enviar WhatsApp: entrada", { telefono, telefonoPais, nombre, personas });

  const telefonoCorregido = normalizarNumero(telefono, telefonoPais);

  console.log("Enviar WhatsApp: destino", { to: `whatsapp:${telefonoCorregido}` });

  const message = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${telefonoCorregido}`,
    body: `Cómo estas ${nombre}, tu reserva de ${personas} personas fué confirmada. Tu número de reserva es ${numeroReserva}. Por favor te pedimos que lo guardes.`
  });

  console.log(`Mensaje enviado a ${telefonoCorregido}`);
}

module.exports = { enviarWhatsappReserva };


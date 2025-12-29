const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { enviarWhatsappReserva } = require("./whatsapp");

const {
  MercadoPagoConfig,
  Preference,
  Payment
} = require("mercadopago");

dotenv.config();

const PORT = process.env.PORT || 3003;

console.log("ENV MP:", !!process.env.TEST_ACCESS_TOKEN);
console.log("ENV TWILIO:", !!process.env.TWILIO_ACCOUNT_SID);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Base de datos conectada"))
  .catch(console.error);

const app = express();

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.TEST_ACCESS_TOKEN
});

const preferenceClient = new Preference(mpClient);
const paymentClient = new Payment(mpClient);

const reservaSchema = new mongoose.Schema({
  externalReference: { type: String, unique: true },
  nombre: String,
  apellido: String,
  telefono: String,
  personas: Number,
  paymentId: String,
  status: { type: String, default: "pending" },
  paidAmount: Number,
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});

const Reserva = mongoose.model("Reserva", reservaSchema);

app.post("/generar", async (req, res) => {
  try {
    const { nombre, apellido, telefono, telefonoPais, personas } = req.body;

    const externalReference = new mongoose.Types.ObjectId().toString();

    await Reserva.create({
      externalReference,
      nombre,
      apellido,
      telefono,
      telefonoPais,
      personas,
      totalAmount: 100
    });

    const preference = {
      items: [
        {
          title: "Reserva de mesa",
          quantity: 1,
          unit_price: 100,
          currency_id: "ARS"
        }
      ],
      external_reference: externalReference,
      back_urls: {
        success:
          "https://tabularasacerveza.com"
      },
      auto_return: "approved",
      notification_url:
        "https://tabularasacerveza.com/notificar"
    };

    const response = await preferenceClient.create({ body: preference });

    res.json({ init_point: response.init_point });
  } catch (error) {
    console.error("Error en /generar:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/success", (req, res) => {
  res.send(`
    <h1>Pago aprobado ✅</h1>
    <p>Gracias por tu reserva</p>
  `);
});

app.post("/notificar", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type !== "payment") {
      return res.sendStatus(200);
    }

    const payment = await paymentClient.get({ id: data.id });

    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    const reserva = await Reserva.findOneAndUpdate(
      { externalReference: payment.external_reference },
      {
        paymentId: payment.id,
        status: "approved",
        paidAmount: payment.transaction_amount
      },
      { new: true }
    );

    if (reserva) {
      await enviarWhatsappReserva({
        telefono: reserva.telefono,
        telefonoPais: reserva.telefonoPais,
        nombre: reserva.nombre,
        personas: reserva.personas,
        numeroReserva: payment.id
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


module.exports = app;

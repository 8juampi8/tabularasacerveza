const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { enviarWhatsappReserva } = require("./whatsapp");
const mysql = require("mysql2/promise");
const crypto = require("crypto");


const {
  MercadoPagoConfig,
  Preference,
  Payment
} = require("mercadopago");

dotenv.config();

const PORT = process.env.PORT || 3003;

console.log("ENV MP:", !!process.env.ACCESS_TOKEN);
console.log("ENV TWILIO:", !!process.env.TWILIO_ACCOUNT_SID);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});

const app = express();

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN
});

const preferenceClient = new Preference(mpClient);
const paymentClient = new Payment(mpClient);

app.post("/generar", async (req, res) => {
  try {
    const { nombre, apellido, telefono, telefonoPais, personas } = req.body;

    const externalReference = crypto.randomUUID();

    console.log("Valores a insertar:", [
      externalReference,
      nombre,
      apellido,
      telefono,
      telefonoPais,
      personas,
      100
    ]);

    const [result] = await db.query(
      `
      INSERT INTO reservas
      (external_reference, nombre, apellido, telefono, telefono_pais, personas, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        externalReference,
        nombre,
        apellido,
        telefono,
        telefonoPais,
        personas,
        100
      ]
    );


    console.log("Resultado INSERT:", result);

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
          "https://tabularasacerveza.vercel.app/success"
      },
      auto_return: "approved",
      notification_url:
        "https://tabularasacerveza.vercel.app/notificar"
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

    const [updateResult] = await db.query(
      `
      UPDATE reservas
      SET payment_id = ?, status = 'approved', paid_amount = ?
      WHERE external_reference = ?
      `,
      [
        payment.id,
        payment.transaction_amount,
        payment.external_reference
      ]
    );

    if (updateResult.affectedRows === 0) {
      console.log("No se encontró la reserva");
      return res.sendStatus(200);
    }

    const [rows] = await db.query(
      `SELECT * FROM reservas WHERE external_reference = ?`,
      [payment.external_reference]
    );

    const reserva = rows[0];

    await enviarWhatsappReserva({
      telefono: reserva.telefono,
      telefonoPais: reserva.telefono_pais,
      nombre: reserva.nombre,
      personas: reserva.personas,
      numeroReserva: payment.id
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en /notificar:", error);
    res.sendStatus(500);
  }
});



module.exports = app;

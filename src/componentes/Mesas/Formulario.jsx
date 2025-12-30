import { useState } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export function Formulario() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    telefonoPais: "AR",
    personas: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const pagar = async () => {
    try {
      setLoading(true);

      const { data } = await axios.post(
        "https://tabularasacerveza.vercel.app/generar",
        formData
      );
      window.location.href = data.init_point;
    } catch (error) {
      console.error("Error al iniciar el pago", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overlay formulario">
      <form id="reservar-mesas">
        <div className="campo">
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ingresa tu nombre..."
          />
        </div>

        <div className="campo">
          <label>Apellido:</label>
          <input
            type="text"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            placeholder="Ingresa tu apellido..."
          />
        </div>

        <div className="campo">
          <label>Número de teléfono:</label>
          <PhoneInput
            country={"ar"}
            value={formData.telefono}
            onChange={(value, country) =>
              setFormData({
                ...formData,
                telefono: value,
                telefonoPais: country?.countryCode?.toUpperCase() || "AR"
              })
            }
            inputProps={{
              name: "telefono",
              required: true,
              className: "form-control"
            }}
          />
        </div>

        <div className="campo">
          <label>Cantidad de personas:</label>
          <input
            type="number"
            name="personas"
            value={formData.personas}
            onChange={handleChange}
            placeholder="Ingresa la cantidad..."
          />
        </div>

        <button
          type="button"
          className="confirmar-reserva-btn"
          onClick={pagar}
        >
          {loading ? "Redirigiendo a MercadoPago..." : "Confirmar Reserva"}
        </button>
      </form>
    </section>
  );
}

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

  const validarFormulario = () => {
    if (!formData.nombre.trim()) return "El nombre es obligatorio";
    if (!formData.apellido.trim()) return "El apellido es obligatorio";
    if (!formData.telefono.trim()) return "El teléfono es obligatorio";
    if (!formData.personas || Number(formData.personas) <= 0)
      return "La cantidad de personas debe ser mayor a 0";
    return null;
  };

  const pagar = async () => {
    const error = validarFormulario();
    if (error) {
      alert(error);
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post(
        "https://tabularasacerveza.vercel.app/generar",
        formData
      );

      window.location.href = data.init_point;
    } catch (error) {
      console.error("Error al iniciar el pago", error);
      alert("Error al iniciar el pago");
    } finally {
      setLoading(false);
    }
  };

  const formularioValido =
    formData.nombre.trim() !== "" &&
    formData.apellido.trim() !== "" &&
    formData.telefono.trim() !== "" &&
    Number(formData.personas) > 0;

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
          />
        </div>

        <div className="campo">
          <label>Apellido:</label>
          <input
            type="text"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
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
          />
        </div>

        <div className="campo">
          <label>Cantidad de personas:</label>
          <input
            type="number"
            name="personas"
            value={formData.personas}
            onChange={handleChange}
          />
        </div>

        <button
          type="button"
          className="confirmar-reserva-btn"
          onClick={pagar}
          disabled={!formularioValido || loading}
        >
          {loading ? "Redirigiendo a MercadoPago..." : "Confirmar Reserva"}
        </button>
      </form>
    </section>
  );
}

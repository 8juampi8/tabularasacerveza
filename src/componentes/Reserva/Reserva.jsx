import './reserva.css'
import { Link } from 'react-router-dom'

export function Reserva() {
    return(
        <section className='overlay'>
            <div className="reserva">
                <h2>¡Bienvenido!</h2>
                <h3>El tributo a Soda Stereo visitará nuestra fábrica el 31, ¡No te lo pierdas!</h3>
                <img src="/assets/banda2.png" alt="" />
                <Link
                    to='/reservar'
                    className='comenzar-reserva-btn'
                >
                    Reservar mi mesa
                </Link>
            </div>
        </section>
    )
}
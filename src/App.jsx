import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './componentes/Layout/Header'
import { Footer } from './componentes/Layout/Footer'
import { Error } from './componentes/Error/Error'
import { Reserva } from './componentes/Reserva/Reserva'
import { Mesas } from './componentes/Mesas/Mesas'

export function App() {
  return(
    <BrowserRouter>
      <div id='on-phone'>
        <Header />
        <main>
          <Routes>
            <Route path='/' element={<Reserva />} />
            <Route path='/reservar' element={<Mesas />} />
          </Routes>
        </main>
        <Footer />
      </div>

      <div id='no-on-phone'>
        <Error />
      </div>
    </BrowserRouter>
  )
}
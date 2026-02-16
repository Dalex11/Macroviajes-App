import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Brain, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const ALL_QUESTIONS: Question[] = [
  { id: 1, question: '¿Cuál es la capital de Francia?', options: ['Londres', 'Berlín', 'París', 'Madrid'], correctAnswer: 2, category: 'Geografía' },
  { id: 2, question: '¿Cuántos planetas hay en el sistema solar?', options: ['7', '8', '9', '10'], correctAnswer: 1, category: 'Ciencia' },
  { id: 3, question: '¿En qué año llegó el hombre a la Luna?', options: ['1965', '1967', '1969', '1971'], correctAnswer: 2, category: 'Historia' },
  { id: 4, question: '¿Cuál es el océano más grande del mundo?', options: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], correctAnswer: 3, category: 'Geografía' },
  { id: 5, question: '¿Quién escribió "Don Quijote de la Mancha"?', options: ['Gabriel García Márquez', 'Miguel de Cervantes', 'Pablo Neruda', 'Jorge Luis Borges'], correctAnswer: 1, category: 'Literatura' },
  { id: 6, question: '¿Cuál es el elemento químico más abundante en el universo?', options: ['Oxígeno', 'Carbono', 'Hidrógeno', 'Nitrógeno'], correctAnswer: 2, category: 'Ciencia' },
  { id: 7, question: '¿En qué país se encuentra la Torre Eiffel?', options: ['Italia', 'Francia', 'España', 'Alemania'], correctAnswer: 1, category: 'Geografía' },
  { id: 8, question: '¿Cuántos continentes hay en la Tierra?', options: ['5', '6', '7', '8'], correctAnswer: 2, category: 'Geografía' },
  { id: 9, question: '¿Cuál es el animal terrestre más rápido?', options: ['León', 'Guepardo', 'Tigre', 'Leopardo'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 10, question: '¿Cuál es el río más largo del mundo?', options: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'], correctAnswer: 1, category: 'Geografía' },
  { id: 11, question: '¿Quién pintó la Mona Lisa?', options: ['Picasso', 'Van Gogh', 'Leonardo da Vinci', 'Miguel Ángel'], correctAnswer: 2, category: 'Arte' },
  { id: 12, question: '¿Cuál es el país más grande del mundo?', options: ['Canadá', 'China', 'Estados Unidos', 'Rusia'], correctAnswer: 3, category: 'Geografía' },
  { id: 13, question: '¿En qué año comenzó la Segunda Guerra Mundial?', options: ['1937', '1939', '1941', '1943'], correctAnswer: 1, category: 'Historia' },
  { id: 14, question: '¿Cuál es el metal más abundante en la corteza terrestre?', options: ['Hierro', 'Aluminio', 'Cobre', 'Oro'], correctAnswer: 1, category: 'Ciencia' },
  { id: 15, question: '¿Quién escribió "Cien años de soledad"?', options: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Octavio Paz', 'Carlos Fuentes'], correctAnswer: 1, category: 'Literatura' },
  { id: 16, question: '¿Cuál es la montaña más alta del mundo?', options: ['K2', 'Kilimanjaro', 'Monte Everest', 'Aconcagua'], correctAnswer: 2, category: 'Geografía' },
  { id: 17, question: '¿Cuántos huesos tiene el cuerpo humano adulto?', options: ['196', '206', '216', '226'], correctAnswer: 1, category: 'Ciencia' },
  { id: 18, question: '¿Quién fue el primer presidente de Estados Unidos?', options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'], correctAnswer: 2, category: 'Historia' },
  { id: 19, question: '¿Cuál es la capital de Japón?', options: ['Osaka', 'Kioto', 'Tokio', 'Hiroshima'], correctAnswer: 2, category: 'Geografía' },
  { id: 20, question: '¿En qué año cayó el Muro de Berlín?', options: ['1987', '1989', '1991', '1993'], correctAnswer: 1, category: 'Historia' },
  { id: 21, question: '¿Cuál es el planeta más grande del sistema solar?', options: ['Saturno', 'Júpiter', 'Urano', 'Neptuno'], correctAnswer: 1, category: 'Ciencia' },
  { id: 22, question: '¿Quién compuso la Novena Sinfonía?', options: ['Mozart', 'Bach', 'Beethoven', 'Chopin'], correctAnswer: 2, category: 'Música' },
  { id: 23, question: '¿Cuál es el idioma más hablado del mundo?', options: ['Inglés', 'Mandarín', 'Español', 'Hindi'], correctAnswer: 1, category: 'Cultura' },
  { id: 24, question: '¿En qué continente está Egipto?', options: ['Asia', 'África', 'Europa', 'Oriente Medio'], correctAnswer: 1, category: 'Geografía' },
  { id: 25, question: '¿Cuál es el órgano más grande del cuerpo humano?', options: ['Hígado', 'Cerebro', 'Pulmón', 'Piel'], correctAnswer: 3, category: 'Ciencia' },
  { id: 26, question: '¿Quién escribió "Romeo y Julieta"?', options: ['Charles Dickens', 'William Shakespeare', 'Oscar Wilde', 'Jane Austen'], correctAnswer: 1, category: 'Literatura' },
  { id: 27, question: '¿Cuál es la moneda de Japón?', options: ['Yuan', 'Won', 'Yen', 'Rupia'], correctAnswer: 2, category: 'Economía' },
  { id: 28, question: '¿En qué año descubrió Colón América?', options: ['1490', '1492', '1494', '1496'], correctAnswer: 1, category: 'Historia' },
  { id: 29, question: '¿Cuál es el desierto más grande del mundo?', options: ['Sahara', 'Gobi', 'Antártico', 'Arábigo'], correctAnswer: 2, category: 'Geografía' },
  { id: 30, question: '¿Quién pintó "La noche estrellada"?', options: ['Monet', 'Van Gogh', 'Rembrandt', 'Dalí'], correctAnswer: 1, category: 'Arte' },
  { id: 31, question: '¿Cuál es la velocidad de la luz?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correctAnswer: 0, category: 'Ciencia' },
  { id: 32, question: '¿En qué ciudad está la Estatua de la Libertad?', options: ['Washington', 'Boston', 'Nueva York', 'Filadelfia'], correctAnswer: 2, category: 'Geografía' },
  { id: 33, question: '¿Cuántos jugadores tiene un equipo de fútbol?', options: ['9', '10', '11', '12'], correctAnswer: 2, category: 'Deportes' },
  { id: 34, question: '¿Quién inventó la bombilla eléctrica?', options: ['Nikola Tesla', 'Thomas Edison', 'Benjamin Franklin', 'Alexander Graham Bell'], correctAnswer: 1, category: 'Historia' },
  { id: 35, question: '¿Cuál es la capital de Australia?', options: ['Sídney', 'Melbourne', 'Canberra', 'Brisbane'], correctAnswer: 2, category: 'Geografía' },
  { id: 36, question: '¿En qué año terminó la Primera Guerra Mundial?', options: ['1916', '1917', '1918', '1919'], correctAnswer: 2, category: 'Historia' },
  { id: 37, question: '¿Cuál es el animal más grande del mundo?', options: ['Elefante africano', 'Ballena azul', 'Tiburón ballena', 'Jirafa'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 38, question: '¿Quién escribió "1984"?', options: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], correctAnswer: 1, category: 'Literatura' },
  { id: 39, question: '¿Cuál es el país más poblado del mundo?', options: ['India', 'China', 'Estados Unidos', 'Indonesia'], correctAnswer: 0, category: 'Geografía' },
  { id: 40, question: '¿Cuántos lados tiene un hexágono?', options: ['5', '6', '7', '8'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 41, question: '¿Quién fue el líder de la Revolución Cubana?', options: ['Che Guevara', 'Fidel Castro', 'Hugo Chávez', 'Salvador Allende'], correctAnswer: 1, category: 'Historia' },
  { id: 42, question: '¿Cuál es la capital de Canadá?', options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], correctAnswer: 3, category: 'Geografía' },
  { id: 43, question: '¿En qué océano están las Islas Maldivas?', options: ['Atlántico', 'Pacífico', 'Índico', 'Ártico'], correctAnswer: 2, category: 'Geografía' },
  { id: 44, question: '¿Quién pintó la Capilla Sixtina?', options: ['Leonardo da Vinci', 'Rafael', 'Miguel Ángel', 'Donatello'], correctAnswer: 2, category: 'Arte' },
  { id: 45, question: '¿Cuál es el metal precioso más caro?', options: ['Oro', 'Platino', 'Rodio', 'Paladio'], correctAnswer: 2, category: 'Economía' },
  { id: 46, question: '¿En qué país se originó el tango?', options: ['España', 'México', 'Argentina', 'Cuba'], correctAnswer: 2, category: 'Cultura' },
  { id: 47, question: '¿Cuántos corazones tiene un pulpo?', options: ['1', '2', '3', '4'], correctAnswer: 2, category: 'Naturaleza' },
  { id: 48, question: '¿Quién escribió "El Principito"?', options: ['Jules Verne', 'Antoine de Saint-Exupéry', 'Victor Hugo', 'Alexandre Dumas'], correctAnswer: 1, category: 'Literatura' },
  { id: 49, question: '¿Cuál es la capital de Brasil?', options: ['São Paulo', 'Río de Janeiro', 'Brasília', 'Salvador'], correctAnswer: 2, category: 'Geografía' },
  { id: 50, question: '¿En qué año se fundó la ONU?', options: ['1943', '1945', '1947', '1949'], correctAnswer: 1, category: 'Historia' },
  { id: 51, question: '¿Cuál es el gas más abundante en la atmósfera terrestre?', options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Argón'], correctAnswer: 1, category: 'Ciencia' },
  { id: 52, question: '¿Quién dirigió "El Padrino"?', options: ['Martin Scorsese', 'Francis Ford Coppola', 'Steven Spielberg', 'Stanley Kubrick'], correctAnswer: 1, category: 'Cine' },
  { id: 53, question: '¿Cuál es el lago más profundo del mundo?', options: ['Lago Superior', 'Lago Victoria', 'Lago Baikal', 'Lago Tanganica'], correctAnswer: 2, category: 'Geografía' },
  { id: 54, question: '¿Cuántos años tiene un siglo?', options: ['50', '100', '150', '200'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 55, question: '¿Quién fue Nelson Mandela?', options: ['Presidente de Sudáfrica', 'Presidente de Kenia', 'Rey de Lesoto', 'Primer ministro de Nigeria'], correctAnswer: 0, category: 'Historia' },
  { id: 56, question: '¿Cuál es la capital de Egipto?', options: ['Alejandría', 'El Cairo', 'Luxor', 'Asuán'], correctAnswer: 1, category: 'Geografía' },
  { id: 57, question: '¿En qué deporte se usa un birdie?', options: ['Golf', 'Tenis', 'Bádminton', 'Cricket'], correctAnswer: 2, category: 'Deportes' },
  { id: 58, question: '¿Quién desarrolló la teoría de la relatividad?', options: ['Isaac Newton', 'Albert Einstein', 'Stephen Hawking', 'Niels Bohr'], correctAnswer: 1, category: 'Ciencia' },
  { id: 59, question: '¿Cuál es el país más pequeño del mundo?', options: ['Mónaco', 'Liechtenstein', 'Ciudad del Vaticano', 'San Marino'], correctAnswer: 2, category: 'Geografía' },
  { id: 60, question: '¿En qué año se imprimió el primer libro?', options: ['1440', '1450', '1455', '1460'], correctAnswer: 2, category: 'Historia' },
  { id: 61, question: '¿Cuál es la fórmula química del agua?', options: ['H2O', 'CO2', 'O2', 'H2O2'], correctAnswer: 0, category: 'Ciencia' },
  { id: 62, question: '¿Quién escribió "La Odisea"?', options: ['Sófocles', 'Homero', 'Virgilio', 'Ovidio'], correctAnswer: 1, category: 'Literatura' },
  { id: 63, question: '¿Cuál es la capital de Tailandia?', options: ['Phuket', 'Chiang Mai', 'Bangkok', 'Pattaya'], correctAnswer: 2, category: 'Geografía' },
  { id: 64, question: '¿Cuántos días tiene un año bisiesto?', options: ['364', '365', '366', '367'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 65, question: '¿Quién inventó el teléfono?', options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Guglielmo Marconi'], correctAnswer: 1, category: 'Historia' },
  { id: 66, question: '¿Cuál es la capital de Argentina?', options: ['Córdoba', 'Rosario', 'Buenos Aires', 'Mendoza'], correctAnswer: 2, category: 'Geografía' },
  { id: 67, question: '¿En qué año comenzó la Primera Guerra Mundial?', options: ['1912', '1914', '1916', '1918'], correctAnswer: 1, category: 'Historia' },
  { id: 68, question: '¿Cuál es el planeta más cercano al Sol?', options: ['Venus', 'Mercurio', 'Marte', 'Tierra'], correctAnswer: 1, category: 'Ciencia' },
  { id: 69, question: '¿Quién pintó "El Guernica"?', options: ['Salvador Dalí', 'Joan Miró', 'Pablo Picasso', 'Francisco Goya'], correctAnswer: 2, category: 'Arte' },
  { id: 70, question: '¿Cuál es el deporte más popular del mundo?', options: ['Baloncesto', 'Fútbol', 'Cricket', 'Tenis'], correctAnswer: 1, category: 'Deportes' },
  { id: 71, question: '¿En qué país está la Gran Muralla?', options: ['Japón', 'China', 'Mongolia', 'Corea del Sur'], correctAnswer: 1, category: 'Geografía' },
  { id: 72, question: '¿Cuántos grados tiene un ángulo recto?', options: ['45', '60', '90', '180'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 73, question: '¿Quién fue Cleopatra?', options: ['Reina de Grecia', 'Reina de Egipto', 'Reina de Persia', 'Reina de Roma'], correctAnswer: 1, category: 'Historia' },
  { id: 74, question: '¿Cuál es la capital de Alemania?', options: ['Múnich', 'Hamburgo', 'Berlín', 'Fráncfort'], correctAnswer: 2, category: 'Geografía' },
  { id: 75, question: '¿En qué instrumento se especializa un violinista?', options: ['Viola', 'Violín', 'Violonchelo', 'Contrabajo'], correctAnswer: 1, category: 'Música' },
  { id: 76, question: '¿Cuál es el símbolo químico del oro?', options: ['Go', 'Au', 'Or', 'Gd'], correctAnswer: 1, category: 'Ciencia' },
  { id: 77, question: '¿Quién escribió "Hamlet"?', options: ['Christopher Marlowe', 'William Shakespeare', 'Ben Jonson', 'John Milton'], correctAnswer: 1, category: 'Literatura' },
  { id: 78, question: '¿Cuál es la capital de Italia?', options: ['Milán', 'Nápoles', 'Roma', 'Florencia'], correctAnswer: 2, category: 'Geografía' },
  { id: 79, question: '¿Cuántos minutos tiene una hora?', options: ['50', '60', '70', '80'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 80, question: '¿En qué año se independizó México?', options: ['1810', '1821', '1824', '1836'], correctAnswer: 1, category: 'Historia' },
  { id: 81, question: '¿Cuál es la montaña más alta de África?', options: ['Monte Kenia', 'Kilimanjaro', 'Monte Stanley', 'Ras Dashen'], correctAnswer: 1, category: 'Geografía' },
  { id: 82, question: '¿Quién compuso "La Traviata"?', options: ['Puccini', 'Verdi', 'Mozart', 'Wagner'], correctAnswer: 1, category: 'Música' },
  { id: 83, question: '¿Cuál es el océano más pequeño?', options: ['Índico', 'Antártico', 'Ártico', 'Atlántico'], correctAnswer: 2, category: 'Geografía' },
  { id: 84, question: '¿Cuántos lados tiene un triángulo?', options: ['2', '3', '4', '5'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 85, question: '¿Quién fue Mahatma Gandhi?', options: ['Líder pakistaní', 'Líder indio', 'Líder nepalí', 'Líder afgano'], correctAnswer: 1, category: 'Historia' },
  { id: 86, question: '¿Cuál es la capital de España?', options: ['Barcelona', 'Valencia', 'Madrid', 'Sevilla'], correctAnswer: 2, category: 'Geografía' },
  { id: 87, question: '¿En qué deporte se usa una raqueta?', options: ['Fútbol', 'Baloncesto', 'Tenis', 'Béisbol'], correctAnswer: 2, category: 'Deportes' },
  { id: 88, question: '¿Cuál es el símbolo químico de la plata?', options: ['Si', 'Ag', 'Pl', 'Sr'], correctAnswer: 1, category: 'Ciencia' },
  { id: 89, question: '¿Quién escribió "La Divina Comedia"?', options: ['Petrarca', 'Boccaccio', 'Dante Alighieri', 'Maquiavelo'], correctAnswer: 2, category: 'Literatura' },
  { id: 90, question: '¿Cuál es la capital de Rusia?', options: ['San Petersburgo', 'Moscú', 'Kiev', 'Kazán'], correctAnswer: 1, category: 'Geografía' },
  { id: 91, question: '¿Cuántas teclas tiene un piano estándar?', options: ['76', '88', '92', '100'], correctAnswer: 1, category: 'Música' },
  { id: 92, question: '¿En qué año comenzó la Revolución Francesa?', options: ['1785', '1789', '1793', '1799'], correctAnswer: 1, category: 'Historia' },
  { id: 93, question: '¿Cuál es el volcán más alto de Europa?', options: ['Vesubio', 'Etna', 'Teide', 'Stromboli'], correctAnswer: 1, category: 'Geografía' },
  { id: 94, question: '¿Quién pintó "Las Meninas"?', options: ['El Greco', 'Velázquez', 'Goya', 'Murillo'], correctAnswer: 1, category: 'Arte' },
  { id: 95, question: '¿Cuál es la unidad de medida de la temperatura?', options: ['Grado', 'Metro', 'Litro', 'Kilo'], correctAnswer: 0, category: 'Ciencia' },
  { id: 96, question: '¿Quién escribió "El conde de Montecristo"?', options: ['Victor Hugo', 'Alexandre Dumas', 'Émile Zola', 'Gustave Flaubert'], correctAnswer: 1, category: 'Literatura' },
  { id: 97, question: '¿Cuál es la capital de Portugal?', options: ['Oporto', 'Lisboa', 'Braga', 'Coímbra'], correctAnswer: 1, category: 'Geografía' },
  { id: 98, question: '¿Cuántos jugadores tiene un equipo de baloncesto en la cancha?', options: ['4', '5', '6', '7'], correctAnswer: 1, category: 'Deportes' },
  { id: 99, question: '¿En qué año se inventó Internet?', options: ['1969', '1979', '1989', '1991'], correctAnswer: 0, category: 'Historia' },
  { id: 100, question: '¿Cuál es la capital de Grecia?', options: ['Salónica', 'Atenas', 'Esparta', 'Creta'], correctAnswer: 1, category: 'Geografía' },
  { id: 101, question: '¿Quién escribió "Orgullo y Prejuicio"?', options: ['Emily Brontë', 'Jane Austen', 'Charlotte Brontë', 'Mary Shelley'], correctAnswer: 1, category: 'Literatura' },
  { id: 102, question: '¿Cuál es la capital de Noruega?', options: ['Bergen', 'Oslo', 'Trondheim', 'Stavanger'], correctAnswer: 1, category: 'Geografía' },
  { id: 103, question: '¿En qué año cayó el Imperio Romano de Occidente?', options: ['376', '476', '576', '676'], correctAnswer: 1, category: 'Historia' },
  { id: 104, question: '¿Cuál es el hueso más largo del cuerpo humano?', options: ['Tibia', 'Húmero', 'Fémur', 'Radio'], correctAnswer: 2, category: 'Ciencia' },
  { id: 105, question: '¿Quién pintó "La persistencia de la memoria"?', options: ['René Magritte', 'Salvador Dalí', 'Joan Miró', 'Max Ernst'], correctAnswer: 1, category: 'Arte' },
  { id: 106, question: '¿Cuál es el país con más islas en el mundo?', options: ['Indonesia', 'Filipinas', 'Suecia', 'Canadá'], correctAnswer: 2, category: 'Geografía' },
  { id: 107, question: '¿Quién fue el primer hombre en el espacio?', options: ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'], correctAnswer: 2, category: 'Historia' },
  { id: 108, question: '¿Cuántos cromosomas tiene un ser humano?', options: ['23', '46', '48', '52'], correctAnswer: 1, category: 'Ciencia' },
  { id: 109, question: '¿Quién compuso "Las cuatro estaciones"?', options: ['Bach', 'Vivaldi', 'Handel', 'Corelli'], correctAnswer: 1, category: 'Música' },
  { id: 110, question: '¿Cuál es la capital de Suiza?', options: ['Zúrich', 'Ginebra', 'Berna', 'Basilea'], correctAnswer: 2, category: 'Geografía' },
  { id: 111, question: '¿En qué año se hundió el Titanic?', options: ['1910', '1912', '1914', '1916'], correctAnswer: 1, category: 'Historia' },
  { id: 112, question: '¿Cuál es el ave más rápida del mundo?', options: ['Águila real', 'Halcón peregrino', 'Cóndor', 'Milano'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 113, question: '¿Quién escribió "Crimen y Castigo"?', options: ['León Tolstói', 'Fiódor Dostoyevski', 'Antón Chéjov', 'Iván Turguénev'], correctAnswer: 1, category: 'Literatura' },
  { id: 114, question: '¿Cuál es la moneda de Reino Unido?', options: ['Euro', 'Libra esterlina', 'Corona', 'Franco'], correctAnswer: 1, category: 'Economía' },
  { id: 115, question: '¿En qué país se encuentra Machu Picchu?', options: ['Bolivia', 'Ecuador', 'Perú', 'Colombia'], correctAnswer: 2, category: 'Geografía' },
  { id: 116, question: '¿Cuántos segundos tiene un minuto?', options: ['30', '50', '60', '100'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 117, question: '¿Quién dirigió "Pulp Fiction"?', options: ['Martin Scorsese', 'Quentin Tarantino', 'Steven Spielberg', 'Ridley Scott'], correctAnswer: 1, category: 'Cine' },
  { id: 118, question: '¿Cuál es el metal más conductor de electricidad?', options: ['Oro', 'Plata', 'Cobre', 'Aluminio'], correctAnswer: 1, category: 'Ciencia' },
  { id: 119, question: '¿En qué continente está Uruguay?', options: ['América del Norte', 'América del Sur', 'América Central', 'Europa'], correctAnswer: 1, category: 'Geografía' },
  { id: 120, question: '¿Cuántos lados tiene un octágono?', options: ['6', '7', '8', '9'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 121, question: '¿Quién fue Julio César?', options: ['Rey de Grecia', 'Emperador de Roma', 'General y político romano', 'Filósofo griego'], correctAnswer: 2, category: 'Historia' },
  { id: 122, question: '¿Cuál es la capital de Turquía?', options: ['Estambul', 'Ankara', 'Esmirna', 'Bursa'], correctAnswer: 1, category: 'Geografía' },
  { id: 123, question: '¿Quién escribió "El retrato de Dorian Gray"?', options: ['Oscar Wilde', 'James Joyce', 'Virginia Woolf', 'Charles Dickens'], correctAnswer: 0, category: 'Literatura' },
  { id: 124, question: '¿Cuál es la estrella más cercana a la Tierra?', options: ['Sirio', 'Próxima Centauri', 'El Sol', 'Alfa Centauri'], correctAnswer: 2, category: 'Ciencia' },
  { id: 125, question: '¿En qué deporte destacó Michael Jordan?', options: ['Fútbol', 'Baloncesto', 'Béisbol', 'Tenis'], correctAnswer: 1, category: 'Deportes' },
  { id: 126, question: '¿Cuál es el río más caudaloso del mundo?', options: ['Nilo', 'Amazonas', 'Congo', 'Yangtsé'], correctAnswer: 1, category: 'Geografía' },
  { id: 127, question: '¿Quién pintó "El grito"?', options: ['Vincent van Gogh', 'Edvard Munch', 'Gustav Klimt', 'Paul Gauguin'], correctAnswer: 1, category: 'Arte' },
  { id: 128, question: '¿Cuántos estados tiene Estados Unidos?', options: ['48', '49', '50', '51'], correctAnswer: 2, category: 'Geografía' },
  { id: 129, question: '¿En qué año se inventó la imprenta?', options: ['1340', '1440', '1540', '1640'], correctAnswer: 1, category: 'Historia' },
  { id: 130, question: '¿Cuál es el insecto más rápido del mundo?', options: ['Libélula', 'Avispa', 'Escarabajo tigre', 'Mosca'], correctAnswer: 2, category: 'Naturaleza' },
  { id: 131, question: '¿Quién escribió "Los miserables"?', options: ['Alexandre Dumas', 'Victor Hugo', 'Émile Zola', 'Honoré de Balzac'], correctAnswer: 1, category: 'Literatura' },
  { id: 132, question: '¿Cuál es la capital de Dinamarca?', options: ['Aarhus', 'Odense', 'Copenhague', 'Aalborg'], correctAnswer: 2, category: 'Geografía' },
  { id: 133, question: '¿Cuántos grados tiene un círculo completo?', options: ['180', '270', '360', '450'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 134, question: '¿Quién inventó la penicilina?', options: ['Louis Pasteur', 'Alexander Fleming', 'Robert Koch', 'Jonas Salk'], correctAnswer: 1, category: 'Ciencia' },
  { id: 135, question: '¿En qué país se originó el sushi?', options: ['China', 'Japón', 'Corea', 'Tailandia'], correctAnswer: 1, category: 'Cultura' },
  { id: 136, question: '¿Cuál es la capital de Polonia?', options: ['Cracovia', 'Varsovia', 'Gdansk', 'Wroclaw'], correctAnswer: 1, category: 'Geografía' },
  { id: 137, question: '¿Quién dirigió "Titanic"?', options: ['Steven Spielberg', 'James Cameron', 'Peter Jackson', 'Ridley Scott'], correctAnswer: 1, category: 'Cine' },
  { id: 138, question: '¿Cuál es el elemento más abundante en la corteza terrestre?', options: ['Hierro', 'Oxígeno', 'Silicio', 'Aluminio'], correctAnswer: 1, category: 'Ciencia' },
  { id: 139, question: '¿En qué año se firmó la Declaración de Independencia de EE.UU.?', options: ['1774', '1776', '1778', '1780'], correctAnswer: 1, category: 'Historia' },
  { id: 140, question: '¿Cuál es la montaña más alta de América?', options: ['Denali', 'Aconcagua', 'Logan', 'Pico de Orizaba'], correctAnswer: 1, category: 'Geografía' },
  { id: 141, question: '¿Quién compuso "El lago de los cisnes"?', options: ['Stravinsky', 'Tchaikovsky', 'Prokofiev', 'Rimsky-Korsakov'], correctAnswer: 1, category: 'Música' },
  { id: 142, question: '¿Cuál es el animal nacional de Australia?', options: ['Koala', 'Canguro', 'Emú', 'Wombat'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 143, question: '¿Quién escribió "Moby Dick"?', options: ['Mark Twain', 'Herman Melville', 'Edgar Allan Poe', 'Nathaniel Hawthorne'], correctAnswer: 1, category: 'Literatura' },
  { id: 144, question: '¿Cuál es la capital de Bélgica?', options: ['Amberes', 'Gante', 'Brujas', 'Bruselas'], correctAnswer: 3, category: 'Geografía' },
  { id: 145, question: '¿Cuántos jugadores tiene un equipo de béisbol en el campo?', options: ['8', '9', '10', '11'], correctAnswer: 1, category: 'Deportes' },
  { id: 146, question: '¿En qué año se construyó la Gran Muralla China?', options: ['Siglo III a.C.', 'Siglo I a.C.', 'Siglo I d.C.', 'Siglo V d.C.'], correctAnswer: 0, category: 'Historia' },
  { id: 147, question: '¿Cuál es el idioma oficial de Brasil?', options: ['Español', 'Portugués', 'Inglés', 'Francés'], correctAnswer: 1, category: 'Cultura' },
  { id: 148, question: '¿Quién pintó "El nacimiento de Venus"?', options: ['Rafael', 'Botticelli', 'Caravaggio', 'Tiziano'], correctAnswer: 1, category: 'Arte' },
  { id: 149, question: '¿Cuál es la capital de Irlanda?', options: ['Cork', 'Galway', 'Dublín', 'Limerick'], correctAnswer: 2, category: 'Geografía' },
  { id: 150, question: '¿Cuántos litros tiene un metro cúbico?', options: ['100', '500', '1000', '10000'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 151, question: '¿Quién descubrió la radioactividad?', options: ['Marie Curie', 'Antoine Henri Becquerel', 'Ernest Rutherford', 'Wilhelm Röntgen'], correctAnswer: 1, category: 'Ciencia' },
  { id: 152, question: '¿En qué país se encuentra Petra?', options: ['Egipto', 'Jordania', 'Arabia Saudita', 'Siria'], correctAnswer: 1, category: 'Geografía' },
  { id: 153, question: '¿Quién fue Simón Bolívar?', options: ['Libertador de América del Sur', 'Conquistador español', 'Explorador portugués', 'Presidente de México'], correctAnswer: 0, category: 'Historia' },
  { id: 154, question: '¿Cuál es el animal más grande que ha existido?', options: ['Diplodocus', 'Ballena azul', 'Megalodon', 'T-Rex'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 155, question: '¿Quién escribió "Alicia en el país de las maravillas"?', options: ['C.S. Lewis', 'Lewis Carroll', 'J.M. Barrie', 'Roald Dahl'], correctAnswer: 1, category: 'Literatura' },
  { id: 156, question: '¿Cuál es la capital de Austria?', options: ['Salzburgo', 'Viena', 'Graz', 'Innsbruck'], correctAnswer: 1, category: 'Geografía' },
  { id: 157, question: '¿En qué deporte se usa un puck?', options: ['Fútbol americano', 'Hockey sobre hielo', 'Rugby', 'Lacrosse'], correctAnswer: 1, category: 'Deportes' },
  { id: 158, question: '¿Cuál es el símbolo químico del sodio?', options: ['So', 'Na', 'Sd', 'S'], correctAnswer: 1, category: 'Ciencia' },
  { id: 159, question: '¿Quién dirigió "El Señor de los Anillos"?', options: ['George Lucas', 'Peter Jackson', 'James Cameron', 'Christopher Nolan'], correctAnswer: 1, category: 'Cine' },
  { id: 160, question: '¿Cuál es la capital de Hungría?', options: ['Debrecen', 'Szeged', 'Budapest', 'Pécs'], correctAnswer: 2, category: 'Geografía' },
  { id: 161, question: '¿En qué año se disolvió la Unión Soviética?', options: ['1989', '1990', '1991', '1992'], correctAnswer: 2, category: 'Historia' },
  { id: 162, question: '¿Cuántos dientes tiene un adulto humano?', options: ['28', '30', '32', '34'], correctAnswer: 2, category: 'Ciencia' },
  { id: 163, question: '¿Quién pintó "La última cena"?', options: ['Michelangelo', 'Leonardo da Vinci', 'Rafael', 'Caravaggio'], correctAnswer: 1, category: 'Arte' },
  { id: 164, question: '¿Cuál es el país más largo del mundo?', options: ['Rusia', 'Canadá', 'Chile', 'Argentina'], correctAnswer: 2, category: 'Geografía' },
  { id: 165, question: '¿Quién escribió "El gran Gatsby"?', options: ['Ernest Hemingway', 'F. Scott Fitzgerald', 'John Steinbeck', 'William Faulkner'], correctAnswer: 1, category: 'Literatura' },
  { id: 166, question: '¿Cuál es la moneda de China?', options: ['Yen', 'Won', 'Yuan', 'Rupia'], correctAnswer: 2, category: 'Economía' },
  { id: 167, question: '¿En qué país se encuentra Angkor Wat?', options: ['Tailandia', 'Vietnam', 'Camboya', 'Laos'], correctAnswer: 2, category: 'Geografía' },
  { id: 168, question: '¿Cuántos milímetros tiene un centímetro?', options: ['5', '10', '100', '1000'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 169, question: '¿Quién fue Leonardo da Vinci?', options: ['Escultor italiano', 'Arquitecto francés', 'Artista y científico italiano', 'Poeta español'], correctAnswer: 2, category: 'Historia' },
  { id: 170, question: '¿Cuál es la capital de Croacia?', options: ['Split', 'Dubrovnik', 'Zagreb', 'Rijeka'], correctAnswer: 2, category: 'Geografía' },
  { id: 171, question: '¿Quién compuso "La marcha imperial" de Star Wars?', options: ['Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Danny Elfman'], correctAnswer: 1, category: 'Música' },
  { id: 172, question: '¿Cuál es el planeta más caliente del sistema solar?', options: ['Mercurio', 'Venus', 'Marte', 'Júpiter'], correctAnswer: 1, category: 'Ciencia' },
  { id: 173, question: '¿En qué año se fundó Facebook?', options: ['2002', '2004', '2006', '2008'], correctAnswer: 1, category: 'Historia' },
  { id: 174, question: '¿Cuál es el ave nacional de Estados Unidos?', options: ['Cóndor', 'Águila calva', 'Halcón', 'Búho'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 175, question: '¿Quién escribió "Guerra y Paz"?', options: ['Dostoyevski', 'León Tolstói', 'Chéjov', 'Turguénev'], correctAnswer: 1, category: 'Literatura' },
  { id: 176, question: '¿Cuál es la capital de República Checa?', options: ['Brno', 'Praga', 'Ostrava', 'Pilsen'], correctAnswer: 1, category: 'Geografía' },
  { id: 177, question: '¿Cuántos jugadores tiene un equipo de voleibol en cancha?', options: ['5', '6', '7', '8'], correctAnswer: 1, category: 'Deportes' },
  { id: 178, question: '¿Cuál es el símbolo químico del hierro?', options: ['Hi', 'Fe', 'Ir', 'Fr'], correctAnswer: 1, category: 'Ciencia' },
  { id: 179, question: '¿Quién dirigió "Star Wars"?', options: ['Steven Spielberg', 'George Lucas', 'Francis Ford Coppola', 'Ridley Scott'], correctAnswer: 1, category: 'Cine' },
  { id: 180, question: '¿En qué país está la ciudad de Tombuctú?', options: ['Egipto', 'Argelia', 'Mali', 'Senegal'], correctAnswer: 2, category: 'Geografía' },
  { id: 181, question: '¿En qué año nació Jesús de Nazaret aproximadamente?', options: ['Año 1', 'Año 0', '4-6 a.C.', '1 d.C.'], correctAnswer: 2, category: 'Historia' },
  { id: 182, question: '¿Cuál es el mamífero más pequeño del mundo?', options: ['Musaraña etrusca', 'Murciélago moscardón', 'Ratón pigmeo', 'Jerbo'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 183, question: '¿Quién escribió "Drácula"?', options: ['Mary Shelley', 'Bram Stoker', 'Edgar Allan Poe', 'H.P. Lovecraft'], correctAnswer: 1, category: 'Literatura' },
  { id: 184, question: '¿Cuál es la capital de Finlandia?', options: ['Tampere', 'Espoo', 'Helsinki', 'Turku'], correctAnswer: 2, category: 'Geografía' },
  { id: 185, question: '¿Cuántos años tiene una década?', options: ['5', '10', '20', '50'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 186, question: '¿Quién inventó la teoría de la evolución?', options: ['Gregor Mendel', 'Charles Darwin', 'Louis Pasteur', 'Jean-Baptiste Lamarck'], correctAnswer: 1, category: 'Ciencia' },
  { id: 187, question: '¿En qué país se encuentra Chichén Itzá?', options: ['Guatemala', 'Honduras', 'México', 'Belice'], correctAnswer: 2, category: 'Geografía' },
  { id: 188, question: '¿Quién fue Joan of Arc (Juana de Arco)?', options: ['Reina de Francia', 'Santa y heroína francesa', 'Emperatriz romana', 'Poeta medieval'], correctAnswer: 1, category: 'Historia' },
  { id: 189, question: '¿Cuál es el pez más rápido?', options: ['Atún', 'Pez vela', 'Tiburón mako', 'Marlín'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 190, question: '¿Quién pintó "El jardín de las delicias"?', options: ['El Bosco', 'Brueghel', 'Van Eyck', 'Memling'], correctAnswer: 0, category: 'Arte' },
  { id: 191, question: '¿Cuál es la capital de Escocia?', options: ['Glasgow', 'Edimburgo', 'Aberdeen', 'Dundee'], correctAnswer: 1, category: 'Geografía' },
  { id: 192, question: '¿En qué deporte destacó Muhammad Ali?', options: ['Lucha libre', 'Boxeo', 'Karate', 'Judo'], correctAnswer: 1, category: 'Deportes' },
  { id: 193, question: '¿Cuál es el punto de ebullición del agua?', options: ['90°C', '100°C', '110°C', '120°C'], correctAnswer: 1, category: 'Ciencia' },
  { id: 194, question: '¿Quién escribió "Frankenstein"?', options: ['Mary Shelley', 'Bram Stoker', 'Emily Brontë', 'Ann Radcliffe'], correctAnswer: 0, category: 'Literatura' },
  { id: 195, question: '¿Cuál es la capital de Nueva Zelanda?', options: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'], correctAnswer: 1, category: 'Geografía' },
  { id: 196, question: '¿Cuántos continentes comienzan con la letra A?', options: ['1', '2', '3', '4'], correctAnswer: 3, category: 'Geografía' },
  { id: 197, question: '¿Quién dirigió "Psicosis"?', options: ['Orson Welles', 'Alfred Hitchcock', 'Billy Wilder', 'Fritz Lang'], correctAnswer: 1, category: 'Cine' },
  { id: 198, question: '¿En qué año se inventó el teléfono móvil?', options: ['1973', '1983', '1993', '2003'], correctAnswer: 0, category: 'Historia' },
  { id: 199, question: '¿Cuál es el mamífero que pone huevos?', options: ['Equidna', 'Canguro', 'Koala', 'Wombat'], correctAnswer: 0, category: 'Naturaleza' },
  { id: 200, question: '¿Quién compuso "El Mesías"?', options: ['Bach', 'Handel', 'Haydn', 'Mozart'], correctAnswer: 1, category: 'Música' },
  { id: 201, question: '¿Cuál es la capital de Islandia?', options: ['Akureyri', 'Reikiavik', 'Kópavogur', 'Hafnarfjörður'], correctAnswer: 1, category: 'Geografía' },
  { id: 202, question: '¿Cuántos centímetros tiene un metro?', options: ['10', '50', '100', '1000'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 203, question: '¿Quién fue Isaac Newton?', options: ['Químico francés', 'Físico y matemático inglés', 'Astrónomo alemán', 'Biólogo italiano'], correctAnswer: 1, category: 'Ciencia' },
  { id: 204, question: '¿En qué país se encuentra Abu Simbel?', options: ['Sudán', 'Egipto', 'Etiopía', 'Libia'], correctAnswer: 1, category: 'Geografía' },
  { id: 205, question: '¿Quién escribió "El viejo y el mar"?', options: ['William Faulkner', 'Ernest Hemingway', 'John Steinbeck', 'Tennessee Williams'], correctAnswer: 1, category: 'Literatura' },
  { id: 206, question: '¿Cuál es la moneda de Suecia?', options: ['Euro', 'Krona', 'Franco', 'Libra'], correctAnswer: 1, category: 'Economía' },
  { id: 207, question: '¿En qué año llegó Cristóbal Colón a América?', options: ['1490', '1492', '1494', '1498'], correctAnswer: 1, category: 'Historia' },
  { id: 208, question: '¿Cuál es el reptil más grande del mundo?', options: ['Anaconda', 'Pitón reticulada', 'Cocodrilo marino', 'Caimán negro'], correctAnswer: 2, category: 'Naturaleza' },
  { id: 209, question: '¿Quién pintó "Los girasoles"?', options: ['Monet', 'Van Gogh', 'Cézanne', 'Gauguin'], correctAnswer: 1, category: 'Arte' },
  { id: 210, question: '¿Cuál es la capital de Bulgaria?', options: ['Plovdiv', 'Varna', 'Sofía', 'Burgas'], correctAnswer: 2, category: 'Geografía' },
  { id: 211, question: '¿En qué deporte se usa un guante de receptor?', options: ['Fútbol americano', 'Béisbol', 'Hockey', 'Críquet'], correctAnswer: 1, category: 'Deportes' },
  { id: 212, question: '¿Cuál es el símbolo químico del potasio?', options: ['Po', 'Pt', 'K', 'P'], correctAnswer: 2, category: 'Ciencia' },
  { id: 213, question: '¿Quién dirigió "El silencio de los corderos"?', options: ['David Fincher', 'Jonathan Demme', 'Ridley Scott', 'Michael Mann'], correctAnswer: 1, category: 'Cine' },
  { id: 214, question: '¿Cuál es la ciudad más poblada del mundo?', options: ['Shanghái', 'Tokio', 'Delhi', 'São Paulo'], correctAnswer: 1, category: 'Geografía' },
  { id: 215, question: '¿En qué año terminó la Guerra Fría?', options: ['1987', '1989', '1991', '1993'], correctAnswer: 2, category: 'Historia' },
  { id: 216, question: '¿Cuántos tentáculos tiene una medusa?', options: ['Varía según la especie', 'Siempre 8', 'Siempre 10', 'Siempre 6'], correctAnswer: 0, category: 'Naturaleza' },
  { id: 217, question: '¿Quién escribió "En busca del tiempo perdido"?', options: ['Albert Camus', 'Marcel Proust', 'Jean-Paul Sartre', 'André Gide'], correctAnswer: 1, category: 'Literatura' },
  { id: 218, question: '¿Cuál es la capital de Eslovenia?', options: ['Maribor', 'Liubliana', 'Celje', 'Kranj'], correctAnswer: 1, category: 'Geografía' },
  { id: 219, question: '¿Cuántos grados tiene un triángulo equilátero en cada ángulo?', options: ['45', '60', '90', '120'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 220, question: '¿Quién descubrió la vacuna contra la rabia?', options: ['Louis Pasteur', 'Robert Koch', 'Edward Jenner', 'Alexander Fleming'], correctAnswer: 0, category: 'Ciencia' },
  { id: 221, question: '¿En qué país se encuentra la Torre de Pisa?', options: ['Francia', 'España', 'Italia', 'Grecia'], correctAnswer: 2, category: 'Geografía' },
  { id: 222, question: '¿Quién fue Alejandro Magno?', options: ['Emperador romano', 'Rey de Macedonia', 'Faraón egipcio', 'Emperador persa'], correctAnswer: 1, category: 'Historia' },
  { id: 223, question: '¿Cuál es el animal terrestre más lento?', options: ['Tortuga', 'Caracol', 'Perezoso', 'Koala'], correctAnswer: 2, category: 'Naturaleza' },
  { id: 224, question: '¿Quién pintó "La joven de la perla"?', options: ['Rembrandt', 'Vermeer', 'Hals', 'Van Dyck'], correctAnswer: 1, category: 'Arte' },
  { id: 225, question: '¿Cuál es la capital de Lituania?', options: ['Kaunas', 'Vilna', 'Klaipėda', 'Šiauliai'], correctAnswer: 1, category: 'Geografía' },
  { id: 226, question: '¿Cuántos Grand Slam hay en el tenis?', options: ['3', '4', '5', '6'], correctAnswer: 1, category: 'Deportes' },
  { id: 227, question: '¿Cuál es la velocidad del sonido?', options: ['243 m/s', '343 m/s', '443 m/s', '543 m/s'], correctAnswer: 1, category: 'Ciencia' },
  { id: 228, question: '¿Quién escribió "Las aventuras de Tom Sawyer"?', options: ['Jack London', 'Mark Twain', 'Herman Melville', 'Nathaniel Hawthorne'], correctAnswer: 1, category: 'Literatura' },
  { id: 229, question: '¿Cuál es la moneda de India?', options: ['Dólar', 'Peso', 'Rupia', 'Yen'], correctAnswer: 2, category: 'Economía' },
  { id: 230, question: '¿En qué país se encuentra Stonehenge?', options: ['Irlanda', 'Inglaterra', 'Escocia', 'Gales'], correctAnswer: 1, category: 'Geografía' },
  { id: 231, question: '¿Cuántos años duró la Guerra de los Cien Años?', options: ['100', '116', '125', '150'], correctAnswer: 1, category: 'Historia' },
  { id: 232, question: '¿Cuál es el árbol más alto del mundo?', options: ['Eucalipto', 'Secuoya', 'Baobab', 'Ciprés'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 233, question: '¿Quién compuso "La flauta mágica"?', options: ['Beethoven', 'Mozart', 'Haydn', 'Schubert'], correctAnswer: 1, category: 'Música' },
  { id: 234, question: '¿Cuál es la capital de Letonia?', options: ['Liepāja', 'Daugavpils', 'Riga', 'Jūrmala'], correctAnswer: 2, category: 'Geografía' },
  { id: 235, question: '¿Cuántos lados tiene un pentágono?', options: ['4', '5', '6', '7'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 236, question: '¿Quién inventó la máquina de vapor?', options: ['Thomas Newcomen', 'James Watt', 'George Stephenson', 'Richard Trevithick'], correctAnswer: 1, category: 'Historia' },
  { id: 237, question: '¿En qué país se encuentra el Taj Mahal?', options: ['Pakistán', 'Bangladesh', 'India', 'Nepal'], correctAnswer: 2, category: 'Geografía' },
  { id: 238, question: '¿Quién dirigió "Matrix"?', options: ['Las hermanas Wachowski', 'Christopher Nolan', 'James Cameron', 'Ridley Scott'], correctAnswer: 0, category: 'Cine' },
  { id: 239, question: '¿Cuál es el gas noble más abundante?', options: ['Helio', 'Neón', 'Argón', 'Kriptón'], correctAnswer: 2, category: 'Ciencia' },
  { id: 240, question: '¿Quién escribió "Anna Karenina"?', options: ['Dostoyevski', 'León Tolstói', 'Chéjov', 'Pushkin'], correctAnswer: 1, category: 'Literatura' },
  { id: 241, question: '¿Cuál es la capital de Estonia?', options: ['Tartu', 'Narva', 'Tallin', 'Pärnu'], correctAnswer: 2, category: 'Geografía' },
  { id: 242, question: '¿En qué deporte se usa un shuttlecock?', options: ['Tenis', 'Squash', 'Bádminton', 'Tenis de mesa'], correctAnswer: 2, category: 'Deportes' },
  { id: 243, question: '¿Cuántos huesos tiene la columna vertebral humana?', options: ['26', '33', '40', '45'], correctAnswer: 1, category: 'Ciencia' },
  { id: 244, question: '¿Quién pintó "La ronda de noche"?', options: ['Vermeer', 'Rembrandt', 'Hals', 'Van Gogh'], correctAnswer: 1, category: 'Arte' },
  { id: 245, question: '¿Cuál es el país más ancho del mundo (este a oeste)?', options: ['Canadá', 'Rusia', 'China', 'Estados Unidos'], correctAnswer: 1, category: 'Geografía' },
  { id: 246, question: '¿En qué año se abolió la esclavitud en EE.UU.?', options: ['1861', '1863', '1865', '1867'], correctAnswer: 2, category: 'Historia' },
  { id: 247, question: '¿Cuál es el único mamífero que puede volar?', options: ['Ardilla voladora', 'Murciélago', 'Lemur volador', 'Pez volador'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 248, question: '¿Quién escribió "Ulises"?', options: ['Oscar Wilde', 'James Joyce', 'Samuel Beckett', 'W.B. Yeats'], correctAnswer: 1, category: 'Literatura' },
  { id: 249, question: '¿Cuál es la capital de Eslovaquia?', options: ['Košice', 'Bratislava', 'Prešov', 'Žilina'], correctAnswer: 1, category: 'Geografía' },
  { id: 250, question: '¿Cuántos metros tiene un kilómetro?', options: ['100', '500', '1000', '10000'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 251, question: '¿Quién descubrió el electromagnetismo?', options: ['Michael Faraday', 'Hans Christian Ørsted', 'James Clerk Maxwell', 'André-Marie Ampère'], correctAnswer: 1, category: 'Ciencia' },
  { id: 252, question: '¿En qué país se encuentra la Alhambra?', options: ['Portugal', 'España', 'Marruecos', 'Italia'], correctAnswer: 1, category: 'Geografía' },
  { id: 253, question: '¿Quién fue Winston Churchill?', options: ['Rey de Inglaterra', 'Primer ministro británico', 'Presidente de EE.UU.', 'General francés'], correctAnswer: 1, category: 'Historia' },
  { id: 254, question: '¿Cuál es el tiburón más grande?', options: ['Tiburón blanco', 'Tiburón tigre', 'Tiburón ballena', 'Tiburón martillo'], correctAnswer: 2, category: 'Naturaleza' },
  { id: 255, question: '¿Quién compuso "El cascanueces"?', options: ['Stravinsky', 'Tchaikovsky', 'Prokofiev', 'Shostakovich'], correctAnswer: 1, category: 'Música' },
  { id: 256, question: '¿Cuál es la capital de Serbia?', options: ['Novi Sad', 'Niš', 'Belgrado', 'Kragujevac'], correctAnswer: 2, category: 'Geografía' },
  { id: 257, question: '¿En qué año se fundó Google?', options: ['1996', '1998', '2000', '2002'], correctAnswer: 1, category: 'Historia' },
  { id: 258, question: '¿Cuál es el símbolo químico del calcio?', options: ['Cl', 'Ca', 'C', 'Co'], correctAnswer: 1, category: 'Ciencia' },
  { id: 259, question: '¿Quién dirigió "Forrest Gump"?', options: ['Robert Zemeckis', 'Steven Spielberg', 'Ron Howard', 'Frank Darabont'], correctAnswer: 0, category: 'Cine' },
  { id: 260, question: '¿Cuál es la capital de Albania?', options: ['Durrës', 'Vlorë', 'Tirana', 'Shkodër'], correctAnswer: 2, category: 'Geografía' },
  { id: 261, question: '¿Cuántos jugadores tiene un equipo de rugby?', options: ['11', '13', '15', '17'], correctAnswer: 2, category: 'Deportes' },
  { id: 262, question: '¿Quién escribió "El extranjero"?', options: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'André Gide'], correctAnswer: 1, category: 'Literatura' },
  { id: 263, question: '¿Cuál es la montaña más alta de Europa?', options: ['Mont Blanc', 'Cervino', 'Monte Rosa', 'Elbrús'], correctAnswer: 3, category: 'Geografía' },
  { id: 264, question: '¿En qué año se firmó la Carta Magna?', options: ['1115', '1215', '1315', '1415'], correctAnswer: 1, category: 'Historia' },
  { id: 265, question: '¿Cuál es el planeta más pequeño del sistema solar?', options: ['Marte', 'Mercurio', 'Venus', 'Plutón'], correctAnswer: 1, category: 'Ciencia' },
  { id: 266, question: '¿Quién pintó "El beso"?', options: ['Schiele', 'Klimt', 'Munch', 'Kokoschka'], correctAnswer: 1, category: 'Arte' },
  { id: 267, question: '¿Cuál es la capital de Bosnia?', options: ['Mostar', 'Banja Luka', 'Sarajevo', 'Tuzla'], correctAnswer: 2, category: 'Geografía' },
  { id: 268, question: '¿Cuántos grados Fahrenheit son 0 grados Celsius?', options: ['0', '16', '32', '64'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 269, question: '¿Quién inventó la bombilla incandescente moderna?', options: ['Nikola Tesla', 'Thomas Edison', 'Joseph Swan', 'Heinrich Göbel'], correctAnswer: 1, category: 'Historia' },
  { id: 270, question: '¿En qué país se encuentra la isla de Bali?', options: ['Tailandia', 'Filipinas', 'Indonesia', 'Malasia'], correctAnswer: 2, category: 'Geografía' },
  { id: 271, question: '¿Cuál es el anfibio más grande?', options: ['Rana toro', 'Salamandra gigante china', 'Sapo de caña', 'Ajolote'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 272, question: '¿Quién escribió "Lolita"?', options: ['Vladimir Nabokov', 'Boris Pasternak', 'Aleksandr Solzhenitsyn', 'Ivan Bunin'], correctAnswer: 0, category: 'Literatura' },
  { id: 273, question: '¿Cuál es la capital de Macedonia del Norte?', options: ['Bitola', 'Skopie', 'Tetovo', 'Ohrid'], correctAnswer: 1, category: 'Geografía' },
  { id: 274, question: '¿En qué deporte se usa un tableado?', options: ['Surf', 'Esquí', 'Snowboard', 'Skateboard'], correctAnswer: 3, category: 'Deportes' },
  { id: 275, question: '¿Cuál es el punto de fusión del hielo?', options: ['-10°C', '0°C', '10°C', '32°C'], correctAnswer: 1, category: 'Ciencia' },
  { id: 276, question: '¿Quién dirigió "Vértigo"?', options: ['Billy Wilder', 'Alfred Hitchcock', 'Orson Welles', 'John Huston'], correctAnswer: 1, category: 'Cine' },
  { id: 277, question: '¿Cuál es la ciudad más antigua del mundo continuamente habitada?', options: ['Jerusalén', 'Damasco', 'Jericó', 'Atenas'], correctAnswer: 1, category: 'Historia' },
  { id: 278, question: '¿Cuántas patas tiene una araña?', options: ['6', '8', '10', '12'], correctAnswer: 1, category: 'Naturaleza' },
  { id: 279, question: '¿Quién compuso "Réquiem en Re menor"?', options: ['Bach', 'Handel', 'Mozart', 'Verdi'], correctAnswer: 2, category: 'Música' },
  { id: 280, question: '¿Cuál es la capital de Rumanía?', options: ['Cluj-Napoca', 'Timișoara', 'Bucarest', 'Iași'], correctAnswer: 2, category: 'Geografía' },
  { id: 281, question: '¿Cuántos centímetros tiene una pulgada?', options: ['1.54', '2.54', '3.54', '4.54'], correctAnswer: 1, category: 'Matemáticas' },
  { id: 282, question: '¿Quién descubrió el ADN?', options: ['Watson y Crick', 'Rosalind Franklin', 'Friedrich Miescher', 'Gregor Mendel'], correctAnswer: 2, category: 'Ciencia' },
  { id: 283, question: '¿En qué país se encuentra el Monte Fuji?', options: ['China', 'Japón', 'Corea del Sur', 'Taiwán'], correctAnswer: 1, category: 'Geografía' },
  { id: 284, question: '¿Quién fue Martin Luther King?', options: ['Presidente de EE.UU.', 'Activista de derechos civiles', 'Poeta estadounidense', 'Científico afroamericano'], correctAnswer: 1, category: 'Historia' },
  { id: 285, question: '¿Cuál es el insecto más fuerte en relación a su peso?', options: ['Hormiga', 'Escarabajo rinoceronte', 'Abeja', 'Escarabajo pelotero'], correctAnswer: 3, category: 'Naturaleza' },
  { id: 286, question: '¿Quién pintó "La creación de Adán"?', options: ['Leonardo da Vinci', 'Rafael', 'Miguel Ángel', 'Donatello'], correctAnswer: 2, category: 'Arte' },
  { id: 287, question: '¿Cuál es la capital de Malta?', options: ['Mdina', 'Sliema', 'La Valeta', 'Gozo'], correctAnswer: 2, category: 'Geografía' },
  { id: 288, question: '¿Cuántas Copas del Mundo de fútbol ha ganado Brasil?', options: ['3', '4', '5', '6'], correctAnswer: 2, category: 'Deportes' },
  { id: 289, question: '¿Cuál es el símbolo químico del tungsteno?', options: ['Tu', 'Tn', 'W', 'T'], correctAnswer: 2, category: 'Ciencia' },
  { id: 290, question: '¿Quién escribió "El nombre de la rosa"?', options: ['Italo Calvino', 'Umberto Eco', 'Alberto Moravia', 'Pier Paolo Pasolini'], correctAnswer: 1, category: 'Literatura' },
  { id: 291, question: '¿Cuál es la moneda de Suiza?', options: ['Euro', 'Franco suizo', 'Corona', 'Marco'], correctAnswer: 1, category: 'Economía' },
  { id: 292, question: '¿En qué país se encuentra Dubái?', options: ['Arabia Saudita', 'Emiratos Árabes Unidos', 'Qatar', 'Kuwait'], correctAnswer: 1, category: 'Geografía' },
  { id: 293, question: '¿Cuántos años duró la Guerra de Vietnam?', options: ['10', '15', '20', '25'], correctAnswer: 2, category: 'Historia' },
  { id: 294, question: '¿Cuál es el loro más grande del mundo?', options: ['Guacamayo azul', 'Cacatúa', 'Loro gris africano', 'Kakapo'], correctAnswer: 0, category: 'Naturaleza' },
  { id: 295, question: '¿Quién dirigió "El Resplandor"?', options: ['Francis Ford Coppola', 'Stanley Kubrick', 'Roman Polanski', 'David Lynch'], correctAnswer: 1, category: 'Cine' },
  { id: 296, question: '¿Cuál es la capital de Montenegro?', options: ['Budva', 'Podgorica', 'Kotor', 'Nikšić'], correctAnswer: 1, category: 'Geografía' },
  { id: 297, question: '¿Cuántos lados tiene un decágono?', options: ['8', '9', '10', '12'], correctAnswer: 2, category: 'Matemáticas' },
  { id: 298, question: '¿Quién fue Marie Curie?', options: ['Astrónoma polaca', 'Física y química polaca', 'Matemática francesa', 'Bióloga alemana'], correctAnswer: 1, category: 'Ciencia' },
  { id: 299, question: '¿En qué país se encuentra la Sagrada Familia?', options: ['Portugal', 'España', 'Italia', 'Francia'], correctAnswer: 1, category: 'Geografía' },
  { id: 300, question: '¿Quién escribió "Matar a un ruiseñor"?', options: ['Harper Lee', 'Truman Capote', 'John Steinbeck', 'Carson McCullers'], correctAnswer: 0, category: 'Literatura' },
];

function getRandomQuestions(count: number): Question[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function TriviaGame() {
  const router = useRouter();
  const [gameQuestions, setGameQuestions] = useState<Question[]>(() => getRandomQuestions(10));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);

  const currentQuestion = useMemo(() => gameQuestions[currentQuestionIndex], [gameQuestions, currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 10);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      const calculatedFinalScore = score + (selectedAnswer === currentQuestion.correctAnswer ? 10 : 0);
      setFinalScore(calculatedFinalScore);
      setGameFinished(true);
      Alert.alert(
        '¡Juego Terminado!',
        `Tu puntuación final: ${calculatedFinalScore} de ${gameQuestions.length * 10}`,
        [{ text: 'OK' }]
      );
    }
  };

  const resetGame = () => {
    setGameQuestions(getRandomQuestions(10));
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setGameFinished(false);
    setFinalScore(0);
  };

  const getOptionStyle = (index: number) => {
    if (!isAnswered) return styles.option;
    
    if (index === currentQuestion.correctAnswer) {
      return [styles.option, styles.optionCorrect];
    }
    
    if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
      return [styles.option, styles.optionIncorrect];
    }
    
    return [styles.option, styles.optionDisabled];
  };

  if (gameFinished) {
    return (
      <>
        <Stack.Screen options={{ title: 'Trivia', headerShown: true }} />
        <View style={styles.container}>
          <View style={styles.finishContainer}>
            <Trophy size={80} color={COLORS.secondary} />
            <Text style={styles.finishTitle}>¡Felicidades!</Text>
            <Text style={styles.finishScore}>
              Puntuación Final: {finalScore} / {gameQuestions.length * 10}
            </Text>
            <Text style={styles.finishPercentage}>
              {Math.round((finalScore / (gameQuestions.length * 10)) * 100)}% Correcto
            </Text>
            
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <RotateCcw size={20} color={COLORS.white} />
              <Text style={styles.resetButtonText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>VOLVER AL MENÚ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Trivia', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <Brain size={24} color={COLORS.primary} />
            <Text style={styles.progressText}>
              Pregunta {currentQuestionIndex + 1} de {gameQuestions.length}
            </Text>
          </View>
          <Text style={styles.scoreText}>Puntuación: {score}</Text>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{currentQuestion.category}</Text>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getOptionStyle(index)}
              onPress={() => handleAnswerSelect(index)}
              disabled={isAnswered}
            >
              <Text style={styles.optionText}>{option}</Text>
              {isAnswered && index === currentQuestion.correctAnswer && (
                <CheckCircle2 size={24} color={COLORS.success} />
              )}
              {isAnswered && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                <XCircle size={24} color={COLORS.error} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isAnswered && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < gameQuestions.length - 1 ? 'SIGUIENTE PREGUNTA' : 'VER RESULTADOS'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  categoryBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  questionContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.xl,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: SPACING.md,
  },
  option: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionCorrect: {
    borderColor: COLORS.success,
    backgroundColor: '#E8F5E9',
  },
  optionIncorrect: {
    borderColor: COLORS.error,
    backgroundColor: '#FFEBEE',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  finishContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  finishTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  finishScore: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  finishPercentage: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  resetButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  backButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

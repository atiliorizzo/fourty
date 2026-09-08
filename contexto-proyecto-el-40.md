# Proyecto: Videojuego digital "El 40"

## 1. Descripción general

Videojuego digital basado en el juego de cartas tradicional ecuatoriano **"El 40"** (también llamado "Caída y Limpia"), popular en las Fiestas de Quito. Se busca crear una versión jugable online con soporte para IA como oponente/compañero.

### Modos de juego requeridos
- **Solo vs. IA**: 1 jugador humano contra bots, con **niveles de dificultad**.
- **Online 1 vs 1**: dos jugadores humanos.
- **Online 2 vs 2**: parejas humanas, con posibilidad de completar equipos con IA.
- **Online 4 jugadores**: cuatro jugadores humanos en 2 parejas.

### Decisión de arquitectura clave
El servidor siempre es la autoridad de la partida (server-authoritative). Cada "mesa" tiene 4 asientos, y cada asiento puede estar ocupado por un jugador humano (vía WebSocket) o por una IA (proceso en el servidor). Así, todos los modos de juego (solo, 1v1, 2v2, 4 jugadores) son la misma sala de juego con distinta combinación de humanos/IA. La IA se implementa como distintas estrategias/heurísticas que consumen el mismo motor de reglas.

## 2. Reglas del juego "El 40"

### Mazo y reparto
- Se usa un naipe de 52 cartas, separando los **8, 9 y 10** (llamados **"perros"**), que no se juegan y se reservan para llevar el puntaje. Se juega con las 40 cartas restantes (As al 7, más J, Q, K).
- Se juega entre 2 personas o 2 parejas de 2 (4 jugadores). Si son 4, los miembros de un mismo equipo se sientan alternados (uno frente al otro, no al lado).
- Para determinar quién reparte: cada jugador saca una carta del mazo; la carta más alta empieza barajando.
- El jugador que sacó la carta más alta entrega el mazo a su oponente de la izquierda para "partir" el mazo, y luego reparte 5 cartas a cada jugador, repartiendo hacia la derecha.
- Si el reparto es incorrecto, se dice "2 por shunsho" y se otorgan 2 puntos (un "perro") al equipo rival.
- Empieza lanzando carta el jugador a la derecha del repartidor.

### Jugadas posibles
- **Caída**: cuando un jugador lanza una carta con el mismo número/figura que hay en la mesa, "le cae" y se la lleva (2 puntos).
- **Caída con consecutivas**: si al caer hay cartas consecutivas disponibles en la mesa relacionadas a esa jugada, también se las lleva (ej: cae un 3 sobre otro 3 y se lleva también el 4 y el 5 si están en la mesa).
- **Suma**: un jugador puede llevarse cartas de la mesa cuya suma sea igual al valor de una carta en su mano (ej: con un 5 se lleva un 2 y un 3, o un 4 y un As).
- **Limpia**: cuando un jugador deja la mesa completamente vacía al llevarse todas las cartas que había (2 puntos). Puede darse por caída y limpia simultáneamente (también 2 puntos).
- **Ronda**: cuando un jugador recibe 3 cartas del mismo número/figura en su mano repartida (2 puntos); si son 4 cartas iguales, es "doble ronda" (4 puntos). Se debe reclamar antes de que cualquier jugador lance su primera carta.
- **Falla**: cuando una pareja no logra levantar ninguna carta durante toda la "data" (ronda de reparto completa); el equipo rival puede reclamar 2 puntos.

### Puntaje
- Cada jugada válida (caída, limpia, caída y limpia, ronda simple, falla) otorga **2 puntos**.
- Los puntos se acumulan usando los "perros" (8, 9, 10) reservados al inicio: cada perro puesto boca arriba vale 2 puntos; puesto boca abajo (volteado), representa 10 puntos.
- Al finalizar la "data" (cuando se acaban las cartas de la mano y de la mesa), se cuentan las cartas levantadas por cada equipo. A partir de la carta 20 en adelante, cada carta adicional otorga puntos extra (ej: 20 cartas = 6 puntos, 21 = 7 puntos, y así sucesivamente).
- **Meta del juego**: llegar a (o superar) 40 puntos.
- **Regla especial "38 que no juega"**: al llegar a 38 puntos, un equipo ya NO puede ganar por suma de cartas/puntaje normal — necesita ganar específicamente con una jugada de **caída** para cerrar la partida.
- El juego completo suele ganarse al mejor de 3 partidas ("chicas").

### Notas de diseño para la IA
- La IA necesita evaluar en cada turno: ¿puedo hacer caída?, ¿puedo hacer suma?, ¿puedo hacer limpia?, y si no puede levantar nada, qué carta conviene descartar (evitando dejar jugadas fáciles al rival).
- Los niveles de dificultad pueden basarse en: (a) profundidad de la heurística (random vs. prioriza puntos altos vs. calcula riesgo de dejar jugadas al rival), y (b) si "recuerda" cartas ya jugadas para inferir la mano del rival.

## 3. Decisiones técnicas

### Lenguaje / stack recomendado
- **Backend + lógica del juego: Node.js + TypeScript**
  - El motor de reglas (mazo, turnos, validación de jugadas, puntaje) se escribe una sola vez como paquete/módulo compartido en TypeScript.
  - Buen soporte de WebSockets en tiempo real (Socket.io) para sincronizar mesas de 2 y 4 jugadores.
  - Si el frontend es React/React Native, se pueden compartir tipos entre cliente y servidor.
- **Alternativa considerada**: Kotlin + Ktor (aprovechando que Atilio ya tiene experiencia con Kotlin/Spring Boot en su trabajo en PAE 360), pero se prefiere Node/TS por el ecosistema de tiempo real y por compartir lenguaje con el frontend web.

### Arquitectura
- Servidor siempre corre el motor de reglas y es la autoridad de la partida (evita trampas y bugs de sincronización).
- Una "sala" de juego tiene 4 asientos, ocupados por humanos (WebSocket) o IA (proceso del servidor).
- Comunicación en tiempo real vía WebSockets (Socket.io o similar).

### Hosting / despliegue (gratis para empezar)
- **Backend (WebSockets)**: Render (free tier) — soporta servicios web con WebSockets, aunque tiene cold-starts de 30-60 segundos en el plan gratuito. Alternativas: Fly.io, Railway (créditos gratis limitados por mes).
  - ⚠️ Vercel y Netlify **no sirven** para el servidor de WebSockets porque corren como funciones serverless sin conexiones persistentes.
- **Frontend (si es web)**: Vercel o Netlify gratis (sirven excelente para contenido estático/React, solo no para el servidor de WebSockets).
- **Base de datos** (si se necesita más adelante, ej. para cuentas o historial): Render ofrece PostgreSQL gratis que expira a los 90 días; alternativas externas como Supabase también tienen tier gratuito.
- Limitación conocida: estos planes gratuitos son para prototipos/proyectos personales; si el juego crece en tráfico, eventualmente se necesitará un plan pago (usualmente ~$5-7/mes es suficiente para empezar a escalar).

## 4. Estado actual del proyecto
- Etapa de diseño/planificación técnica, aún no se ha empezado a programar.
- Próximo paso pendiente de definir: diseñar el motor de reglas primero, o la arquitectura completa del backend para multijugador.

# Proyecto: Videojuego digital "El 40"

## 1. Descripción general

Videojuego digital basado en el juego de cartas tradicional ecuatoriano **"El 40"** (también llamado "Caída y Limpia"), popular en las Fiestas de Quito. Se busca crear una versión jugable online con soporte para IA como oponente/compañero, manteniendo los elementos culturales del juego (Juez de Aguas, dichos tradicionales).

### Modos de juego requeridos
- **Solo vs. IA**: 1 jugador humano contra bots, con **niveles de dificultad**.
- **Online 1 vs 1**: dos jugadores humanos.
- **Online 2 vs 2**: parejas humanas, con posibilidad de completar equipos con IA.
- **Online 4 jugadores**: cuatro jugadores humanos en 2 parejas.
- **Torneos**: ver sección 4.

### Decisión de arquitectura clave
El servidor siempre es la autoridad de la partida (server-authoritative). Cada "mesa" tiene 4 asientos, y cada asiento puede estar ocupado por un jugador humano (vía WebSocket) o por una IA (proceso en el servidor). Así, todos los modos de juego (solo, 1v1, 2v2, 4 jugadores) son la misma sala de juego con distinta combinación de humanos/IA. La IA se implementa como distintas estrategias/heurísticas que consumen el mismo motor de reglas.

## 2. Reglas del juego "El 40"

### Mazo y reparto
- Se usa un naipe de **baraja francesa** de 52 cartas (corazones, diamantes, tréboles, picas — NO baraja española), separando los **8, 9 y 10** (llamados **"perros"**), que no se juegan y se reservan para llevar el puntaje. Se juega con las 40 cartas restantes (As al 7, más J, Q, K).
- Se juega entre 2 personas o 2 parejas de 2 (4 jugadores). Si son 4, los miembros de un mismo equipo se sientan alternados (uno frente al otro, no al lado).
- Para determinar quién reparte: cada jugador saca una carta del mazo; la carta más alta empieza barajando.
- El jugador que sacó la carta más alta entrega el mazo a su oponente de la izquierda para "partir" el mazo, y luego reparte 5 cartas a cada jugador, repartiendo hacia la derecha.
- Empieza lanzando carta el jugador a la derecha del repartidor.
- **La mesa arranca vacía** — no se reparten cartas a la mesa al inicio de la data, solo a las manos de los jugadores.
- Dentro de una misma "data", cuando los jugadores gastan las 5 cartas de su mano, el repartidor reparte otras 5 a cada uno del mazo restante (sin tocar la mesa), y así sucesivamente hasta agotar el mazo de 40 cartas. Con 2 jugadores son 4 repartos de 5; con 4 jugadores son 2 repartos de 5.
- Al terminar la data (se acaba el mazo y las manos), si quedan cartas sueltas en la mesa que nadie levantó, se las lleva el equipo que hizo la última jugada/captura (afecta el conteo de cartón, pero no dispara puntos de "limpia" — la limpia es una jugada activa del jugador durante el juego, no un barrido automático de fin de data).

### Jugadas posibles
- **Caída**: cuando un jugador lanza una carta con el mismo número/figura que hay en la mesa, "le cae" y se la lleva.
- **Caída con consecutivas**: si al caer hay cartas consecutivas disponibles en la mesa relacionadas a esa jugada, también se las lleva (ej: cae un 3 sobre otro 3 y se lleva también el 4 y el 5 si están en la mesa). Reglas precisas confirmadas:
  - El orden de la escalera es **A, 2, 3, 4, 5, 6, 7, J, Q, K** (10 posiciones — recordar que no hay 8, 9, 10 en juego, así que el 7 conecta directo con la J). El K es el techo, no da la vuelta al As.
  - El barrido es **solo hacia arriba** desde la carta con la que se hizo la caída — las cartas de rango menor en la mesa no se tocan.
  - El barrido **se corta apenas falta una carta** en la secuencia (sin saltos): si falta la siguiente, ahí termina, aunque haya cartas de rango mayor todavía disponibles más adelante en la mesa.
  - Este mismo barrido hacia arriba **también aplica cuando se levanta por suma**, no es exclusivo de la caída por match exacto.
- **Suma**: un jugador puede llevarse cartas de la mesa cuya suma sea igual al valor de una carta en su mano (ej: con un 5 se lleva un 2 y un 3, o un 4 y un As). Reglas precisas confirmadas:
  - Normalmente son **exactamente 2 cartas** de la mesa las que se combinan.
  - **Regla de casa (no confirmada como oficial, pero se incluye)**: se permite combinar **3 cartas**, pero solo si el resultado (incluyendo el barrido de consecutivas que sigue) deja la mesa completamente limpia. Ej: mesa tiene A,2,3,7,J y juego un 6 → sumo A+2+3=6, y por consecutivas me llevo también el 7 y la J, dejando la mesa limpia.
  - Si hay varias combinaciones posibles en la mesa, el jugador **elige una sola** — no se llevan todas a la vez.
  - Las figuras (J, Q, K) **nunca participan** de una suma, ni como la carta jugada ni como parte de la combinación de la mesa.
  - El barrido de consecutivas hacia arriba (mismas reglas que en la caída) también se aplica después de una suma válida.
- **Limpia**: cuando un jugador deja la mesa completamente vacía al llevarse todas las cartas que había. Puede darse por caída y limpia simultáneamente (no es acumulativo con caída, ver puntaje).
- **Ronda**: cuando un jugador recibe 3 cartas del mismo número/figura en su mano repartida. Se debe **cantar en voz alta** ("¡ronda!") antes de que cualquier jugador lance su primera carta de esa mano — si juega sin avisar, pierde el derecho a cobrarla.
- **Doble ronda**: cuando un jugador recibe **4 cartas iguales** en su mano repartida (mismo evento que "recibir un póker" — no son reglas separadas, esto corrige una confusión anterior). También se debe cantar ("¡doble ronda!" o "¡cuatro por guapo!") antes de la primera carta jugada. El premio depende del reglamento (ver puntaje): 4 puntos en el reglamento oficial, o victoria automática en la variante de casa/barrio.
- **Caída a una ronda**: mecánicamente es una caída normal (1 carta en la mesa, coincide con la jugada), NO requiere 3 cartas iguales acumuladas en la mesa (eso sería imposible, ver regla de que no puede haber dos cartas iguales en la mesa a la vez). La secuencia real es: (1) un jugador canta "ronda" (3 iguales en su mano) y anota 2 puntos por el canto, (2) ese mismo jugador juega una de esas 3 cartas a la mesa, (3) el jugador del equipo RIVAL que sigue en el turno tiene la 4ta carta de ese número en su mano y la juega encima, capturándola — como sabe que el rival tiene las otras 2 iguales (por el canto), esta jugada es una "emboscada". Vale **4 puntos** en vez de los 2 de una caída normal. Si además deja la mesa limpia, los puntos NO se acumulan (no es 4+2=6), el máximo sigue siendo 4.
- **Falla**: cuando una pareja no logra levantar ninguna carta durante toda la "data" (ronda de reparto completa); el equipo rival puede reclamar puntos.

### Puntaje (reglamento estándar de referencia — ver sección 4 para variantes pactables)
- Caída = **2 puntos**
- Limpia = **2 puntos**
- Caída y limpia simultánea = **2 puntos** (NO acumulativo — no suma 4)
- Ronda (3 iguales, cantada antes de la primera carta) = **2 puntos**
- Doble ronda (4 iguales, cantada antes de la primera carta) = **4 puntos** en el reglamento oficial ("Mundial de Cuarenta"), o **victoria automática de la chica** en la variante de casa/barrio (también llamada "flor" o "póquer") — es un mismo evento con dos resoluciones posibles según el `HouseRules` activo, ya NO es "8 puntos" como se había definido antes.
- Caída a una ronda (capturar, siendo del equipo rival, la carta que el equipo contrario jugó justo después de cantar ronda) = **4 puntos**, sin acumular con limpia si coincide (máximo 4, no 6)
- Falla = **2 puntos**
- Los puntos se acumulan usando los "perros" (8, 9, 10) reservados al inicio: cada perro puesto boca arriba vale 2 puntos; puesto boca abajo (volteado), representa 10 puntos.
- **Cartón** (bonus por cantidad de cartas levantadas al final de la "data"): a partir de la carta 20 en adelante, cada carta adicional otorga puntos extra (20 cartas = 6 puntos, 21 = 7 puntos, y así sucesivamente). **Por defecto (regla estándar, no variante) el cartón deja de contar una vez que un equipo llega a 30 puntos** — de ahí en más ese equipo solo puede sumar por jugadas (caída, limpia, ronda, falla), no por cantidad de cartas.
- **Meta del juego**: llegar a (o superar) 40 puntos.
- **Regla especial "38 que no juega"**: al llegar a 38 puntos, un equipo ya NO puede ganar por suma de cartas/puntaje normal — necesita ganar específicamente con una jugada de **caída** para cerrar la partida. No se suman bonificaciones en ese cierre.
- El "juego completo" se gana al mejor de 3 partidas ("chicas").

### Victorias automáticas (cierran la chica al instante, sin seguir contando puntos)
- **Doble ronda** (4 cartas iguales al repartir), únicamente si el `HouseRules` activo usa la variante de casa/barrio en vez del reglamento oficial de 4 puntos (ver puntaje arriba — es el mismo evento, no una regla aparte).
- Lograr **4 caídas consecutivas** (2 por jugador de la pareja).
- Acumular **más de 15 puntos de cartón**.

### Penalizaciones
- **Mal reparto ("shunsho")**: 10 puntos para la pareja rival, y se pasa el turno de repartir.
- **Jugar fuera de turno**: 2 puntos de penalización para el jugador/pareja que se equivocó.
- **Protesta injustificada**: resta 2 puntos a quien protesta sin fundamento (ver rol del Juez de Aguas).

> ⚠️ Nota abierta sin resolver: el dicho tradicional es **"Dos por shunsho"** (dice literalmente "dos"), pero el puntaje de mal reparto que se confirmó para el juego es 10. Puede que el dicho sea una expresión antigua que ya no coincide con el puntaje actual — queda pendiente de revisar si conviene ajustar el dicho, el puntaje, o dejarlo así (son cosas distintas: el "decir" tradicional y la regla numérica).

### El Juez de Aguas
Figura del juego que **NO es un jugador ni ocupa un asiento en la mesa**. Sus funciones:
- Canta los puntos en voz alta a medida que se otorgan.
- Declara eventos especiales del juego (ej. "38 que no juega").
- **Arbitra protestas y disputas**: cuando un jugador protesta una jugada, el Juez de Aguas resuelve el reclamo (y puede penalizar con -2 puntos una protesta injustificada).

En el diseño técnico, el Juez de Aguas se modela como una capa que escucha los eventos de dominio que emite el motor de reglas (caída, limpia, ronda, falla, mal reparto, 38 que no juega, fin de partida, etc.) y los traduce en narración — más el mecanismo de arbitraje de protestas, que sí requiere lógica de decisión (evaluar el reclamo contra el estado real que el servidor ya conoce).

### Los dichos
Frases tradicionales que se dicen durante la partida, ligadas o no a un evento específico del juego:

| Dicho | Cuándo se dice |
|---|---|
| "Dos por shunsho" (o "dos señor juez") | Al hacer una caída (capturar con una carta del mismo número/figura que hay en la mesa) |
| "As que no caerás" | Al lanzar un As, como burla esperando que el rival no tenga con qué "caerle" |
| "Dos por mudo" | Al capturar cartas del rival "en silencio", sin que reaccione a tiempo |
| "Marido tiene" | Cuando tu compañero de pareja levanta/captura la carta que vos acabás de lanzar |
| "Pasa la mano" | Cuando el reparto de cartas sale mal y le corresponde repartir al jugador de la derecha |
| "Cuerito tierno" | Como burla hacia el rival cuando comete errores o "no sabe jugar" |

Hay muchos más dichos aparte de estos — el catálogo se va a ir ampliando con el tiempo. Se van a modelar como catálogo de datos (no como lógica de código), cada uno con: texto, evento que lo dispara (o "libre" si es burla sin trigger específico), y tono (family-friendly o picante).

### Notas de diseño para la IA
- La IA necesita evaluar en cada turno: ¿puedo hacer caída?, ¿puedo hacer suma?, ¿puedo hacer limpia?, y si no puede levantar nada, qué carta conviene descartar (evitando dejar jugadas fáciles al rival).
- Los niveles de dificultad pueden basarse en: (a) profundidad de la heurística (random vs. prioriza puntos altos vs. calcula riesgo de dejar jugadas al rival), y (b) si "recuerda" cartas ya jugadas para inferir la mano del rival.

## 3. Reglas de casa / Ruleset configurable

"El 40" tiene fuerte variación regional — muchas reglas se pactan entre jugadores antes de empezar una partida ("es importantísimo que se defina antes de cada encuentro", según fuentes consultadas). Por eso el motor de reglas **no debe hardcodear los puntajes**: debe aceptar un objeto de configuración (`HouseRules`) al crear una mesa o torneo, con el reglamento estándar (sección 2) como default.

Casi todas las reglas de puntaje/victoria listadas arriba deben ser pactables (activables/desactivables o con umbral configurable), salvo donde se indique que son estándar fijo. Variantes ya identificadas:
- **"Todo vale 2"**: cuando está activada, la doble ronda pasa de 8 a 2 puntos, igual que el resto de jugadas. No afecta al resto de reglas.
- **Umbral de "cartón deja de contar"**: por defecto 30 puntos (regla estándar), pero el número debe ser configurable por si se pacta otro.
- El resto de reglas de la sección 2 (doble ronda, caída a una ronda, victorias automáticas, penalizaciones) deben poder activarse/desactivarse individualmente vía este mismo mecanismo.

El diseño debe permitir agregar más campos a `HouseRules` con el tiempo sin romper nada existente, ya que van a seguir apareciendo variantes.

## 4. Torneos

- La unidad de una ronda de torneo es el **"juego completo"** (mejor de 3 chicas a 40 puntos) — no se baja al nivel de "chica" suelta.
- Formato de ronda **configurable por torneo/organizador**: eliminación simple de 1 juego completo ("pierde sale"), o mejor de 3 juegos completos para avanzar. Ambos formatos existen en torneos reales, por eso debe ser configurable, no fijo.
- Tipo de cuadro para la primera versión: **eliminación simple** (sin grupos/round robin/doble eliminación por ahora).
- Modalidades: torneos de **1v1 y de parejas (2v2) desde el principio**.
- Cuentas de usuario/login: **no para la primera versión** (alcanza con nombre + sesión de navegador), pero el modelo de "Participante" debe dejar la puerta abierta para agregar login más adelante sin rediseñar — no acoplar la identidad del participante rígidamente a la sesión efímera del socket.
- Implicancia técnica importante: un torneo necesita persistir estado (cuadro, resultados) entre partidas separadas — esto adelanta la necesidad de base de datos (ver sección 5) antes de lo que se había previsto originalmente ("más adelante para cuentas/historial").

## 5. Decisiones técnicas

### Plataformas
- **v1: solo web** (React en el navegador) — funciona en PC y celular sin instalar nada, es lo más rápido de tener jugable. Se puede convertir en PWA instalable más adelante sin rediseñar nada.
- Apps nativas (React Native para iOS/Android) o Electron para desktop quedan como opción futura, no para la v1. El `rules-engine` es agnóstico de plataforma, así que no hay costo de re-trabajo en el motor de reglas si más adelante se suma un frontend nativo.

### Modo offline (futuro, no v1)
- Como el `rules-engine` no depende de red, puede correr directamente en el cliente (navegador) sin servidor — esto habilita, sin re-trabajo del motor, dos modos offline: **solo vs IA sin conexión** y **multijugador local (pasar y jugar) en el mismo dispositivo**. El principio server-authoritative solo aplica cuando hay múltiples humanos conectados por red que no confían entre sí; para estos modos locales no hace falta servidor.
- El multijugador online y los torneos siguen requiriendo conexión por definición — no pueden ser offline.
- Decisión: no es requisito para la v1 (foco inicial en el online), se suma más adelante ya que el diseño actual no necesita cambios para soportarlo cuando llegue el momento.

### Convención de código
Todo el código fuente (identificadores, comentarios, nombres de tests) se escribe en **inglés**. La única excepción son los términos específicos del juego sin traducción natural o que son parte de su identidad cultural: `caída`, `suma`, `limpia`, `ronda`, `falla`, `perro`, `cartón`, `chica`, `dicho`, `Juez de Aguas`. Todo lo demás (nombres de funciones, tipos, variables, mensajes de error, descripciones de test) va en inglés.

### Lenguaje / stack recomendado
- **Backend + lógica del juego: Node.js + TypeScript**
  - El motor de reglas (mazo, turnos, validación de jugadas, puntaje, ruleset configurable) se escribe una sola vez como paquete/módulo compartido en TypeScript.
  - Buen soporte de WebSockets en tiempo real (Socket.io) para sincronizar mesas de 2 y 4 jugadores.
  - Si el frontend es React/React Native, se pueden compartir tipos entre cliente y servidor.
- **Alternativa considerada**: Kotlin + Ktor (aprovechando que Atilio ya tiene experiencia con Kotlin/Spring Boot en su trabajo en PAE 360), pero se prefiere Node/TS por el ecosistema de tiempo real y por compartir lenguaje con el frontend web.

### Arquitectura
- Servidor siempre corre el motor de reglas y es la autoridad de la partida (evita trampas y bugs de sincronización).
- Una "sala"/mesa de juego tiene 4 asientos, ocupados por humanos (WebSocket) o IA (proceso del servidor).
- Comunicación en tiempo real vía WebSockets (Socket.io o similar).
- El motor de reglas emite eventos de dominio (caída, limpia, ronda, falla, mal reparto, 38 que no juega, fin de partida, etc.) que consumen tanto el broadcast a los clientes como la capa de narración del Juez de Aguas.
- Estructura planeada como monorepo con npm workspaces:
  - `packages/rules-engine` — lógica pura del juego (mazo, reglas, ruleset configurable), sin dependencias de red, testeable con tests unitarios.
  - `packages/server` — Node.js + Socket.io, usa `rules-engine`, maneja mesas, torneos y persistencia.
  - `packages/client` — frontend (React), usa `rules-engine` solo para tipos compartidos.

### Hosting / despliegue (gratis para empezar)
- **Backend (WebSockets)**: Render (free tier) — soporta servicios web con WebSockets, aunque tiene cold-starts de 30-60 segundos en el plan gratuito. Alternativas: Fly.io, Railway (créditos gratis limitados por mes).
  - ⚠️ Vercel y Netlify **no sirven** para el servidor de WebSockets porque corren como funciones serverless sin conexiones persistentes.
- **Frontend (si es web)**: Vercel o Netlify gratis (sirven excelente para contenido estático/React, solo no para el servidor de WebSockets).
- **Base de datos**: necesaria antes de lo previsto originalmente por el feature de torneos (persistir cuadros/resultados entre partidas). Render ofrece PostgreSQL gratis que expira a los 90 días; alternativas externas como Supabase también tienen tier gratuito.
- Limitación conocida: estos planes gratuitos son para prototipos/proyectos personales; si el juego crece en tráfico, eventualmente se necesitará un plan pago (usualmente ~$5-7/mes es suficiente para empezar a escalar).

## 6. Fuentes consultadas para validar las reglas
Se contrastó este documento contra varias fuentes públicas para verificar puntajes y detectar reglas faltantes (septiembre 2026):
- [40 (juego de naipes) - Wikipedia](https://es.wikipedia.org/wiki/40_(juego_de_naipes))
- [Reglas Oficiales del Cuarenta - blog](http://eldeljuano.blogspot.com/2008/12/reglas-oficiales-del-cuarenta.html)
- [Reglas para jugar 40 - 40caidaylimpia.com](https://40caidaylimpia.com/reglas-para-jugar-40/)

Las fuentes no coinciden entre sí en varios puntos (ej. puntaje de doble ronda, puntaje de mal reparto) — es consistente con que el juego varía por región/familia. Las decisiones finales tomadas en este documento son las que Atilio confirmó como la versión que quiere implementar, no necesariamente "la" versión oficial única (no existe tal cosa).

## 7. Estado actual del proyecto
- Reglas del juego, Juez de Aguas, dichos, torneos y ruleset configurable ya definidos (este documento).
- Repo creado: github.com/atiliorizzo/fourty (rama `main` estable, rama `dev` para trabajo diario).
- **Código ya iniciado** en `packages/rules-engine` (monorepo con npm workspaces, TypeScript, tests con Vitest):
  - `src/cards.ts`: modelo de `Suit`/`Rank`/`Card`, mazo completo (52), mazo de juego (40, sin perros), perros (12), shuffle.
  - `src/dealing.ts`: reparto de manos de 5 cartas por jugador (`dealMano`), y partición de un mazo completo en todas las manos de una data (`dealAllManos`), para 2 o 4 jugadores.
  - `src/caida.ts`: validación de caída simple (match exacto de rango) y barrido de consecutivas hacia arriba (`resolveCaida`).
  - `src/suma.ts`: validación de suma (2 cartas normalmente, 3 solo si limpia la mesa) con el mismo barrido de consecutivas (`resolveSuma`).
  - `src/consecutiveSweep.ts`: lógica compartida del barrido de consecutivas, usada por caída y suma.
  - `src/ronda.ts`: detección de ronda/doble ronda en una mano repartida (`detectRonda`) — solo detecta el patrón, el puntaje/resolución (2 pts, 4 pts, o victoria automática) queda para la capa de orquestación que use el `HouseRules`.
  - `src/limpia.ts`: chequeo de si una jugada dejó la mesa vacía (`isLimpia`), reutilizable para cualquier tipo de captura (caída, suma, etc).
  - `src/falla.ts`: chequeo de si un equipo terminó la data sin capturar ninguna carta (`isFalla`).
  - 44 tests unitarios pasando. Código en inglés desde este punto (ver convención arriba); los primeros módulos (`cards.ts`, `dealing.ts`, `caida.ts`, `suma.ts`) ya estaban mayormente en inglés salvo algunos nombres de test que se corrigieron.
  - **Con esto ya están las 5 jugadas base del reglamento resueltas como funciones puras**: caída (con consecutivas), suma (con el caso especial de 3 cartas), limpia, ronda/doble ronda, falla.
- **Pendiente de definir/implementar en el motor de reglas**: el ritual de "sacar carta más alta para determinar quién reparte" (se va a resolver más adelante con un sorteo simple, no bloquea nada), y el turno/orquestador de estado que combine todas estas jugadas (mano de cada jugador, mesa, pilas de cartón por equipo, puntaje acumulado, aplicación del `HouseRules`, detección de "38 que no juega" y de las victorias automáticas).

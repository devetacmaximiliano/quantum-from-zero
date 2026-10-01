export type Lesson = {
  id: number;
  title: string;
  minutes: number;
  group: number;
  concepts: string[];
  concept: string;
  intuition: string;
  technical: string;
  visual: string;
  code: string;
  lab: string;
  experiment: string;
  exercise: string;
  question: string;
  options: string[];
  answer: number;
  feedback: string;
  takeaways: string[];
};
const qc = "from qiskit import QuantumCircuit\n\n";
export const lessons: Lesson[] = [
  {
    id: 1,
    title: "Classical Bits",
    minutes: 8,
    group: 0,
    concepts: ["bit", "binary", "state"],
    concept:
      "Un bit clásico almacena 0 o 1. Un registro de n bits puede representar 2ⁿ valores, pero en cada instante contiene uno de ellos.",
    intuition:
      "Como un booleano en tu backend: puede ser true o false. Tres flags tienen ocho combinaciones posibles, sin almacenar ocho respuestas al mismo tiempo.",
    technical:
      "Un estado clásico determinista es un elemento de {0,1}ⁿ. Una distribución probabilística sobre esos estados describe incertidumbre, no coherencia cuántica.",
    visual: "0 OR 1 → 2 bits: 00, 01, 10, 11 → n bits: 2ⁿ configuraciones",
    code: 'bits = [0, 1, 1]\nvalue = int("".join(map(str, bits)), 2)\nprint(value)  # 3',
    lab: "/playground/cnot",
    experiment:
      "Elegí los estados iniciales 00, 01, 10 y 11 en CNOT Lab. Antes de aplicar una puerta, cada entrada tiene una probabilidad de 100%.",
    exercise:
      "Escribí todas las combinaciones de tres bits. Contrastá almacenar un valor con enumerar valores posibles.",
    question:
      "¿Cuántos valores diferentes puede representar un registro de 3 bits?",
    options: ["3", "6", "8", "Todos a la vez"],
    answer: 2,
    feedback:
      "Cada bit tiene dos valores: 2 × 2 × 2 = 8 configuraciones posibles. El registro contiene una sola configuración.",
    takeaways: [
      "Estado posible no es resultado almacenado.",
      "El punto de partida de la computación cuántica sigue siendo información binaria.",
    ],
  },
  {
    id: 2,
    title: "Your First Qubit",
    minutes: 12,
    group: 0,
    concepts: ["qubit", "ket", "amplitude", "probability"],
    concept:
      "Un qubit se describe por |ψ⟩ = α|0⟩ + β|1⟩. α y β son amplitudes complejas. Al medir en la base computacional obtenés 0 o 1 con probabilidades |α|² y |β|².",
    intuition:
      "Pensá en una receta para producir resultados. La receta tiene amplitudes y fases; la medición produce un único bit, no devuelve toda la receta.",
    technical:
      "El vector (α, β) ∈ ℂ² debe estar normalizado: |α|² + |β|² = 1. La fase global no es observable; la fase relativa influye en futuras interferencias.",
    visual: "|ψ⟩ = α|0⟩ + β|1⟩ · |α|² + |β|² = 1",
    code: qc + "qc = QuantumCircuit(1, 1)\nqc.ry(1.5708, 0)\nqc.measure(0, 0)",
    lab: "/playground/gates",
    experiment:
      "Aplicá RY con θ = π/2. Observá amplitudes cercanas a 0.707 y probabilidades de 50%, no de 70.7%.",
    exercise:
      "Si α = 0.6 y β = 0.8, calculá ambas probabilidades. Verificá que sumen 1.",
    question: "Si la amplitud de |1⟩ es 0.8, ¿cuál es P(1)?",
    options: ["80%", "64%", "20%", "40%"],
    answer: 1,
    feedback:
      "La regla de Born usa el módulo al cuadrado: |0.8|² = 0.64. Las amplitudes no son probabilidades.",
    takeaways: [
      "Las amplitudes pueden ser complejas.",
      "La medición produce un bit.",
      "Las probabilidades suman 1.",
    ],
  },
  {
    id: 3,
    title: "Measurement",
    minutes: 10,
    group: 0,
    concepts: ["measurement", "basis state", "collapse"],
    concept:
      "La medición en la base computacional produce un bitstring y deja el sistema en el estado compatible con ese resultado. No permite inspeccionar todas las amplitudes de una sola copia.",
    intuition:
      "Es una operación que cambia lo que estás inspeccionando. Para repetir un experimento, preparás otra vez el circuito desde |0⟩.",
    technical:
      "Los proyectores |0⟩⟨0| y |1⟩⟨1| dan probabilidades por la regla de Born. El estado posterior se renormaliza condicionado al resultado.",
    visual: "Prepare → Gates → Measure → Classical bit",
    code: qc + "qc = QuantumCircuit(1, 1)\nqc.h(0)\nqc.measure(0, 0)",
    lab: "/playground/measurement",
    experiment:
      "Ejecutá H con 10 shots dos veces. Los conteos pueden variar, aunque las probabilidades ideales sean iguales.",
    exercise:
      "Predecí qué sucede al medir dos veces seguidas un qubit, sin aplicar otra puerta entre mediciones.",
    question:
      "Luego de medir 1, una segunda medición inmediata en la misma base devuelve…",
    options: [
      "0 con certeza",
      "0 o 1 al 50%",
      "1 con certeza",
      "Toda la superposición",
    ],
    answer: 2,
    feedback:
      "La primera medición deja al qubit en |1⟩. Sin otras operaciones, repetir la misma medición devuelve 1.",
    takeaways: [
      "Medir transforma el estado.",
      "Cada shot vuelve a preparar el circuito.",
      "Un resultado no revela la distribución completa.",
    ],
  },
  {
    id: 4,
    title: "Hadamard & Superposition",
    minutes: 15,
    group: 0,
    concepts: ["Hadamard", "superposition", "interference", "amplitude"],
    concept:
      "H transforma |0⟩ en (|0⟩ + |1⟩)/√2. También transforma |1⟩ en (|0⟩ − |1⟩)/√2. El signo cambia la fase relativa, aunque las probabilidades inmediatas sean iguales.",
    intuition:
      "H abre dos caminos de amplitud. Otra H los recombina: los caminos de |1⟩ se cancelan y recuperás |0⟩. Esa cancelación es interferencia.",
    technical:
      "H = (1/√2)[[1,1],[1,−1]] y H² = I. Una superposición coherente se distingue de una mezcla aleatoria por lo que sucede cuando recombinás amplitudes.",
    visual: "|0⟩ → H → |+⟩ → H → |0⟩",
    code: qc + "qc = QuantumCircuit(1, 1)\nqc.h(0)\nqc.h(0)\nqc.measure_all()",
    lab: "/playground/gates",
    experiment:
      "Aplicá H una vez y luego otra. Después probá H → RZ(π) → H: la fase relativa cambia la salida a |1⟩.",
    exercise:
      "Predecí H → H antes de ejecutarlo. Explicá por qué no equivale a lanzar dos monedas independientes.",
    question: "¿Qué devuelve H → H aplicado a |0⟩, antes de medir?",
    options: ["|0⟩", "|1⟩", "50% / 50%", "Un estado inválido"],
    answer: 0,
    feedback:
      "H² = I. Las amplitudes interfieren y el circuito recupera |0⟩. No se trata de dos sorteos clásicos.",
    takeaways: [
      "Superposición incluye fase.",
      "La interferencia combina amplitudes.",
      "H es su propia inversa.",
    ],
  },
  {
    id: 5,
    title: "Shots & Probabilities",
    minutes: 10,
    group: 0,
    concepts: ["shots", "counts", "probability"],
    concept:
      "Un shot es una preparación y ejecución del circuito con medición. Counts registra cuántas veces apareció cada bitstring; counts/shots estima su probabilidad.",
    intuition:
      "Como estimar una tasa de éxito con requests: 10 muestras son ruidosas, 10 000 suelen producir una estimación más estable.",
    technical:
      "Para una probabilidad p, el error estándar de la frecuencia es √(p(1−p)/N). Más shots reducen incertidumbre estadística; no corrigen ruido sistemático ni garantizan una mejora en cada corrida.",
    visual: "P̂(0) = counts[0] / shots · error estadístico ∝ 1/√shots",
    code: "from qiskit import transpile\nfrom qiskit_aer import AerSimulator\n\nsimulator = AerSimulator()\ncompiled = transpile(qc, simulator)\ncounts = simulator.run(compiled, shots=1000).result().get_counts()",
    lab: "/playground/measurement",
    experiment:
      "Compará 10, 100, 1000 y 10 000 shots. Distinguí las barras empíricas de las probabilidades ideales.",
    exercise:
      "Una ejecución registra 498 ceros y 502 unos. Calculá la frecuencia de cada resultado.",
    question: "¿Qué garantizan más shots?",
    options: [
      "Eliminar ruido del dispositivo",
      "Leer todas las amplitudes",
      "Reducir el error estadístico típico",
      "Obtener exactamente 50/50",
    ],
    answer: 2,
    feedback:
      "Más muestras reducen la dispersión estadística típica. No garantizan 50/50 exacto ni eliminan errores sistemáticos.",
    takeaways: [
      "Counts son frecuencias.",
      "Los resultados varían entre corridas.",
      "Más shots tienen costo.",
    ],
  },
  {
    id: 6,
    title: "Multiple Qubits",
    minutes: 12,
    group: 0,
    concepts: ["basis state", "tensor product", "bitstring"],
    concept:
      "Dos qubits tienen cuatro estados de base: |00⟩, |01⟩, |10⟩ y |11⟩. Un estado general asigna una amplitud a cada uno. Medir produce solamente uno de esos bitstrings.",
    intuition:
      "Un simulador mantiene una tabla con 2ⁿ amplitudes. Un dispositivo cuántico manipula el estado, pero no ofrece una API para descargar esa tabla desde una única medición.",
    technical:
      "El espacio de n qubits es (ℂ²)⊗ⁿ, de dimensión 2ⁿ. Qiskit escribe bitstrings q[n−1]…q0: q0 es el bit de la derecha.",
    visual: "2 qubits → 4 estados · 3 → 8 · 4 → 16 · n → 2ⁿ",
    code:
      qc +
      "qc = QuantumCircuit(3, 3)\nqc.h(0)\nqc.h(1)\nqc.h(2)\nqc.measure_all()",
    lab: "/playground/circuit",
    experiment:
      "Agregá un tercer qubit y una H en cada línea. Observá ocho resultados posibles y un bitstring por shot.",
    exercise:
      "En Qiskit, ¿qué bitstring representa q0=1, q1=0, q2=0? Comprobalo con X en q0.",
    question: "¿Qué implica tener 2ⁿ estados de base?",
    options: [
      "Leer 2ⁿ respuestas por shot",
      "Un bitstring por medición",
      "Ventaja automática",
      "Memoria clásica gratuita",
    ],
    answer: 1,
    feedback:
      "La dimensión crece exponencialmente, pero cada medición devuelve un bitstring de n bits. El algoritmo debe hacer útil esa distribución.",
    takeaways: [
      "2ⁿ amplitudes no son 2ⁿ respuestas accesibles.",
      "El orden de bits importa al interpretar resultados.",
    ],
  },
  {
    id: 7,
    title: "CNOT",
    minutes: 12,
    group: 0,
    concepts: ["CNOT", "control", "target", "gate"],
    concept:
      "CNOT, o CX, invierte el qubit target si el control está en 1 en la base computacional. Por linealidad también actúa sobre superposiciones y puede crear entrelazamiento.",
    intuition:
      "Para entradas de base se parece a if control: target ^= 1. Sobre amplitudes no mide el control ni ejecuta un if clásico.",
    technical:
      "CX permuta los estados de base de forma unitaria. Para q0 control y q1 target: |01⟩ ↔ |11⟩, mientras |00⟩ y |10⟩ no cambian, usando el orden Qiskit q1q0.",
    visual: "control ●\n        │\ntarget  ⊕",
    code:
      qc + "qc = QuantumCircuit(2, 2)\nqc.x(0)\nqc.cx(0, 1)\nqc.measure_all()",
    lab: "/playground/cnot",
    experiment:
      "Elegí las cuatro entradas posibles y aplicá CX. Después prepará superposición en el control usando Bell State Lab.",
    exercise:
      "Completá la tabla de verdad para q0 como control y q1 como target. Usá el orden q1q0.",
    question: "CX(0,1) sobre |01⟩, con orden q1q0, produce…",
    options: ["|00⟩", "|01⟩", "|10⟩", "|11⟩"],
    answer: 3,
    feedback:
      "En |01⟩, q0=1. Por eso CX invierte q1 de 0 a 1 y la salida es |11⟩.",
    takeaways: [
      "Control y target deben ser diferentes.",
      "CX no es una medición.",
      "CX con superposición puede entrelazar.",
    ],
  },
  {
    id: 8,
    title: "Bell States & Entanglement",
    minutes: 18,
    group: 0,
    concepts: ["entanglement", "Bell state", "correlation"],
    concept:
      "H en q0 y CX(0,1) preparan (|00⟩ + |11⟩)/√2. El estado conjunto no puede factorizarse como un producto de estados individuales.",
    intuition:
      "Los resultados están correlacionados: cada qubit parece aleatorio, pero ambos coinciden. Esa correlación por sí sola no demuestra entrelazamiento; el estado y mediciones en otras bases permiten distinguirlo de una mezcla clásica.",
    technical:
      "Un estado puro entrelazado tiene rango de Schmidt mayor a uno. La matriz reducida de cada qubit de este Bell es I/2. No puede usarse para comunicar información instantáneamente.",
    visual: "|00⟩ → H(q0) → (|00⟩ + |01⟩)/√2 → CX → (|00⟩ + |11⟩)/√2",
    code:
      qc + "qc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()",
    lab: "/playground/entanglement",
    experiment:
      "Avanzá por cada paso del circuito Bell y ejecutá 1000 shots. En el simulador ideal deberían aparecer solamente 00 y 11.",
    exercise:
      "Explicá por qué medir q0 no te permite elegir ni enviar un bit a q1.",
    question: "¿Qué bitstrings tiene este Bell en una simulación ideal?",
    options: ["00 y 11", "01 y 10", "Los cuatro iguales", "Solo 00"],
    answer: 0,
    feedback:
      "La preparación concentra amplitud en |00⟩ y |11⟩. Cada uno tiene probabilidad 1/2; la medición no permite elegir el resultado.",
    takeaways: [
      "Entrelazamiento es una propiedad del estado conjunto.",
      "Correlación clásica no basta como prueba.",
      "No implica comunicación más rápida que la luz.",
    ],
  },
  {
    id: 9,
    title: "Parameterized Circuits",
    minutes: 15,
    group: 1,
    concepts: ["RX", "RY", "RZ", "parameter", "VQE"],
    concept:
      "RX, RY y RZ rotan un qubit alrededor de los ejes de la esfera de Bloch. RY(θ)|0⟩ = cos(θ/2)|0⟩ + sin(θ/2)|1⟩.",
    intuition:
      "El circuito es una función con parámetros. Un optimizador clásico ajusta esos inputs para cambiar la distribución de resultados.",
    technical:
      "RY(θ)=exp(−iθY/2). P(1)=sin²(θ/2). RZ cambia fase relativa: puede dejar intactas las probabilidades inmediatas y cambiar resultados después de H.",
    visual: "θ=0 → P(0)=1 · θ=π/2 → 50/50 · θ=π → P(1)=1",
    code: 'from qiskit import QuantumCircuit\nfrom qiskit.circuit import Parameter\n\ntheta = Parameter("θ")\nqc = QuantumCircuit(1)\nqc.ry(theta, 0)\nbound = qc.assign_parameters({theta: 1.5708})',
    lab: "/playground/parameters",
    experiment:
      "Mové θ entre 0 y 2π. Observá la esfera, las amplitudes y P(1). Ejecutá Aer para contrastar frecuencias.",
    exercise: "Encontrá dos ángulos entre 0 y 2π que produzcan P(1)=0.5.",
    question: "RY(π) aplicado a |0⟩ produce P(1)…",
    options: ["0", "0.25", "0.5", "1"],
    answer: 3,
    feedback:
      "sin²(π/2)=1. El qubit queda en |1⟩. Es la base de ajustar distribuciones mediante parámetros.",
    takeaways: [
      "Los parámetros modifican un circuito sin cambiar su estructura.",
      "VQE, QAOA y algunos modelos de QML usan este patrón.",
    ],
  },
  {
    id: 10,
    title: "Local Quantum Simulation",
    minutes: 15,
    group: 1,
    concepts: ["simulator", "backend", "transpilation", "noise"],
    concept:
      "Aer simula circuitos en una computadora clásica. Qiskit construye el circuito, transpile lo adapta y el backend ejecuta un job que produce resultados.",
    intuition:
      "Separá el programa del executor: como SQL y un motor de base de datos, el circuito expresa operaciones y el backend determina cómo ejecutarlas. La analogía tiene límites.",
    technical:
      "La simulación de statevector general requiere memoria proporcional a 2ⁿ. Aer también soporta métodos especializados y modelos de ruido. Este laboratorio usa simulación ideal sin ruido.",
    visual: "Circuit → Transpile → AerSimulator → Job → Result → Counts",
    code: "from qiskit import QuantumCircuit, transpile\nfrom qiskit_aer import AerSimulator\n\nqc = QuantumCircuit(1)\nqc.h(0)\nqc.measure_all()\nbackend = AerSimulator()\ncompiled = transpile(qc, backend, optimization_level=1)\ncounts = backend.run(compiled, shots=1000).result().get_counts()",
    lab: "/simulators/local",
    experiment:
      "Ejecutá Bell State y observá el flujo. Compará las probabilidades exactas del statevector con los counts.",
    exercise:
      "Identificá qué parte crea el programa, cuál lo adapta y cuál lo ejecuta.",
    question: "¿En qué hardware corre Aer local?",
    options: [
      "Una QPU IonQ",
      "Tu computadora clásica",
      "Siempre en IBM Cloud",
      "En una red cuántica",
    ],
    answer: 1,
    feedback:
      "Aer ejecuta una simulación clásica del circuito cuántico. Ejecutar Aer no constituye ejecutar una QPU.",
    takeaways: [
      "Simulador no equivale a QPU.",
      "Transpilar adapta el circuito.",
      "Un job permite obtener resultados de ejecución.",
    ],
  },
  {
    id: 11,
    title: "Qiskit Deep Dive",
    minutes: 20,
    group: 1,
    concepts: ["Qiskit", "circuit", "backend", "SDK"],
    concept:
      "Qiskit es un SDK de Python para construir, transformar y analizar programas cuánticos. Un backend puede ser un simulador local, un simulador cloud o una QPU real.",
    intuition:
      "Como developer ya conocés SDK → servicio. Acá usás Qiskit → backend cuántico. La diferencia es que el programa es un circuito y los resultados suelen ser estadísticos.",
    technical:
      "QuantumCircuit almacena instrucciones sobre qubits y bits clásicos. La transpilation puede descomponer puertas y adaptar conectividad. Aer y qiskit-ionq son paquetes separados.",
    visual: "Python SDK → QuantumCircuit → Transpile → Backend → Counts",
    code:
      qc +
      "qc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])",
    lab: "/playground/qiskit",
    experiment:
      "Editá el circuito Bell en el runner. Eliminá CX y observá 00/01. El runner interpreta un DSL limitado; el ejemplo de Parameter se ejecuta en tu Python local.",
    exercise:
      "Construí un circuito con X en q1 y explicá por qué el resultado es 10, con q1q0.",
    question: "QuantumCircuit(2,2) crea…",
    options: [
      "4 qubits",
      "2 qubits y 2 bits clásicos",
      "2 shots",
      "Dos backends",
    ],
    answer: 1,
    feedback:
      "El primer argumento cuenta qubits y el segundo bits clásicos. measure(0,0) escribe la medición de q0 en c0.",
    takeaways: [
      "Qiskit no es un dispositivo.",
      "Las puertas se agregan al circuito antes de ejecutarlo.",
      "El runner usa parsing restringido, nunca Python arbitrario.",
    ],
  },
  {
    id: 12,
    title: "IonQ Simulator",
    minutes: 18,
    group: 1,
    concepts: ["IonQ", "QPU", "backend", "trapped ion"],
    concept:
      "IonQ es un proveedor de computación cuántica con dispositivos de iones atrapados y simuladores cloud. qiskit-ionq conecta Qiskit con su API.",
    intuition:
      "Cambiar de backend es parecido a cambiar un proveedor de infraestructura. Siguen importando la autenticación, el formato, las capacidades, la latencia y las colas.",
    technical:
      "Los qubits físicos se codifican en estados de iones controlados por láser. El simulador cloud calcula probabilidades en hardware clásico. Este MVP limita la integración remota a ionq_simulator.",
    visual: "Browser → FastAPI → Qiskit → qiskit-ionq → IonQ API → Simulator",
    code: 'from qiskit_ionq import IonQProvider\nfrom qiskit import transpile\n\nprovider = IonQProvider()  # IONQ_API_KEY\nbackend = provider.get_backend("ionq_simulator")\ncompiled = transpile(qc, backend, optimization_level=1)\njob = backend.run(compiled, shots=1000)\ncounts = job.result(timeout=120).get_counts()',
    lab: "/playground/ionq",
    experiment:
      "Configurá IONQ_API_KEY únicamente en backend/.env. Corré Bell en Aer y luego en IonQ Simulator; compará counts y tiempo.",
    exercise: "Describí por qué una API key no debe enviarse al navegador.",
    question:
      "¿Ejecutar IonQ Simulator demuestra ejecución en hardware cuántico?",
    options: [
      "Sí, siempre",
      "No: es un simulador cloud",
      "Solo con 1000 shots",
      "Solo para Bell",
    ],
    answer: 1,
    feedback:
      "IonQ Simulator es una simulación clásica cloud. Ejecutar una QPU exige elegir un backend de hardware diferente.",
    takeaways: [
      "La API key vive en el backend.",
      "Cloud simulator y QPU son distintos.",
      "Las diferencias de muestreo son normales.",
    ],
  },
  {
    id: 13,
    title: "Optimization Problems",
    minutes: 15,
    group: 2,
    concepts: ["objective", "constraint", "binary variable"],
    concept:
      "Un problema de optimización tiene decisiones, una función de costo y restricciones. Asignaremos tres tareas a dos servidores, minimizando el costo y asignando cada tarea exactamente una vez.",
    intuition:
      "Es un problema de backend conocido: elegir dónde corre cada tarea. Antes de usar cuántica, definí el baseline clásico y verificá que el modelo capture el negocio.",
    technical:
      "Usamos seis variables binarias x_A_1,…,x_C_2 y restricciones x_t_1+x_t_2=1. Existen 64 bitstrings y 8 asignaciones válidas. No incluimos capacidad de servidores en este ejemplo.",
    visual: "Business problem → Binary decisions → Cost + Constraints → Solver",
    code: "from itertools import product\n\ncosts = [[4, 7], [6, 2], [3, 5]]\nchoices = list(product([0, 1], repeat=3))\nbest = min(choices, key=lambda x: sum(costs[i][x[i]] for i in range(3)))",
    lab: "/optimization",
    experiment:
      "Modificá los seis costos y ejecutá el solver clásico. Revisá todas las combinaciones y las ocho válidas.",
    exercise:
      "Con los costos originales, asigná A, B y C al servidor más barato y calculá el total.",
    question:
      "¿Cuántas asignaciones válidas hay para 3 tareas y 2 servidores sin capacidad?",
    options: ["6", "8", "32", "64"],
    answer: 1,
    feedback:
      "Cada tarea elige uno de dos servidores: 2³=8. La codificación de seis variables contiene otros 56 bitstrings inválidos.",
    takeaways: [
      "Primero modelá decisiones y restricciones.",
      "Construí un baseline clásico.",
      "La codificación define cómo se interpreta cada bit.",
    ],
  },
  {
    id: 14,
    title: "QUBO",
    minutes: 22,
    group: 2,
    concepts: ["QUBO", "penalty", "Hamiltonian"],
    concept:
      "QUBO significa Quadratic Unconstrained Binary Optimization. Es una función cuadrática sobre variables binarias. Las restricciones se convierten en penalidades en la función objetivo.",
    intuition:
      "Una solución inválida sigue siendo representable, pero recibe un costo adicional. Penalizar tiene que ser suficiente para que violar la regla no resulte atractivo.",
    technical:
      "F(x)=Σ c_t_s x_t_s + PΣ(x_t_1+x_t_2−1)². Como x²=x, la diagonal es c−P, el acoplamiento es 2P y la constante es 3P. Usamos Q triangular superior: F=xᵀQx+3P.",
    visual: "Exactly once → P(x₁+x₂−1)² → Q matrix → Ising Hamiltonian",
    code: 'from qiskit_optimization import QuadraticProgram\n\nqubo = QuadraticProgram()\nqubo.binary_var("x_A_1")\nqubo.binary_var("x_A_2")\nqubo.minimize(constant=10, linear=[-6, -3],\n              quadratic={(0, 1): 20})\nhamiltonian, offset = qubo.to_ising()',
    lab: "/optimization/qubo",
    experiment:
      "Hacé click en la matriz Q y decodificá 010101. Después probá 000000 y 111111. Compará costo de negocio, penalidad y score.",
    exercise:
      "Expandí P(x₁+x₂−1)² usando x²=x. Identificá término lineal, cuadrático y constante.",
    question: "¿Por qué un término diagonal de Q puede ser negativo?",
    options: [
      "El costo total es inválido",
      "La expansión incluye −P·x y una constante",
      "Q no admite negativos",
      "El circuito falla",
    ],
    answer: 1,
    feedback:
      "Expandir la penalidad produce P − P·x₁ − P·x₂ + 2P·x₁x₂. La constante también cuenta para interpretar el score.",
    takeaways: [
      "Unconstrained significa restricciones absorbidas en el objetivo.",
      "No omitas la constante al explicar costos.",
      "Una penalidad insuficiente puede favorecer soluciones inválidas.",
    ],
  },
  {
    id: 15,
    title: "QAOA",
    minutes: 25,
    group: 2,
    concepts: ["QAOA", "Hamiltonian", "mixer", "hybrid"],
    concept:
      "QAOA es Quantum Approximate Optimization Algorithm. Alterna un circuito de costo parametrizado por γ con un mixer parametrizado por β. Un optimizador clásico ajusta los parámetros.",
    intuition:
      "Es un feedback loop: preparar una distribución, evaluar su costo, cambiar parámetros y repetir. El circuito no devuelve mágicamente la mejor respuesta.",
    technical:
      "El Hamiltoniano de costo codifica el QUBO usando x=(1−Z)/2. El mixer usa ΣX. p, o reps, es el número de capas costo/mixer. Este laboratorio calcula expectativas exactas con Statevector durante COBYLA y muestrea el circuito final con Aer.",
    visual:
      "QUBO → Hamiltonian → Circuit(γ,β) → Cost → Classical optimizer → New parameters ↻",
    code: "from qiskit.circuit.library import qaoa_ansatz\n\n# hamiltonian, offset = qubo.to_ising()\nansatz = qaoa_ansatz(hamiltonian, reps=1)\n# Asignar parámetros, evaluar costo y optimizar.\n# El laboratorio construye RZ/RZZ + RX explícitamente.",
    lab: "/optimization/qaoa",
    experiment:
      "Ejecutá QAOA con p=1 y 40 evaluaciones. Revisá el costo esperado, la probabilidad de factibilidad y la mejor solución válida observada.",
    exercise:
      "Separá costo esperado, bitstring más probable y mejor solución observada. Explicá por qué son métricas diferentes.",
    question: "¿Qué componente de QAOA es clásico?",
    options: [
      "Solo la medición",
      "El optimizador de parámetros",
      "El Hamiltoniano como dispositivo",
      "Ninguno",
    ],
    answer: 1,
    feedback:
      "El optimizador calcula nuevos parámetros a partir del costo. El circuito parametrizado y su medición conforman la parte cuántica; acá se simula localmente.",
    takeaways: [
      "QAOA es híbrido y aproximado.",
      "p/reps controla la profundidad.",
      "La mejor muestra no es el costo esperado.",
      "El laboratorio no demuestra ventaja cuántica.",
    ],
  },
  {
    id: 16,
    title: "Classical vs Quantum",
    minutes: 15,
    group: 3,
    concepts: ["baseline", "runtime", "evaluations"],
    concept:
      "Una comparación útil usa el mismo problema y muestra calidad de solución, tiempo total, evaluaciones y recursos. Un circuito cuántico simulado tiene overhead clásico.",
    intuition:
      "Como comparar dos motores de búsqueda: medí lo mismo, incluyendo preparación, ejecución y evaluación. Un gráfico lindo de samples no reemplaza un benchmark.",
    technical:
      "El brute force es exacto para esta instancia minúscula. QAOA produce una distribución y puede no converger. Tiempo Aer incluye simulación y transpilation; tiempo IonQ incluye latencia y espera.",
    visual:
      "Same problem → Classical baseline ↔ Quantum approach → Quality + Time + Resources",
    code: "classical_cost = 9\nqaoa_best_sample_cost = 9\n# Igualdad de costo no demuestra aceleración.\n# Comparar tiempos, factibilidad y escala.",
    lab: "/optimization/compare",
    experiment:
      "Ejecutá la comparación con los mismos costos y observá tiempos reales y calidad. No esperes que QAOA gane en una instancia de tres tareas.",
    exercise:
      "Proponé un benchmark que incluya casos de distinto tamaño, ruido y presupuesto de ejecución.",
    question: "Obtener la misma solución con QAOA prueba…",
    options: [
      "Ventaja cuántica",
      "Una solución equivalente en esta instancia",
      "Escalabilidad",
      "Superioridad universal",
    ],
    answer: 1,
    feedback:
      "Igualar una solución en un problema pequeño no demuestra rendimiento superior ni escalabilidad. Hace falta una comparación justa y evidencia.",
    takeaways: [
      "Compará el mismo objetivo y restricciones.",
      "Incluí overhead y calidad de solución.",
      "Los métodos clásicos suelen ganar en estos ejemplos pequeños.",
    ],
  },
  {
    id: 17,
    title: "Quantum Advantage",
    minutes: 12,
    group: 3,
    concepts: ["quantum advantage", "complexity", "evidence"],
    concept:
      "Una ventaja cuántica requiere una mejora demostrada y relevante frente a métodos clásicos comparables, en una tarea y bajo métricas concretas. No es una propiedad automática de cualquier circuito.",
    intuition:
      "Elegir una tecnología no prueba que tu servicio sea más rápido. Necesitás un problema, un baseline competitivo y resultados medidos.",
    technical:
      "La ventaja puede referirse a complejidad asintótica o evidencia experimental, y no necesariamente a utilidad práctica. Preparación de datos, corrección de errores y extracción de resultados pueden dominar el costo.",
    visual:
      "Quantum algorithm ≠ Quantum advantage · Claim → Baseline → Evidence",
    code: '# Reportá evidencia, no marketing.\nbenchmark = {"problem": "task assignment",\n             "baseline": "exhaustive search",\n             "quantum_backend": "Aer simulator",\n             "advantage_demonstrated": False}',
    lab: "/optimization/compare",
    experiment:
      "Revisá el benchmark y escribí una conclusión que no confunda simulación, hardware y ventaja.",
    exercise:
      "Explicá qué evidencia faltaría para afirmar ventaja en una instancia de scheduling real.",
    question: "¿Cuándo es válida una afirmación de ventaja cuántica?",
    options: [
      "Al usar Qiskit",
      "Cuando hay más qubits",
      "Con una mejora demostrada frente a baselines comparables",
      "Al ver superposición",
    ],
    answer: 2,
    feedback:
      "Necesitás métricas explícitas, métodos clásicos comparables y evidencia reproducible. Usar un SDK o un algoritmo cuántico no alcanza.",
    takeaways: [
      "La ventaja depende de la tarea y métrica.",
      "Un simulador no demuestra aceleración física.",
      "Documentá limitaciones y baselines.",
    ],
  },
  {
    id: 18,
    title: "Build Your First Quantum Project",
    minutes: 30,
    group: 3,
    concepts: ["project", "hackathon", "reproducibility"],
    concept:
      "Tu primer proyecto puede ser un optimizador educativo de tareas: modelá costos, resolvé clásico, convertí a QUBO, ejecutá QAOA y explicá resultados con honestidad.",
    intuition:
      "El valor está en convertir un problema entendible en un experimento reproducible, con una interfaz que haga visibles las decisiones y limitaciones.",
    technical:
      "Separá dominio, codificación, backend y evaluación. Registrá versiones, semillas, costos, penalidades, reps, shots, parámetros y tiempos. Un piloto requiere instancias mayores y baselines competitivos.",
    visual:
      "Problem → Baseline → QUBO → QAOA → Evaluation → Demo → Honest conclusion",
    code: 'experiment = {"costs": [[4,7],[6,2],[3,5]],\n              "reps": 1, "shots": 1000, "seed": 42,\n              "iterations": 40}\n# Enviar a /api/optimization/qaoa y guardar resultados.',
    lab: "/readiness",
    experiment:
      "Completá el readiness checklist. Prepará una demo de 3 minutos con problema, circuito, interpretación y comparación.",
    exercise:
      "Escribí una hipótesis medible y un criterio para abandonar la aproximación cuántica si el baseline gana.",
    question: "¿Qué debe incluir una demo sólida de hackathon?",
    options: [
      "Solo un histograma",
      "Una promesa de quantum advantage",
      "Problema, baseline, resultados y límites",
      "La API key pública",
    ],
    answer: 2,
    feedback:
      "Una demo convincente conecta el problema con evidencia y explica las limitaciones. La reproducibilidad importa tanto como la interfaz.",
    takeaways: [
      "Construí una demo verificable.",
      "Guardá parámetros y resultados.",
      "Explicá el valor sin prometer ventajas no medidas.",
    ],
  },
];
export const groups = [
  {
    title: "The foundations",
    subtitle: "Una nueva forma de pensar",
    range: "01 — 08",
  },
  {
    title: "Build & run",
    subtitle: "Del concepto al código real",
    range: "09 — 12",
  },
  {
    title: "Quantum optimization",
    subtitle: "Un problema. Dos enfoques.",
    range: "13 — 15",
  },
  {
    title: "Hackathon ready",
    subtitle: "Convertí lo aprendido en impacto",
    range: "16 — 18",
  },
];
export const glossary: {
  term: string;
  definition: string;
  technical: string;
}[] = [
  [
    "bit",
    "Unidad clásica de información: 0 o 1.",
    "Variable con dos valores posibles.",
  ],
  [
    "qubit",
    "Unidad cuántica descrita por amplitudes de |0⟩ y |1⟩.",
    "Vector normalizado de ℂ², salvo fase global.",
  ],
  [
    "ket",
    "Notación |…⟩ para un estado cuántico.",
    "Notación de Dirac para un vector de estado.",
  ],
  [
    "state",
    "Descripción matemática de un sistema cuántico.",
    "Vector para estados puros, matriz de densidad en general.",
  ],
  [
    "basis state",
    "Un estado de referencia, como |00⟩ o |11⟩.",
    "Vector de una base ortonormal del espacio de Hilbert.",
  ],
  [
    "amplitude",
    "Número complejo cuyo módulo al cuadrado da una probabilidad.",
    "Coeficiente complejo de un vector de estado en una base.",
  ],
  [
    "probability",
    "Qué tan probable es un resultado al medir.",
    "Regla de Born: P(i)=|αᵢ|².",
  ],
  [
    "superposition",
    "Combinación coherente de estados de base con amplitudes y fases.",
    "Combinación lineal normalizada en una base determinada.",
  ],
  [
    "measurement",
    "Operación que entrega un resultado clásico y modifica el estado.",
    "Proyección y actualización condicionada al resultado.",
  ],
  [
    "shots",
    "Número de repeticiones de preparación, circuito y medición.",
    "Muestras de una distribución de medición; error típico ∝1/√N.",
  ],
  [
    "gate",
    "Operación que transforma un estado cuántico.",
    "En el modelo ideal, transformación unitaria.",
  ],
  [
    "Hadamard",
    "H crea o recombina superposición. H seguida de H vuelve al inicio.",
    "H=(X+Z)/√2 y H²=I.",
  ],
  ["X", "Invierte |0⟩ y |1⟩.", "Matriz de Pauli X."],
  [
    "CNOT",
    "Invierte el target condicionado al control. También se llama CX.",
    "Operación unitaria de dos qubits que puede entrelazar.",
  ],
  ["RX", "Rotación del qubit sobre el eje X.", "RX(θ)=exp(−iθX/2)."],
  [
    "RY",
    "Rotación sobre Y que ajusta amplitudes de |0⟩ y |1⟩.",
    "RY(θ)=exp(−iθY/2).",
  ],
  [
    "RZ",
    "Rotación sobre Z que cambia fase relativa.",
    "RZ(θ)=exp(−iθZ/2); puede conservar probabilidades en Z.",
  ],
  [
    "circuit",
    "Secuencia de puertas y mediciones sobre qubits.",
    "Programa del modelo de circuitos cuánticos.",
  ],
  [
    "backend",
    "Destino de ejecución: simulador local, cloud o QPU.",
    "Executor con puertas, conectividad y capacidades específicas.",
  ],
  [
    "simulator",
    "Programa clásico que modela la ejecución de un circuito.",
    "Puede simular estado puro, ruido o circuitos especializados.",
  ],
  [
    "QPU",
    "Procesador cuántico físico.",
    "Hardware que controla y mide qubits físicos.",
  ],
  [
    "entanglement",
    "Estado conjunto que no se separa en estados individuales.",
    "Para estados puros, no se factoriza como producto tensorial.",
  ],
  [
    "interference",
    "Las amplitudes se suman y pueden reforzarse o cancelarse.",
    "La fase relativa afecta las probabilidades tras recombinación.",
  ],
  [
    "Hamiltonian",
    "Operador que aquí asigna energía/costo a configuraciones.",
    "Operador hermítico; el mínimo corresponde a energía fundamental.",
  ],
  [
    "QUBO",
    "Optimización de una función cuadrática de variables binarias.",
    "F(x)=xᵀQx+constante con x∈{0,1}ⁿ.",
  ],
  [
    "QAOA",
    "Algoritmo híbrido de optimización aproximada.",
    "Capas exp(−iγH_C) y exp(−iβH_M) con optimización clásica.",
  ],
  [
    "VQE",
    "Algoritmo híbrido que minimiza energía con un circuito parametrizado.",
    "Variational Quantum Eigensolver.",
  ],
  [
    "Grover",
    "Algoritmo de búsqueda con amplificación de amplitudes.",
    "Ofrece mejora cuadrática en consultas a un oracle bajo supuestos.",
  ],
  [
    "noise",
    "Errores e interacciones no ideales durante la ejecución.",
    "Canales no unitarios, errores de lectura y control.",
  ],
  [
    "decoherence",
    "Pérdida de coherencia por interacción con el entorno.",
    "Proceso que reduce interferencia y puede destruir entrelazamiento.",
  ],
  [
    "transpilation",
    "Adaptar un circuito a las capacidades de un backend.",
    "Descomposición, mapping, routing y optimización de puertas.",
  ],
  [
    "quantum advantage",
    "Mejora demostrada frente a métodos clásicos comparables.",
    "Debe especificar tarea, métrica, baseline y evidencia.",
  ],
  [
    "IonQ",
    "Proveedor de QPUs de iones atrapados y simuladores cloud.",
    "Se integra mediante qiskit-ionq y autenticación desde el servidor.",
  ],
  [
    "Qiskit",
    "SDK Python para construir y transformar programas cuánticos.",
    "Aer y proveedores son paquetes separados del SDK.",
  ],
].map(([term, definition, technical]) => ({ term, definition, technical }));

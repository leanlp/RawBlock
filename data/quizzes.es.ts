import { type QuizQuestion } from "./quizzes";

export const NODE_QUIZZES_ES: Record<string, QuizQuestion[]> = {
    block: [
        {
            id: "q_block_1",
            text: "¿Cuál es la estructura de datos criptográfica principal que enlaza los bloques secuenciales de Bitcoin?",
            options: ["Árboles Merkle", "Hashes SHA-256", "Firmas RSA", "Promesas Schnorr"],
            correctIndex: 1,
            explanation: "Los bloques están enlazados a través del campo 'hash del bloque anterior' SHA-256 en la cabecera del bloque, estableciendo la cadena cronológica."
        },
        {
            id: "q_block_2",
            text: "¿Cuál de los siguientes determina el orden de las transacciones dentro de un solo bloque?",
            options: ["Orden alfabético por TxID", "El primero visto por la red", "Preferencia del minero, típicamente ordenado por tasa de comisión", "Proximidad geográfica del emisor"],
            correctIndex: 2,
            explanation: "Los mineros tienen total discreción sobre el ordenamiento de las transacciones y típicamente maximizan la ganancia ordenándolas por la tasa de comisión más alta."
        },
        {
            id: "q_block_3",
            text: "¿Dónde se almacena la métrica de señalización de 'versión', crítica para el consenso?",
            options: ["La transacción Coinbase", "La Raíz Merkle", "La Cabecera del Bloque", "El Script de Firma"],
            correctIndex: 2,
            explanation: "Los bits de versión son parte de la cabecera del bloque de 80 bytes y permiten a los mineros señalar su preparación para próximas ramificaciones suaves (soft-forks)."
        }
    ],
    mempool: [
        {
            id: "q_memp_1",
            text: "¿Qué ocurre a una transacción en la mempool si su comisión depende de ancestros sin confirmar?",
            options: ["Es rechazada inmediatamente", "Es evaluada como parte de un paquete CPFP (El Hijo Paga por el Padre)", "Se almacena pero es ignorada por los mineros", "Requiere un canal Lightning"],
            correctIndex: 1,
            explanation: "Los mineros evalúan paquetes de transacciones (CPFP) para determinar si un hijo con alta comisión puede patrocinar a un padre con baja comisión."
        },
        {
            id: "q_memp_2",
            text: "¿Es idéntica la mempool global de Bitcoin en todos los nodos?",
            options: ["Sí, impuesto por el Consenso Nakamoto", "No, es una estructura política local del nodo", "Sí, su sincronización tarda exactamente 10 minutos", "No, sólo los pools de minería tienen mempools reales"],
            correctIndex: 1,
            explanation: "La mempool es puramente política local. Dependiendo del tiempo en línea, de la conectividad y configuraciones de RAM, el mempool de cada nodo difiere ligeramente."
        },
        {
            id: "q_memp_3",
            text: "¿Qué resuelve un conflicto de Remplazo-Por-Comisión (RBF) en la mempool?",
            options: ["La primera transacción vista", "La transacción con una tasa de comisión absoluta mayor", "Un nodo de arbitraje establecido", "Un quórum Multifirma"],
            correctIndex: 1,
            explanation: "Bajo RBF optativo (BIP-125), el conflicto se resuelve aceptando la transacción de reemplazo si esta ofrece una comisión absoluta significativamente mayor."
        }
    ]
};

import type { AcademyNodeContentList } from "@/lib/content/schema";

export const academyNodeContentSeed: AcademyNodeContentList = [
  {
    id: "what-is-bitcoin",
    title: "Qué es Bitcoin",
    type: "property",
    difficulty: 1,
    canonicalLesson: "what-is-bitcoin",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Bitcoin es una red monetaria descentralizada donde nodos independientes aplican una oferta fija y un historial de transacciones compartido.",
    story:
      "Un nuevo aprendiz abre Raw Block esperando una aplicación de monedas y en su lugar encuentra un protocolo de coordinación. Cada diez minutos, participantes independientes alrededor del mundo convergen en un único estado contable sin un operador central. Bitcoin no es el servidor de una empresa; son reglas abiertas más verificación local. Cada nodo completo verifica bloques y transacciones de forma independiente, y esa disciplina compartida mantiene el sistema resiliente contra la censura y fallos de infraestructura. Una vez que este modelo se entiende, el resto resulta más claro: los mineros proveen el ordenamiento respaldado por costos, los nodos aplican la validez, las billeteras gestionan las llaves, y la confianza de liquidación crece con la profundidad de las confirmaciones.",
    deepDive: [
      {
        heading: "Modelo de sistema",
        bullets: [
          "Bitcoin combina redes peer-to-peer, firmas criptográficas y un ordenamiento de prueba de trabajo (Proof-of-Work).",
          "Los cambios de estado ocurren mediante transacciones válidas que gastan UTXOs existentes y crean unos nuevos.",
          "Ningún administrador central puede emitir suministro adicional fuera de las reglas del consenso.",
        ],
      },
      {
        heading: "Por qué importa",
        bullets: [
          "La verificación independiente reduce los requisitos de confianza comparado con libros contables custodiados.",
          "La participación abierta crea resistencia a censura y resiliencia a través de la diversidad geográfica y de propiedad.",
          "La emisión fija y el calendario predecible de halvings proveen restricciones monetarias creíbles.",
        ],
      },
    ],
    keyTakeaways: [
      "Bitcoin es un protocolo y una red, no un producto de una compañía.",
      "Las reglas de consenso imponen globalmente la oferta y la validez.",
      "Los nodos validan; los mineros ordenan; los usuarios guardan las llaves.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Altura de Bloque Actual",
        description: "Última punta de cadena conocida utilizada para anclar los módulos de aprendizaje posteriores.",
        display: "Entero con separador de miles",
      },
      {
        key: "daysUntilHalving",
        label: "Días hasta el próximo Halving",
        description: "Se estima usando los bloques restantes y el intervalo promedio de 10 minutos por bloque.",
        display: "Cuenta regresiva en días enteros con bloques restantes",
      },
    ],
    securityNotes: [
      "La seguridad de Bitcoin asume una validación independiente extensa mediante nodos completos.",
      "El historial del libro mayor se vuelve más difícil de reescribir conforme se acumulan las confirmaciones.",
    ],
    linkedVulnerabilities: ["value-overflow-2010"],
    linkedAttacks: ["attack-51-percent"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "La política de transmisión del nodo puede rechazar transacciones estándar o de bajas comisiones.",
      "Las configuraciones de políticas pueden diferir por nodo sin causar bifurcaciones de consenso.",
    ],
    consensusRules: [
      "La validez de bloques y transacciones es determinista bajo los controles del consenso.",
      "La creación de la oferta debe seguir el programa de subsidios del protocolo.",
    ],
    policyVsConsensusExplanation:
      "El consenso define la validez para la propia cadena; la política define preferencias locales de admisión a la mempool o de retransmisión.",
    caseStudies: [
      {
        title: "Incidente de Desbordamiento de Valor de 2010",
        year: 2010,
        summary:
          "Un error del consenso permitió causar inflación inválidamente y evidenció la necesidad de realizar validaciones estrictas y de la coordinación rápida de parches.",
      },
    ],
    explorerDeepLinks: [
      { label: "Bloques Recientes", url: "https://mempool.space/blocks" },
      { label: "Panel de Dificultad", url: "https://mempool.space/mining" },
    ],
    claimSources: [
      {
        claim: "La oferta de Bitcoin esta limitada por las reglas del protocolo y los halvings.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          {
            title: "Bitcoin Core consensus constants",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h",
            type: "core-docs",
          },
        ],
      },
      {
        claim: "Los nodos validan de forma independiente cada bloque y transaccion.",
        sources: [
          {
            title: "Bitcoin Developer Guide: P2P Network",
            url: "https://developer.bitcoin.org/devguide/p2p_network.html",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Wiki: Full node",
            url: "https://en.bitcoin.it/wiki/Full_node",
            type: "reference",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf" },
      {
        title: "Developer Guide Introduction",
        url: "https://developer.bitcoin.org/devguide/index.html",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "transactions-lifecycle",
    title: "Ciclo de Vida de las Transacciones",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "transactions",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Las transacciones mueven valor consumiendo salidas anteriores, creando nuevas salidas y propagandose por las mempools de los nodos antes de su inclusion en bloques.",
    story:
      "Un comerciante ve una notificacion de pago y pregunta: ?esto ya es final? El ciclo comienza cuando una wallet arma inputs, firma condiciones de gasto y transmite a peers. Cada nodo revisa estructura, scripts y politica antes de aceptar en su mempool. Luego los mineros eligen transacciones segun densidad de fee y estrategia de plantilla, produciendo un bloque candidato. Una vez minada, la transaccion recibe su primera confirmacion y luego confirmaciones adicionales. El punto operativo clave es que las etapas del ciclo tienen niveles de riesgo distintos. Estar en mempool no es finalidad. La primera confirmacion es significativa y confirmaciones mas profundas reducen la probabilidad de reversión. Raw Block lo vuelve visible conectando decoder, mempool y bloques para seguir el cambio de estado de la transaccion.",
    deepDive: [
      {
        heading: "Creacion y relay",
        bullets: [
          "Las wallets hacen coin selection y estimacion de fee-rate antes de firmar.",
          "El relay funciona por gossip, por eso el contenido de mempool difiere ligeramente segun nodo y momento.",
          "Los checks de politica filtran relay; los checks de consenso filtran inclusion final en cadena.",
        ],
      },
      {
        heading: "Confirmacion y liquidacion",
        bullets: [
          "La inclusion en un bloque valido da la primera confirmacion en cadena.",
          "La profundidad de confirmacion aumenta la confianza contra reversiones por reorg.",
          "Flujos de alto valor suelen esperar mas confirmaciones antes de aceptar liquidacion.",
        ],
      },
    ],
    keyTakeaways: [
      "La aceptacion en mempool no es liquidacion final.",
      "La tasa de fee influye fuertemente en la velocidad de inclusion.",
      "La profundidad de confirmacion es una perilla de gestion de riesgo.",
    ],
    realData: [
      {
        key: "feeFast",
        label: "Fee Rapido",
        description: "sat/vB recomendado para inclusion de corto plazo en condiciones congestionadas.",
        display: "sat/vB badge",
      },
      {
        key: "feeHalfHour",
        label: "Fee 30 Min",
        description: "Recomendacion para transacciones de urgencia moderada.",
        display: "sat/vB badge",
      },
    ],
    securityNotes: [
      "Aceptar con cero confirmaciones es vulnerable a intentos de double-spend.",
      "Las herramientas de fee bumping (RBF/CPFP) reducen el riesgo de transacciones atascadas.",
    ],
    linkedVulnerabilities: ["malleability-pre-segwit"],
    linkedAttacks: ["double-spend"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "El manejo de replace-by-fee depende de la politica local de mempool.",
      "Los nodos pueden rechazar transacciones de bajo fee aunque sean validas por consenso.",
    ],
    consensusRules: [
      "Los inputs deben referenciar outputs validos y no gastados.",
      "Scripts y firmas deben evaluar correctamente para cada gasto.",
    ],
    policyVsConsensusExplanation:
      "La politica influye en el relay y la aceptacion en mempool; el consenso determina si las transacciones minadas son historial valido de cadena.",
    caseStudies: [
      {
        title: "Pre-SegWit Malleability Operational Failures",
        year: 2014,
        summary:
          "La maleabilidad del txid rompio el seguimiento de transacciones no confirmadas y motivo prioridades de diseño en SegWit.",
      },
    ],
    explorerDeepLinks: [
      { label: "Cola de Mempool", url: "https://mempool.space/mempool" },
      { label: "Transacciones Recientes", url: "https://mempool.space/" },
    ],
    claimSources: [
      {
        claim: "Las transacciones se propagan por relay entre peers y entran a mempools locales antes de ser minadas.",
        sources: [
          {
            title: "Developer Guide: Transactions",
            url: "https://developer.bitcoin.org/devguide/transactions.html",
            type: "dev-guide",
          },
          {
            title: "Developer Guide: P2P Network",
            url: "https://developer.bitcoin.org/devguide/p2p_network.html",
            type: "dev-guide",
          },
        ],
      },
      {
        claim: "La tasa de fee determina la prioridad de una transaccion cuando el espacio en bloque es limitado.",
        sources: [
          {
            title: "Mempool replacements policy",
            url: "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/mempool-replacements.md",
            type: "core-docs",
          },
          {
            title: "BIP 125 Replace-by-fee",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki",
            type: "BIP",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "BIP 125",
        url: "https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki",
      },
      {
        title: "Mempool Policy Docs",
        url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "utxo-model",
    title: "Modelo UTXO",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "utxo-model",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Bitcoin rastrea el estado gastable como salidas no gastadas (UTXOs), no como balances de cuenta, permitiendo validar de forma determinista cada ruta de gasto.",
    story:
      "Un usuario pregunta por que su wallet muestra muchas piezas pequenas en vez de un solo balance de cuenta. La respuesta es el modelo UTXO: cada pago crea salidas con condiciones de gasto explicitas y transacciones posteriores consumen esas salidas como inputs. Este modelo hace que la validacion sea local y precisa. Un nodo no confia en un campo de balance acumulado; comprueba si cada salida referenciada existe, no fue gastada y satisface las reglas de script. Ese diseño simplifica la seguridad del consenso pero crea trade-offs practicos. Grandes conjuntos de UTXOs pequenos aumentan fees futuros y dañan la privacidad si se consolidan sin cuidado. Por eso las wallets optimizan coin selection, batching y manejo de change. En Raw Block, entender el comportamiento UTXO ayuda a razonar mucho mejor sobre fees, privacidad y superficie de ataque que los modelos mentales basados en cuentas.",
    deepDive: [
      {
        heading: "Mecanica de validacion",
        bullets: [
          "Cada input apunta a un output previo y debe satisfacer su locking script.",
          "Un UTXO puede gastarse exactamente una vez en historial valido de cadena.",
          "El conjunto global de UTXOs es el estado autoritativo de gastabilidad.",
        ],
      },
      {
        heading: "Implicancias operativas",
        bullets: [
          "Muchos UTXOs pequeños aumentan peso y fees futuros de transacciones.",
          "La consolidacion mejora eficiencia futura pero puede reducir privacidad si se hace mal.",
          "La estrategia de coin selection afecta tanto costo como exposicion al clustering de direcciones.",
        ],
      },
    ],
    keyTakeaways: [
      "El estado UTXO es explicito y de gasto unico.",
      "Las wallets optimizan coin selection para controlar costo y privacidad.",
      "La prevencion de double-spend se aplica mediante consumo unico de UTXOs.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Altura de Referencia",
        description: "Altura actual de la cadena para contextualizar snapshots UTXO y confirmaciones.",
        display: "Integer",
      },
      {
        key: "feeHour",
        label: "Fee de Baja Urgencia",
        description: "Util para planificar consolidacion durante ventanas de fees mas bajos.",
        display: "sat/vB badge",
      },
    ],
    securityNotes: [
      "La unicidad UTXO evita gastos duplicados validos en consenso.",
      "Patrones de reutilizacion de wallet pueden filtrar clustering de propiedad con el tiempo.",
    ],
    linkedVulnerabilities: ["cve-2018-17144"],
    linkedAttacks: ["double-spend"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "Las politicas de dust y standardness desalientan outputs antieconomicos.",
      "Las preferencias de relay pueden moldear la higiene UTXO en wallets.",
    ],
    consensusRules: [
      "Los inputs deben gastar outputs no gastados exactamente una vez.",
      "El valor total de outputs no debe exceder el valor total de inputs mas el subsidio permitido en coinbase.",
    ],
    policyVsConsensusExplanation:
      "El consenso protege la validez del gasto; la politica empuja una construccion de transacciones y un comportamiento de relay economicamente sensatos.",
    caseStudies: [
      {
        title: "CVE-2018-17144 Duplicate Input Risk",
        year: 2018,
        summary:
          "Una regresion de validacion con inputs duplicados remarco cuan criticos son los checks UTXO para resistir inflacion.",
      },
    ],
    explorerDeepLinks: [
      { label: "Explorador UTXO", url: "https://www.rawblock.net/analysis/utxo" },
      { label: "UTXOs de Direccion", url: "https://mempool.space/address/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
    ],
    claimSources: [
      {
        claim: "Bitcoin usa un modelo de estado de salidas no gastadas en lugar de balances por cuenta.",
        sources: [
          {
            title: "Developer Guide Transactions",
            url: "https://developer.bitcoin.org/devguide/transactions.html",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Wiki UTXO model",
            url: "https://en.bitcoin.it/wiki/Transaction",
            type: "reference",
          },
        ],
      },
      {
        claim: "El manejo de inputs duplicados es critico para el consenso y la seguridad frente a inflacion.",
        sources: [
          {
            title: "CVE-2018-17144 disclosure",
            url: "https://bitcoincore.org/en/2018/09/20/notice/",
            type: "core-docs",
          },
          {
            title: "Bitcoin Core fix PR context",
            url: "https://github.com/bitcoin/bitcoin/pull/14199",
            type: "core-docs",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "Developer Reference: Transactions",
        url: "https://developer.bitcoin.org/reference/transactions.html",
      },
      {
        title: "BIP 30",
        url: "https://github.com/bitcoin/bips/blob/master/bip-0030.mediawiki",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "blocks-and-headers",
    title: "Bloques y Encabezados",
    type: "primitive",
    difficulty: 1,
    canonicalLesson: "blocks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Los encabezados de bloque comprometen el historial previo y metadatos del conjunto de transacciones, haciendo detectable y costosa cualquier manipulacion.",
    story:
      "Un nodo recibe un bloque nuevo y debe decidir rapido: aceptar o rechazar. Empieza por el header. El header contiene el hash del bloque previo, timestamp, objetivo de dificultad, nonce y el compromiso del merkle root. Esta estructura pequena enlaza cada bloque con el historial previo y ancla la prueba de trabajo. Si cambia cualquier transaccion del bloque, cambia el merkle root; si cambia cualquier padre, se rompe el enlace de previous-hash. Este encadenamiento explica por que los usuarios pueden verificar integridad sin confiar en un archivo central. Los headers tambien permiten a clientes livianos seguir el chainwork y detectar reorganizaciones. En la practica, bloques y headers son la frontera compacta de seguridad del protocolo: datos suficientes para imponer orden y compromiso, y luego transacciones completas para validacion detallada.",
    deepDive: [
      {
        heading: "Campos del header",
        bullets: [
          "prevhash enlaza historial del bloque padre y define continuidad de cadena.",
          "Merkle root compromete el conjunto de transacciones incluidas.",
          "nBits codifica el objetivo de dificultad para validez de proof-of-work.",
        ],
      },
      {
        heading: "Propiedades de seguridad",
        bullets: [
          "Cambiar contenido historico requiere recomputar proof-of-work para bloques afectados.",
          "La validacion solo de headers puede rechazar rapidamente ramas obviamente invalidas.",
          "La latencia de propagacion aun puede causar carreras cortas con bloques stale.",
        ],
      },
    ],
    keyTakeaways: [
      "Los headers son compromisos compactos al estado del bloque y su ancestro.",
      "Los compromisos Merkle hacen evidente la manipulacion de transacciones.",
      "La integridad de cadena esta enlazada por hashes y respaldada por trabajo.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Altura de Punta",
        description: "Altura de referencia para explorar headers recientes e intervalos de bloques.",
        display: "Integer",
      },
      {
        key: "hashrateEh",
        label: "Hashrate",
        description: "Hashpower global aproximado que asegura la cadena de headers.",
        display: "EH/s with 2 decimals",
      },
    ],
    securityNotes: [
      "La seleccion de cadena por headers sigue trabajo acumulado, no longitud por cantidad.",
      "Carreras cortas con bloques stale son normales; reorgs profundos inesperados son eventos de seguridad.",
    ],
    linkedVulnerabilities: ["cve-2013-2292"],
    linkedAttacks: ["selfish-mining"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "El relay de headers y el manejo de huerfanos puede variar segun politica de implementacion.",
      "La politica del nodo puede priorizar ciertas fuentes de peers bajo presion de ancho de banda.",
    ],
    consensusRules: [
      "El hash del header debe satisfacer el objetivo codificado por nBits.",
      "El header debe referenciar correctamente el hash del bloque previo aceptado.",
    ],
    policyVsConsensusExplanation:
      "El consenso define validez de headers y seleccion de cadena por trabajo; la politica afecta la estrategia de relay y el buffering temporal.",
    caseStudies: [
      {
        title: "2013 BerkeleyDB Fork Event",
        year: 2013,
        summary:
          "Incompatibilidades entre versiones de cliente causaron divergencia temporal de cadena pese a headers aparentemente validos en cada lado.",
      },
    ],
    explorerDeepLinks: [
      { label: "Headers de Bloques Recientes", url: "https://mempool.space/blocks" },
      { label: "Detalle de Bloque", url: "https://mempool.space/block/000000000000000000021f95d73bb43fcbfca90f4ed7f1e8d8d7a5f8f278e5d3" },
    ],
    claimSources: [
      {
        claim: "Cada block header compromete historial previo y merkle root de transacciones.",
        sources: [
          {
            title: "Developer Reference: Block Headers",
            url: "https://developer.bitcoin.org/reference/block_chain.html#block-headers",
            type: "dev-guide",
          },
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
        ],
      },
      {
        claim: "La seleccion de cadena usa trabajo acumulado.",
        sources: [
          {
            title: "Developer Guide: Block Chain",
            url: "https://developer.bitcoin.org/devguide/block_chain.html",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Core consensus logic",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp",
            type: "core-docs",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 34", url: "https://github.com/bitcoin/bips/blob/master/bip-0034.mediawiki" },
      {
        title: "Developer block chain reference",
        url: "https://developer.bitcoin.org/reference/block_chain.html",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "mining-and-subsidy",
    title: "Minería y Subsidio",
    type: "mechanism",
    difficulty: 2,
    canonicalLesson: "mining",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Los mineros convierten electricidad y costo de hardware en seguridad de cadena, recibiendo una coinbase compuesta por subsidio de bloque y comisiones.",
    story:
      "Un minero arma un bloque candidato con transacciones de la mempool y comienza a hashear billones de veces por segundo. No hay un rompecabezas con atajo; solo intentos repetidos de hash hasta que un header cae por debajo del umbral objetivo. El minero ganador transmite el bloque, recibe el pago coinbase y todos los demas lo verifican. Este proceso produce dos resultados cruciales al mismo tiempo: ordenamiento de transacciones y disuasion economica frente a reescribir historial. Con el tiempo, el subsidio se reduce y el ingreso por fees gana importancia. Esa transicion explica por que la alfabetizacion del mercado de fees importa para usuarios y operadores. La mineria no es solo emision; es el ancla de costos que vuelve cara la censura y los intentos de reorg profundos.",
    deepDive: [
      {
        heading: "Modelo de ingresos",
        bullets: [
          "Pago coinbase = subsidio del protocolo + fees agregados de transacciones.",
          "El subsidio se reduce cada 210.000 bloques y tiende a cero.",
          "La presion de fees puede dominar el ingreso minero durante picos de congestion.",
        ],
      },
      {
        heading: "Funcion de seguridad",
        bullets: [
          "Proof-of-work vuelve costosos, en computo y economia, los intentos de reescribir la cadena.",
          "La competencia entre mineros se alinea hacia bloques validos porque los invalidos son rechazados por nodos.",
          "La concentracion de hashpower aumenta riesgo de gobernanza y censura.",
        ],
      },
    ],
    keyTakeaways: [
      "La mineria asegura ordenamiento y liquidacion, no solo emision.",
      "El subsidio cae mientras los fees importan mas en horizontes largos.",
      "Los nodos imponen validez aun cuando los mineros producen bloques.",
    ],
    realData: [
      {
        key: "hashrateEh",
        label: "Hashrate de Red",
        description: "Proxy de hashrate promedio de 3 dias a partir de telemetria publica de mineria.",
        display: "EH/s",
      },
      {
        key: "blocksUntilHalving",
        label: "Bloques para el Halving",
        description: "Bloques restantes antes de la transicion de epoca del subsidio.",
        display: "Integer countdown",
      },
    ],
    securityNotes: [
      "Un hashrate mayor eleva el costo de ataques de reorg profundos.",
      "La centralizacion de pools puede debilitar supuestos de resistencia a censura.",
    ],
    linkedVulnerabilities: ["value-overflow-2010"],
    linkedAttacks: ["attack-51-percent", "selfish-mining"],
    linkedAssumptions: ["hashpower-majority-assumption", "decentralized-hash-distribution-assumption"],
    policyRules: [
      "La seleccion de plantilla de transacciones es una decision de politica minera.",
      "La politica puede influir resultados del mercado de fees sin cambiar la validez de consenso.",
    ],
    consensusRules: [
      "El pago coinbase no debe exceder subsidio mas fees cobrados.",
      "El objetivo de proof-of-work debe cumplirse para aceptar el bloque.",
    ],
    policyVsConsensusExplanation:
      "El consenso acota payout y validez del bloque; la politica minera gobierna que transacciones validas se incluyen primero.",
    caseStudies: [
      {
        title: "Selfish Mining Strategy Publication",
        year: 2014,
        summary:
          "Mostro que el withholding estrategico puede aumentar ingreso esperado por encima de la mineria honesta en ciertos umbrales de participacion de hash.",
      },
    ],
    explorerDeepLinks: [
      { label: "Panel de Mineria", url: "https://mempool.space/mining" },
      { label: "Transacciones Coinbase Recientes", url: "https://mempool.space/tx/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b" },
    ],
    claimSources: [
      {
        claim: "El pago coinbase es subsidio mas fees y el subsidio se reduce cada 210.000 bloques.",
        sources: [
          {
            title: "Developer block subsidy reference",
            url: "https://developer.bitcoin.org/reference/block_chain.html#block-subsidy",
            type: "dev-guide",
          },
          { title: "BIP 42", url: "https://github.com/bitcoin/bips/blob/master/bip-0042.mediawiki", type: "BIP" },
        ],
      },
      {
        claim: "La prueba de trabajo sostiene una resistencia costosa a la reescritura de cadena.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          {
            title: "Developer Guide Block Chain",
            url: "https://developer.bitcoin.org/devguide/block_chain.html",
            type: "dev-guide",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "bitcoin-dev mining discussions",
        url: "https://lists.linuxfoundation.org/pipermail/bitcoin-dev/",
      },
      {
        title: "Eyal & Sirer Selfish Mining",
        url: "https://www.cs.cornell.edu/~ie53/publications/btcProcFC.pdf",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "difficulty-adjustment-2016",
    title: "Ajuste de Dificultad (2016)",
    type: "rule",
    difficulty: 2,
    canonicalLesson: "difficulty",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Bitcoin reajusta la dificultad de minado cada 2016 bloques para mantener la produccion promedio cerca de diez minutos pese a cambios en el hashrate.",
    story:
      "El hashrate rara vez permanece constante. Aparece nuevo hardware, cambian los precios de energia y los mineros se relocalizan. Sin ajuste, el tiempo entre bloques se desviaria y la emision monetaria se volveria caotica. Bitcoin resuelve esto con retarget cada 2016 bloques: si los bloques recientes llegaron demasiado rapido, el objetivo se endurece; si llegaron demasiado lento, se relaja. Esta cadencia amortigua grandes shocks manteniendo el consenso determinista. Los operadores siguen esto de cerca porque caidas bruscas de hashrate pueden producir bloques temporalmente lentos hasta el proximo ajuste. En terminos educativos, la dificultad es el regulador de tempo de Bitcoin. No hace la mineria mas facil en terminos humanos; actualiza los umbrales objetivo para que el proceso global se mantenga estable en horizontes largos.",
    deepDive: [
      {
        heading: "Mecanica del ajuste",
        bullets: [
          "Cada 2016 bloques, los nodos comparan tiempo esperado transcurrido con tiempo observado.",
          "El nuevo objetivo se ajusta proporcionalmente y luego se codifica en nBits.",
          "Todos los nodos validadores computan e imponen de forma independiente la misma regla de retarget.",
        ],
      },
      {
        heading: "Casos limite operativos",
        bullets: [
          "Salidas grandes de hashrate pueden ralentizar confirmaciones hasta el limite de epoca.",
          "El comportamiento de timestamps influye en el retarget y fue estudiado por vectores de manipulacion.",
          "Las tendencias de dificultad dan contexto aproximado de costo de seguridad, pero no son garantias directas antiataque.",
        ],
      },
    ],
    keyTakeaways: [
      "El intervalo de retarget es de 2016 bloques por consenso.",
      "La dificultad estabiliza el ritmo de emision en periodos de varios años.",
      "La volatilidad de corto plazo sigue existiendo entre ventanas de retarget.",
    ],
    realData: [
      {
        key: "hashrateEh",
        label: "Hashrate Actual",
        description: "Se usa para contextualizar la presion esperada en las proximas ventanas de ajuste.",
        display: "EH/s",
      },
      {
        key: "blockHeight",
        label: "Altura de Contexto del Ajuste",
        description: "La altura actual indica la distancia al proximo limite de 2016 bloques.",
        display: "Integer",
      },
    ],
    securityNotes: [
      "La dificultad por si sola no previene ataques; escala los requisitos de trabajo.",
      "Se monitorean anomalias de timestamp porque influyen en inputs del retarget.",
    ],
    linkedVulnerabilities: ["timewarp-theoretical"],
    linkedAttacks: ["attack-51-percent"],
    linkedAssumptions: ["sha256-preimage-resistance-assumption"],
    policyRules: [
      "La politica del nodo puede mostrar alertas ante comportamiento inusual de tiempo de bloque.",
      "Las convenciones de timestamp de mineros son en parte sociales/politica y en parte acotadas por consenso.",
    ],
    consensusRules: [
      "El objetivo de dificultad debe coincidir con la formula de retarget de consenso en los limites.",
      "La validacion PoW del header usa el objetivo actual para cada bloque.",
    ],
    policyVsConsensusExplanation:
      "El consenso impone computo exacto del objetivo y su validez; politica y operaciones determinan monitoreo y respuesta a condiciones anormales de timing.",
    caseStudies: [
      {
        title: "Timewarp Discussions",
        year: 2012,
        summary:
          "Investigaciones y discusiones en listas exploraron juegos de timestamp que podrian distorsionar el retarget historico bajo coordinacion.",
      },
    ],
    explorerDeepLinks: [
      { label: "Grafico de Dificultad", url: "https://mempool.space/graphs/mining/difficulty-adjustment" },
      { label: "Grafico de Hashrate", url: "https://mempool.space/graphs/mining/hashrate-difficulty" },
    ],
    claimSources: [
      {
        claim: "Bitcoin ajusta la dificultad cada 2016 bloques.",
        sources: [
          {
            title: "Developer block chain reference",
            url: "https://developer.bitcoin.org/reference/block_chain.html#target-nbits",
            type: "dev-guide",
          },
          { title: "Bitcoin Wiki Difficulty", url: "https://en.bitcoin.it/wiki/Difficulty", type: "reference" },
        ],
      },
      {
        claim: "El retarget es critico para el consenso y es validado por nodos completos.",
        sources: [
          {
            title: "Bitcoin Core pow.cpp",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp",
            type: "core-docs",
          },
          {
            title: "Bitcoin Core validation logic",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp",
            type: "core-docs",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "pow.cpp source", url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp" },
      {
        title: "bitcoin-dev timestamp discussions",
        url: "https://lists.linuxfoundation.org/pipermail/bitcoin-dev/",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "consensus-rules-vs-policy",
    title: "Reglas de Consenso vs Política",
    type: "rule",
    difficulty: 2,
    canonicalLesson: "consensus",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "El consenso decide que historial de cadena es valido; la politica decide que retransmite o mina un nodo antes de la confirmacion.",
    story:
      "Dos nodos pueden diferir en comportamiento de relay y aun asi permanecer en una misma cadena. Ese es el limite entre politica y consenso. Las reglas de consenso son requisitos duros: si las violas, los bloques son invalidos en todas partes. Las reglas de politica son preferencias locales usadas para higiene de mempool, resistencia al spam y optimizacion de fees. Esta distincion es fundamental para quien empieza porque muchos debates confunden preferencias de relay con validez del protocolo. Raw Block lo explicita para que el usuario razone sobre RBF, standardness y filtros de fee sin confundirlos con cambios de consenso. Entender este limite tambien aclara por que los upgrades de Bitcoin son conservadores: los cambios de consenso requieren coordinacion amplia, mientras los refinamientos de politica pueden iterar mas rapido e independientemente.",
    deepDive: [
      {
        heading: "Alcance del consenso",
        bullets: [
          "Define formato valido de bloque, ejecucion de scripts, limites de subsidio y reglas de gasto UTXO.",
          "Las violaciones disparan rechazo de bloques y posibles divisiones de cadena.",
          "Los cambios de consenso requieren despliegue coordinado del protocolo y adopcion amplia.",
        ],
      },
      {
        heading: "Alcance de la politica",
        bullets: [
          "Controla admision de relay, manejo de reemplazos y plantillas de standardness.",
          "La diversidad de politica entre nodos es esperable y no produce forks.",
          "Los mineros pueden sobreescribir la politica por defecto en decisiones de plantilla de bloque.",
        ],
      },
    ],
    keyTakeaways: [
      "La invalidez de consenso es global; el rechazo por politica es local.",
      "La politica ayuda a proteger recursos sin redefinir reglas monetarias.",
      "No infieras consenso solo a partir del comportamiento de la mempool.",
    ],
    realData: [
      {
        key: "feeFast",
        label: "Senal de Presion de Relay",
        description: "Fees recomendados altos suelen indicar condiciones practicas de relay mas estrictas.",
        display: "sat/vB",
      },
      {
        key: "lastUpdated",
        label: "Hora del Snapshot de Politica",
        description: "Timestamp del ultimo contexto de fee/politica obtenido.",
        display: "ISO local timestamp",
      },
    ],
    securityNotes: [
      "Confundir politica y consenso puede causar configuraciones erradas serias en operadores.",
      "Los bugs de consenso son sistemicos; los bugs de politica suelen ser locales y recuperables.",
    ],
    linkedVulnerabilities: ["cve-2018-17144", "cve-2013-2292"],
    linkedAttacks: ["double-spend"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "Filtrado de standardness para scripts poco comunes en configuraciones de relay por defecto.",
      "Minimum relay feerate y politica de reemplazo RBF afectan admision y reemplazo en mempool.",
      "Eviccion de mempool y comportamiento de package relay son decisiones de politica de implementacion.",
    ],
    consensusRules: [
      "MAX_BLOCK_WEIGHT (4,000,000 weight units de SegWit/BIP141) es una regla de validez de bloque de consenso.",
      "Madurez de coinbase, validez de scripts y restricciones de gasto UTXO son impuestas por consenso.",
      "Compromisos de estructura de bloque y validez del objetivo de proof-of-work son checks obligatorios de consenso.",
    ],
    policyVsConsensusExplanation:
      "La politica es una capa de admision previa al consenso; el consenso es la capa final y universal de validez.",
    caseStudies: [
      {
        title: "CVE-2018-17144",
        year: 2018,
        summary:
          "Una regresion en validacion de consenso demostro riesgo sistemico cuando fallan checks nucleares de validez.",
      },
    ],
    explorerDeepLinks: [
      {
        label: "Docs de politica de mempool",
        url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy",
      },
      {
        label: "Doc de politica RBF",
        url: "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/mempool-replacements.md",
      },
    ],
    claimSources: [
      {
        claim: "Consenso y politica son capas de enforcement separadas en Bitcoin Core.",
        sources: [
          {
            title: "consensus.h",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h",
            type: "core-docs",
          },
          {
            title: "policy.h",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.h",
            type: "core-docs",
          },
        ],
      },
      {
        claim: "RBF y el comportamiento de reemplazo en relay son mecanismos de nivel de politica.",
        sources: [
          {
            title: "Mempool replacements",
            url: "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/mempool-replacements.md",
            type: "core-docs",
          },
          {
            title: "BIP 125",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki",
            type: "BIP",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "Policy docs",
        url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy",
      },
      { title: "Validation source", url: "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "pseudonymity-not-anonymity",
    title: "Seudonimato, no Anonimato",
    type: "property",
    difficulty: 1,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Las transacciones de Bitcoin son publicas y analizables; las direcciones son seudonimos, no anonimato garantizado por identidad.",
    story:
      "Un usuario primerizo escucha que Bitcoin es anonimo y luego se sorprende cuando los exploradores muestran cada ruta de transferencia. El modelo mental correcto es el seudonimato. Las direcciones no contienen nombres legales, pero los grafos de transacciones son publicos para siempre y las tecnicas de clustering pueden vincular patrones de actividad con entidades. Esto importa para seguridad, cumplimiento e higiene de privacidad personal. Direcciones reutilizadas, patrones de retiro deterministas y consolidacion descuidada aumentan la trazabilidad. Raw Block enseña esto temprano para que los usuarios tomen mejores decisiones operativas: rotar direcciones de recepcion, entender outputs de cambio y evitar falsas suposiciones de invisibilidad. La privacidad en Bitcoin es una disciplina de ingenieria, no una garantia por defecto.",
    deepDive: [
      {
        heading: "Modelo de visibilidad",
        bullets: [
          "Todas las transacciones confirmadas son inspeccionables publicamente por cualquiera.",
          "Los grafos de direcciones pueden agruparse con heuristicas y metadatos externos.",
          "Filtraciones de identidad off-chain pueden desanonimizar patrones on-chain.",
        ],
      },
      {
        heading: "Higiene practica",
        bullets: [
          "Usa nuevas direcciones de recepcion para cada flujo de pago.",
          "Trata las transacciones de consolidacion como eventos sensibles para la privacidad.",
          "Entiende el vinculo KYC de exchanges antes de asumir negacion plausible.",
        ],
      },
    ],
    keyTakeaways: [
      "Bitcoin es seudonimo, no anonimo.",
      "La reutilizacion de direcciones debilita la privacidad de forma significativa.",
      "El resultado de privacidad depende del comportamiento, herramientas y contrapartes.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Contexto Actual del Ledger",
        description: "La continuidad de la cadena publica implica que la trazabilidad historica persiste entre alturas.",
        display: "Height",
      },
      {
        key: "lastUpdated",
        label: "Snapshot de Analitica",
        description: "Timestamp del ultimo contexto de red publica visible en Raw Block.",
        display: "Date/time",
      },
    ],
    securityNotes: [
      "La reutilizacion de direcciones y retiros deterministas son vectores comunes de vinculacion forense.",
      "La observacion publica de la mempool puede filtrar patrones de tiempo y origen.",
    ],
    linkedVulnerabilities: [],
    linkedAttacks: ["eclipse-attack"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "Las politicas por defecto de wallets y exchanges influyen en resultados de privacidad en la practica.",
      "La retencion de metadatos a nivel de politica puede amplificar el riesgo de atribucion on-chain.",
    ],
    consensusRules: [
      "El consenso registra el grafo de transacciones de forma publica e inmutable una vez confirmado.",
      "El consenso no codifica campos de identidad del usuario.",
    ],
    policyVsConsensusExplanation:
      "El consenso hace publicos los datos de transacciones; los resultados de privacidad se moldean por politica y comportamiento sobre esa base publica.",
    caseStudies: [
      {
        title: "Address Clustering Research",
        year: 2013,
        summary:
          "Trabajo academico demostro vinculacion a gran escala de direcciones y entidades usando heuristicas de grafos.",
      },
    ],
    explorerDeepLinks: [
      { label: "Explorador de Direcciones", url: "https://mempool.space/address/bc1qq6hag67dl53wl99vzg42z8eyzfz2xlkv44mqgc" },
      { label: "Ejemplo de Grafo de Transaccion", url: "https://mempool.space/tx/4d8f0f9f8adf4f8c6a9d663ccf71fa5f3f8ce5265d8f95dc9ec03bd3f5d5e287" },
    ],
    claimSources: [
      {
        claim: "Los datos de transacciones de Bitcoin son publicos y trazables.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          { title: "Bitcoin Wiki Privacy", url: "https://en.bitcoin.it/wiki/Privacy", type: "reference" },
        ],
      },
      {
        claim: "El clustering de direcciones puede inferir relaciones de propiedad.",
        sources: [
          {
            title: "Meiklejohn et al.",
            url: "https://www.usenix.org/system/files/conference/imc13/imc13-meiklejohn.pdf",
            type: "reference",
          },
          {
            title: "Developer Guide Wallet Privacy",
            url: "https://developer.bitcoin.org/devguide/wallets.html",
            type: "dev-guide",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "Bitcoin Wiki Privacy", url: "https://en.bitcoin.it/wiki/Privacy" },
      {
        title: "Address reuse guidance",
        url: "https://en.bitcoin.it/wiki/Address_reuse",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "wallets-hold-keys-not-coins",
    title: "Las Billeteras Guardan Llaves, no Monedas",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "El software de billetera gestiona llaves privadas y politica de firmado; el bitcoin en si permanece on-chain como salidas gastables.",
    story:
      "Un usuario pierde un telefono y entra en panico pensando que su bitcoin se fue con el dispositivo. La correccion crucial es que las monedas nunca estan dentro del equipo. La wallet guarda secretos y metadatos que prueban la autoridad de gasto sobre outputs on-chain. Si las llaves estan respaldadas de forma segura, los fondos siguen siendo recuperables desde cualquier software compatible. Si las llaves se filtran, un atacante puede gastar sin importar la app original. Este marco cambia el comportamiento: los usuarios priorizan la integridad del backup de la seed, el aislamiento de hardware y la verificacion de transacciones. Raw Block refuerza el modelo operativo para que los alumnos separen conveniencia de UI de seguridad real de custodia.",
    deepDive: [
      {
        heading: "Modelo de custodia",
        bullets: [
          "Llaves privadas y descriptores definen autoridad de gasto, no ubicacion de monedas.",
          "La calidad del backup de la seed phrase determina la seguridad de recuperacion.",
          "Las politicas multisig distribuyen riesgo de compromiso entre dispositivos/partes.",
        ],
      },
      {
        heading: "Modos de falla",
        bullets: [
          "Phishing y malware de portapapeles pueden redirigir pagos firmados.",
          "Flujos de recuperacion no verificados pueden exponer seed phrases a atacantes.",
          "Un mismatch de direccion durante el envio es un riesgo comun de capa humana.",
        ],
      },
    ],
    keyTakeaways: [
      "Las wallets son gestoras de llaves, no contenedores de monedas.",
      "Backups y aislamiento de llaves son controles de seguridad primarios.",
      "La autoridad de gasto sigue a las llaves, no a los dispositivos.",
    ],
    realData: [
      {
        key: "lastUpdated",
        label: "Snapshot de Seguridad de Wallet",
        description: "Timestamp que indica frescura del contexto de red para decisiones de gestion de llaves.",
        display: "Date/time",
      },
      {
        key: "feeHour",
        label: "Contexto de Fee de Consolidacion",
        description: "Util para planificar transacciones seguras de mantenimiento de wallet.",
        display: "sat/vB",
      },
    ],
    securityNotes: [
      "La exposicion de una seed phrase equivale a perdida total de custodia.",
      "Las pantallas de firmado y verificacion en hardware reducen riesgo de malware.",
    ],
    linkedVulnerabilities: [],
    linkedAttacks: ["address-reuse"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "Los defaults de wallet (manejo de change, flags RBF, timing de consolidacion) son decisiones de politica.",
      "La politica de retiros custodiados puede exponer huellas de comportamiento.",
    ],
    consensusRules: [
      "Solo firmas/scripts validos desbloquean condiciones de gasto.",
      "El consenso rastrea outputs y estado de gasto independientemente del estado de la app wallet.",
    ],
    policyVsConsensusExplanation:
      "El consenso decide si un gasto firmado es valido; la politica de wallet decide como y cuando se producen firmas.",
    caseStudies: [
      {
        title: "Exchange Withdrawal Clustering",
        year: 2021,
        summary:
          "Las politicas operativas de wallet en exchanges suelen crear patrones de transaccion identificables.",
      },
    ],
    explorerDeepLinks: [
      { label: "Guia de Wallets", url: "https://developer.bitcoin.org/devguide/wallets.html" },
      { label: "Raw Block Key Lab", url: "https://www.rawblock.net/lab/keys" },
    ],
    claimSources: [
      {
        claim: "Las wallets gestionan llaves privadas que controlan UTXOs.",
        sources: [
          {
            title: "Developer Guide Wallets",
            url: "https://developer.bitcoin.org/devguide/wallets.html",
            type: "dev-guide",
          },
          {
            title: "BIP 32",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki",
            type: "BIP",
          },
        ],
      },
      {
        claim: "La perdida de llaves, y no los binarios de la app, determina la perdida de custodia.",
        sources: [
          {
            title: "BIP 39",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
            type: "BIP",
          },
          {
            title: "Bitcoin Optech wallet guidance",
            url: "https://bitcoinops.org/en/topics/wallets/",
            type: "reference",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 32", url: "https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki" },
      { title: "BIP 39", url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "address-vs-public-key",
    title: "Dirección vs Clave Pública",
    type: "primitive",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Las direcciones son destinos de script codificados, mientras que las claves publicas son primitivas criptograficas usadas para verificar firmas.",
    story:
      "Un principiante copia una direccion y asume que es lo mismo que una clave publica. En tipos de script legacy y modernos, ese atajo falla. Las direcciones son codificaciones legibles de plantillas de script o hashes de llave. Las claves publicas son puntos criptograficos usados en verificaciones de firma. Con SegWit y Taproot, esta distincion se volvio aun mas importante porque los formatos de direccion señalan semantica de gasto y protecciones de checksum. Entender esto ayuda a evitar errores de compatibilidad, comprender por que algunos outputs revelan llaves solo al gastar y apreciar por que el parseo de direcciones no es solo formato cosmetico.",
    deepDive: [
      {
        heading: "Capas de codificacion",
        bullets: [
          "Base58 y Bech32/Bech32m codifican datos de destino con checksums.",
          "Las direcciones suelen representar hashes o scripts, no claves publicas crudas.",
          "El tipo de output determina la estructura witness y el comportamiento de rutas de gasto.",
        ],
      },
      {
        heading: "Implicancias de seguridad",
        bullets: [
          "Los errores de checksum de direccion capturan muchos errores de copiar/pegar.",
          "Interpretar mal el tipo de direccion puede causar problemas de interoperabilidad entre wallets.",
          "La semantica key-path y script-path de Taproot requiere manejo correcto de bech32m.",
        ],
      },
    ],
    keyTakeaways: [
      "Direccion != clave publica en el uso moderno de Bitcoin.",
      "El formato de direccion transmite semantica de script y modelo de checksum.",
      "Los upgrades SegWit/Taproot cambiaron expectativas de codificacion de destino.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Epoca Actual de Formato",
        description: "Contexto de altura para patrones modernos de adopcion de direcciones.",
        display: "Height",
      },
      {
        key: "lastUpdated",
        label: "Snapshot de Parseo de Direcciones",
        description: "Timestamp del ultimo contexto de estado del protocolo mostrado en Raw Block.",
        display: "Date/time",
      },
    ],
    securityNotes: [
      "La validacion de checksum reduce corrupcion accidental de direcciones.",
      "La confusion de tipos puede causar envios fallidos o scripts de gasto incompatibles.",
    ],
    linkedVulnerabilities: ["malleability-pre-segwit"],
    linkedAttacks: [],
    linkedAssumptions: ["sha256-preimage-resistance-assumption"],
    policyRules: [
      "La politica de wallet puede restringir plantillas de direccion/script no soportadas.",
      "La politica de exchanges puede limitar retiros a tipos de destino seleccionados.",
    ],
    consensusRules: [
      "El consenso valida ejecucion de scripts independientemente de la etiqueta de direccion visible al usuario.",
      "Las reglas witness y de script imponen correccion de ruta de gasto por tipo de output.",
    ],
    policyVsConsensusExplanation:
      "El consenso valida scripts y firmas; las capas de politica/UI mapean direcciones legibles por humanos a esos objetos de consenso.",
    caseStudies: [
      {
        title: "Bech32m Deployment for Taproot",
        year: 2021,
        summary:
          "Se requirieron actualizaciones de parseo de direcciones para soportar de forma segura outputs Taproot y evitar fallos accidentales de envio.",
      },
    ],
    explorerDeepLinks: [
      { label: "Referencia de Formato de Direccion", url: "https://en.bitcoin.it/wiki/Bech32" },
      { label: "Raw Block Decoder", url: "https://www.rawblock.net/explorer/decoder" },
    ],
    claimSources: [
      {
        claim: "Bech32 y bech32m definen codificaciones modernas de direcciones para SegWit y Taproot.",
        sources: [
          { title: "BIP 173", url: "https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki", type: "BIP" },
          { title: "BIP 350", url: "https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki", type: "BIP" },
        ],
      },
      {
        claim: "Las direcciones codifican destinos de script y no siempre son claves publicas crudas.",
        sources: [
          {
            title: "Developer Guide Addresses",
            url: "https://developer.bitcoin.org/devguide/transactions.html#p2pkh-script-validation",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Wiki technical background",
            url: "https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses",
            type: "reference",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 173", url: "https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki" },
      { title: "BIP 350", url: "https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "lightning-network-maturity",
    title: "Madurez de la Lightning Network",
    type: "mechanism",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations", "lightning-primer"],
    summary:
      "Lightning se usa ampliamente en produccion para pagos rapidos y de bajo costo, con trade-offs operativos importantes frente a la liquidacion directa en capa base.",
    story:
      "Las primeras discusiones sobre Lightning llamaban a la red experimental. Hoy el uso es materialmente mas amplio: grandes exchanges y proveedores de pago enrutan trafico relevante por Lightning por velocidad y eficiencia de costos en flujos de pago adecuados. Los usuarios ahora esperan una UX casi instantanea para muchas transferencias pequenas y medianas, mientras siguen confiando en Bitcoin de capa base para garantias de liquidacion final y movimientos de valor muy grandes. El cambio de madurez no trata de eliminar trade-offs; trata de gestionarlos. La liquidez de canales, la confiabilidad de ruteo, el soporte de watchtowers y las condiciones de fee de cierre importan para un uso seguro. Raw Block presenta Lightning como infraestructura de produccion ampliamente usada que aun requiere operaciones disciplinadas.",
    deepDive: [
      {
        heading: "Por que Lightning ahora",
        bullets: [
          "Canales off-chain reducen la huella on-chain para flujos de pago repetidos.",
          "La madurez de la red de ruteo habilita uso practico en comercios y exchanges.",
          "Las herramientas operativas mejoraron monitoreo de canales y confiabilidad movil.",
        ],
      },
      {
        heading: "Compensaciones de seguridad",
        bullets: [
          "Los usuarios intercambian finalidad inmediata de capa base por velocidad y costo.",
          "Gestion de liquidez, disponibilidad de rutas y postura online/watchtower afectan directamente la confiabilidad.",
          "Cierres forzados y salidas unilaterales pueden volverse caros durante periodos de fees on-chain altos.",
          "Liquidaciones estrategicas grandes pueden seguir prefiriendo profundidad de confirmacion on-chain directa.",
        ],
      },
    ],
    keyTakeaways: [
      "Lightning se usa ampliamente en produccion, con trade-offs operativos importantes.",
      "Mejor encaje: pagos pequenos/medianos de alta frecuencia.",
      "Usa watchtowers, gestion de liquidez y planificacion de fees de cierre para operar con mas seguridad.",
    ],
    realData: [
      {
        key: "feeFast",
        label: "Fee Rapido On-chain",
        description: "El contexto de fee de capa base ayuda a comparar liquidacion directa vs uso de canales.",
        display: "sat/vB",
      },
      {
        key: "feeHour",
        label: "Fee Economico On-chain",
        description: "Muestra el diferencial de costo que suele motivar el uso de Lightning.",
        display: "sat/vB",
      },
    ],
    securityNotes: [
      "Contrapartes de canal y rutas introducen restricciones de liquidez, ruteo y disponibilidad online.",
      "Los servicios de watchtower mitigan requisitos de monitoreo para usuarios offline, pero no eliminan todo el riesgo operativo.",
      "Durante picos de fees, transacciones de forced-close y sweep pueden elevar materialmente costos operativos y riesgo de falla.",
    ],
    linkedVulnerabilities: [],
    linkedAttacks: ["lightning-channel-jamming", "lightning-probing", "lightning-pinning-fee-griefing"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "Ruteo, politica de fees y estrategia de apertura/cierre de canales son decisiones de politica a nivel de implementacion.",
      "Proveedores de servicio pueden imponer liquidez entrante y minimos de canal.",
    ],
    consensusRules: [
      "Lightning finalmente liquida mediante transacciones Bitcoin validas bajo consenso de capa 1.",
      "Transacciones de penalty y timeout dependen de la validez de scripts en capa base.",
    ],
    policyVsConsensusExplanation:
      "Las operaciones de Lightning son ricas en politica en capa 2, pero heredan validez final y resolucion de disputas del consenso de Bitcoin.",
    caseStudies: [
      {
        title: "Exchange Lightning Integrations 2023-2025",
        year: 2025,
        summary:
          "Grandes exchanges agregaron soporte Lightning, moviendo su uso desde la experimentacion de nicho hacia un rail de pagos masivo.",
      },
    ],
    explorerDeepLinks: [
      { label: "Mapa de Canales Lightning", url: "https://mempool.space/lightning" },
      { label: "Especificacion BOLTs", url: "https://github.com/lightning/bolts" },
    ],
    claimSources: [
      {
        claim: "Lightning se usa ampliamente en produccion por grandes exchanges/proveedores para flujos de pago adecuados, con trade-offs operativos claros.",
        sources: [
          { title: "Coinbase Lightning launch", url: "https://www.coinbase.com/blog/lightning-payments-now-available-on-coinbase", type: "reference" },
          { title: "Kraken Lightning support", url: "https://support.kraken.com/hc/en-us/articles/5068216131988-Lightning-Network-on-Kraken", type: "reference" },
        ],
      },
      {
        claim: "La seguridad de Lightning depende del monitoreo de canales y de mecanismos de disputa con timelocks.",
        sources: [
          { title: "Lightning BOLTs", url: "https://github.com/lightning/bolts", type: "reference" },
          { title: "BIP 65 CHECKLOCKTIMEVERIFY", url: "https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki", type: "BIP" },
        ],
      },
    ],
    furtherReading: [
      { title: "Lightning BOLTs", url: "https://github.com/lightning/bolts" },
      { title: "Mastering Lightning", url: "https://github.com/lnbook/lnbook" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "segwit-and-taproot-upgrades",
    title: "Actualizaciones SegWit y Taproot",
    type: "upgrade",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "SegWit y Taproot son actualizaciones soft-fork importantes que mejoraron resistencia a maleabilidad, eficiencia y flexibilidad de scripts/firmas.",
    story:
      "La evolucion del protocolo en Bitcoin es lenta por diseño. SegWit en 2017 y Taproot en 2021 son ejemplos de upgrades cautelosos que ampliaron capacidades sin romper garantias monetarias centrales. SegWit separo datos witness y corrigio problemas de maleabilidad que bloqueaban diseños robustos de segunda capa. Taproot agrego firmas Schnorr y rutas de gasto mas eficientes, mejorando privacidad y ergonomia multisig en casos comunes. Para quien aprende, la idea clave es que Bitcoin si evoluciona, pero mediante revision conservadora, despliegue de soft forks y coordinacion amplia del ecosistema. Raw Block presenta los upgrades como trabajo de continuidad: fortalecer fundamentos preservando compatibilidad hacia atras e integridad de reglas.",
    deepDive: [
      {
        heading: "Impacto de SegWit",
        bullets: [
          "Redujo la superficie de maleabilidad para protocolos dependientes de txid.",
          "El accounting por weight mejoro la gestion efectiva de capacidad de bloque.",
          "Habilito diseño de transacciones Lightning mas robusto.",
        ],
      },
      {
        heading: "Impacto de Taproot",
        bullets: [
          "Las firmas Schnorr mejoraron opciones de agregacion de llaves multisig.",
          "Los gastos por key-path hacen que scripts comunes se vean mas simples on-chain.",
          "Tapscript expandio la flexibilidad de futuros upgrades de script.",
        ],
      },
    ],
    keyTakeaways: [
      "Los upgrades de Bitcoin son conservadores y enfocados en compatibilidad.",
      "SegWit y Taproot abordaron restricciones tecnicas reales.",
      "La adopcion de upgrades es observable en datos vivos de cadena.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Altura de Era de Upgrade",
        description: "Da contexto para ventanas de adopcion post-SegWit y post-Taproot.",
        display: "Height",
      },
      {
        key: "lastUpdated",
        label: "Hora del Snapshot de Adopcion",
        description: "Timestamp del contexto de red mostrado actualmente.",
        display: "Date/time",
      },
    ],
    securityNotes: [
      "La activacion de soft forks requiere despliegue cuidadoso y preparacion del ecosistema.",
      "Interpretar mal la semantica witness/tapscript puede crear bugs de implementacion en wallets.",
    ],
    linkedVulnerabilities: ["malleability-pre-segwit"],
    linkedAttacks: [],
    linkedAssumptions: ["sha256-preimage-resistance-assumption"],
    policyRules: [
      "La politica del nodo puede influir el relay de formas de script nuevas durante fases tempranas de adopcion.",
      "La politica de wallet gobierna si tipos de output nuevos se usan por defecto.",
    ],
    consensusRules: [
      "Las reglas witness de SegWit y de script de Taproot son validadas por consenso una vez activadas.",
      "La activacion preservo compatibilidad hacia atras mediante restricciones de soft fork.",
    ],
    policyVsConsensusExplanation:
      "La activacion y la validez de scripts son temas de consenso; defaults de rollout y comportamiento de wallets son decisiones de politica y producto.",
    caseStudies: [
      {
        title: "SegWit Activation",
        year: 2017,
        summary:
          "SegWit resolvio bloqueos por maleabilidad de transacciones e introdujo accounting de capacidad basado en weight.",
      },
      {
        title: "Taproot Activation",
        year: 2021,
        summary:
          "Taproot introdujo firmas Schnorr y upgrades de script preservando compatibilidad.",
      },
    ],
    explorerDeepLinks: [
      { label: "Grafico de Adopcion de SegWit", url: "https://mempool.space/graphs/bitcoin/segwit" },
      { label: "Grafico de Taproot", url: "https://mempool.space/graphs/bitcoin/taproot" },
    ],
    claimSources: [
      {
        claim: "SegWit introdujo separacion de witness y abordo vectores de maleabilidad.",
        sources: [
          { title: "BIP 141", url: "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki", type: "BIP" },
          { title: "BIP 143", url: "https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki", type: "BIP" },
        ],
      },
      {
        claim: "Taproot introdujo firmas Schnorr y semantica de tapscript.",
        sources: [
          { title: "BIP 340", url: "https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki", type: "BIP" },
          { title: "BIP 341", url: "https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki", type: "BIP" },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 141", url: "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki" },
      { title: "BIP 342", url: "https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "blocks",
    title: "Bloques (Ancla de Lección)",
    type: "primitive",
    difficulty: 1,
    canonicalLesson: "blocks",
    pathMappings: ["canonical-lessons"],
    summary: "Ancla de lección para estructura de bloques en el recorrido guiado de 8 pasos.",
    story:
      "Esta ancla de lección conecta el recorrido guiado de inicio con el nodo de concepto detallado de bloques y encabezados. Mantiene la continuidad del progreso sin perder enlaces profundos al protocolo.",
    deepDive: [
      { heading: "Ancla", bullets: ["Usa blocks-and-headers para el detalle completo.", "Mantiene la identidad de la lección para sincronizar progreso."] },
      { heading: "Navegacion", bullets: ["El modo guiado usa este id de lección.", "La Academia redirige al contenido canonico del concepto."] },
    ],
    keyTakeaways: ["Nodo ancla para mapear progreso", "Usa el nodo detallado para el contenido completo", "Sin divergencia de protocolo"],
    realData: [
      { key: "blockHeight", label: "Altura", description: "Altura actual", display: "int" },
      { key: "lastUpdated", label: "Actualizado", description: "hora del snapshot", display: "time" },
    ],
    securityNotes: ["Solo ancla", "Ver blocks-and-headers para detalles de seguridad sustantivos"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["El ancla usa mapeo de política del modo guiado para una progresión estable."],
    consensusRules: ["El ancla referencia el contenido de consenso en el nodo blocks-and-headers."],
    policyVsConsensusExplanation: "Esta ancla delega el detalle completo de política vs consenso a su nodo de concepto mapeado.",
    caseStudies: [{ title: "Ancla", year: 2026, summary: "Mapeo de ancla para continuidad de la lección." }],
    explorerDeepLinks: [{ label: "Blocks", url: "https://mempool.space/blocks" }],
    claimSources: [
      {
        claim: "Las anclas de lección mantienen el progreso alineado con el grafo de conceptos.",
        sources: [
          { title: "Raw Block path engine", url: "https://www.rawblock.net/academy", type: "reference" },
          { title: "Raw Block guided mode", url: "https://www.rawblock.net/", type: "reference" },
        ],
      },
      {
        claim: "La mecánica detallada de bloques vive en el nodo blocks-and-headers.",
        sources: [
          { title: "Developer block reference", url: "https://developer.bitcoin.org/reference/block_chain.html", type: "dev-guide" },
          { title: "Bitcoin whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
        ],
      },
    ],
    furtherReading: [
      { title: "Academy", url: "https://www.rawblock.net/academy" },
      { title: "Blocks", url: "https://mempool.space/blocks" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "mining",
    title: "Minería (Ancla de Lección)",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "mining",
    pathMappings: ["canonical-lessons"],
    summary: "Ancla de lección para minería en modo guiado, mapeada al contenido de mineria-y-subsidio.",
    story:
      "Esta ancla de lección existe para indexar lecciones de forma limpia en el recorrido inicial, mientras la teoria detallada y los casos quedan en mining-and-subsidy.",
    deepDive: [
      { heading: "Ancla", bullets: ["Usa mining-and-subsidy para profundidad de protocolo.", "Mantiene estable el progreso del inicio."] },
      { heading: "Navegacion", bullets: ["El ancla mapea id de lección a id de concepto.", "Evita romper claves de progreso antiguas."] },
    ],
    keyTakeaways: ["Nodo ancla", "Contenido completo en el nodo de concepto", "Mapeo seguro para el progreso"],
    realData: [
      { key: "hashrateEh", label: "Hashrate", description: "Hashrate actual", display: "EH/s" },
      { key: "blocksUntilHalving", label: "Bloques para el halving", description: "Cuenta regresiva de la epoca", display: "count" },
    ],
    securityNotes: ["Solo ancla", "Ver mining-and-subsidy para detalles"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["El ancla preserva el mapeo de política de la lección de minería en modo guiado."],
    consensusRules: ["El ancla referencia restricciones de consenso en el contenido mining-and-subsidy."],
    policyVsConsensusExplanation: "Esta ancla delega las distinciones de protocolo al nodo de concepto de minería mapeado.",
    caseStudies: [{ title: "Ancla", year: 2026, summary: "Soporte de mapeo de lección." }],
    explorerDeepLinks: [{ label: "Mining", url: "https://mempool.space/mining" }],
    claimSources: [
      {
        claim: "Las anclas de lección mantienen la continuidad de la progresión.",
        sources: [
          { title: "Raw Block home", url: "https://www.rawblock.net/", type: "reference" },
          { title: "Raw Block paths", url: "https://www.rawblock.net/paths/bitcoin-foundations", type: "reference" },
        ],
      },
      {
        claim: "Los detalles de minería están disponibles en el nodo de concepto mapeado.",
        sources: [
          { title: "Developer PoW guide", url: "https://developer.bitcoin.org/devguide/block_chain.html", type: "dev-guide" },
          { title: "Bitcoin whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
        ],
      },
    ],
    furtherReading: [
      { title: "Raw Block mining simulator", url: "https://www.rawblock.net/game/mining" },
      { title: "Mempool mining dashboard", url: "https://mempool.space/mining" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "difficulty",
    title: "Dificultad (Ancla de Lección)",
    type: "rule",
    difficulty: 1,
    canonicalLesson: "difficulty",
    pathMappings: ["canonical-lessons"],
    summary: "Ancla de lección para dificultad, mapeada al contenido de ajuste-de-dificultad-2016.",
    story:
      "El ancla de lección mantiene simple el recorrido guiado mientras el nodo de concepto entrega detalles rigurosos del ajuste y contexto de incidentes.",
    deepDive: [
      { heading: "Ancla", bullets: ["Contenido detallado en difficulty-adjustment-2016.", "Compatibilidad del modo guiado preservada."] },
      { heading: "Continuidad", bullets: ["Clave de lección estable para progreso local.", "Evita friccion de migracion para usuarios."] },
    ],
    keyTakeaways: ["Nodo ancla", "Mapea al concepto completo", "Id amigable para progreso"],
    realData: [
      { key: "hashrateEh", label: "Hashrate", description: "contexto del ajuste", display: "EH/s" },
      { key: "blockHeight", label: "Altura", description: "contexto de epoca", display: "count" },
    ],
    securityNotes: ["Solo ancla", "Ver concepto mapeado para detalles"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["El ancla preserva el mapeo de política de la lección de dificultad para la progresión."],
    consensusRules: ["El ancla referencia la logica de ajuste de consenso en el concepto mapeado."],
    policyVsConsensusExplanation: "Esta ancla delega el tratamiento completo de política vs consenso al contenido de dificultad.",
    caseStudies: [{ title: "Ancla", year: 2026, summary: "Soporte de mapeo de lección." }],
    explorerDeepLinks: [{ label: "Difficulty graph", url: "https://mempool.space/graphs/mining/difficulty-adjustment" }],
    claimSources: [
      {
        claim: "Las anclas de lección proveen claves de progresión estables.",
        sources: [
          { title: "Raw Block home", url: "https://www.rawblock.net/", type: "reference" },
          { title: "Raw Block academy", url: "https://www.rawblock.net/academy", type: "reference" },
        ],
      },
      {
        claim: "Los detalles de dificultad permanecen en el nodo de concepto dedicado.",
        sources: [
          { title: "Bitcoin Wiki Difficulty", url: "https://en.bitcoin.it/wiki/Difficulty", type: "reference" },
          { title: "pow.cpp", url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp", type: "core-docs" },
        ],
      },
    ],
    furtherReading: [
      { title: "Difficulty wiki", url: "https://en.bitcoin.it/wiki/Difficulty" },
      { title: "pow.cpp", url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "consensus",
    title: "Consenso (Ancla de Lección)",
    type: "rule",
    difficulty: 1,
    canonicalLesson: "consensus",
    pathMappings: ["canonical-lessons"],
    summary: "Ancla de lección para consenso, mapeada al contenido detallado de reglas-de-consenso-vs-politica.",
    story:
      "Esta ancla mantiene la semantica de la lección guiada simple y estable, mientras las distinciones profundas entre consenso y política viven en el nodo de concepto dedicado.",
    deepDive: [
      { heading: "Ancla", bullets: ["Mapea a consensus-rules-vs-policy.", "Conserva un id de lección estable."] },
      { heading: "Experiencia", bullets: ["El recorrido inicial se mantiene lineal.", "La Academia conserva profundidad tecnica."] },
    ],
    keyTakeaways: ["Nodo ancla", "Contenido detallado en otro lugar", "Progreso estable"],
    realData: [
      { key: "feeFast", label: "Presion de politica", description: "contexto de relay", display: "sat/vB" },
      { key: "lastUpdated", label: "Snapshot", description: "valor de timestamp en formato ISO", display: "time" },
    ],
    securityNotes: ["Solo ancla", "Ver concepto mapeado para detalles"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["El ancla mantiene estable el enlace de política de la lección de consenso."],
    consensusRules: ["El ancla referencia el detalle de reglas de consenso en el contenido del concepto mapeado."],
    policyVsConsensusExplanation: "Esta ancla delega el detalle de la distincion operativa al nodo consensus-rules-vs-policy.",
    caseStudies: [{ title: "Ancla", year: 2026, summary: "Soporte de mapeo de lección." }],
    explorerDeepLinks: [{ label: "Docs de Politica", url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy" }],
    claimSources: [
      {
        claim: "Las anclas mantienen estables los ids de lección en la progresión guiada.",
        sources: [
          { title: "Raw Block home", url: "https://www.rawblock.net/", type: "reference" },
          { title: "Raw Block paths", url: "https://www.rawblock.net/paths/bitcoin-foundations", type: "reference" },
        ],
      },
      {
        claim: "La separacion entre consenso y política se maneja en el nodo de concepto.",
        sources: [
          { title: "consensus.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h", type: "core-docs" },
          { title: "policy.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.h", type: "core-docs" },
        ],
      },
    ],
    furtherReading: [
      { title: "consensus.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h" },
      { title: "policy.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.h" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "security-and-attacks",
    title: "Seguridad y Ataques (Ancla de Lección)",
    type: "attack",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["canonical-lessons"],
    summary: "Ancla de lección que agrupa el módulo de seguridad y enlaza a investigaciones de vulnerabilidades, ataques y supuestos.",
    story:
      "El recorrido guiado termina con seguridad y ataques porque aqui convergen todos los temas previos. Esta ancla conecta la tarjeta de la lección con la capa de investigacion profunda para que el usuario pase de fundamentos a pensamiento adversarial sin perder continuidad de progreso.",
    deepDive: [
      {
        heading: "Cobertura",
        bullets: [
          "Enlaza al registro de vulnerabilidades, modelos de ataque y capas de supuestos.",
          "Conecta el marco de política vs consenso con incidentes reales.",
        ],
      },
      {
        heading: "Objetivo",
        bullets: [
          "Ayudar a evaluar riesgo con terminologia nativa del protocolo.",
          "Conectar conceptos de la Academia con paginas de investigacion y casos historicos.",
        ],
      },
    ],
    keyTakeaways: [
      "El aprendizaje de seguridad es acumulativo a lo largo de todas las lecciones.",
      "Las paginas de investigacion aportan detalle a nivel de incidente.",
      "Los supuestos definen que debe mantenerse cierto para las garantias de seguridad.",
    ],
    realData: [
      { key: "hashrateEh", label: "Hashrate", description: "contexto de costo de ataque", display: "EH/s" },
      { key: "feeFast", label: "Presion de fee", description: "contexto de estres de mempool", display: "sat/vB" },
    ],
    securityNotes: [
      "El analisis de amenazas debe separar capacidad, costo y detectabilidad.",
      "La postura defensiva depende de la profundidad de confirmacion y de controles operativos.",
    ],
    linkedVulnerabilities: ["value-overflow-2010", "cve-2018-17144"],
    linkedAttacks: ["double-spend", "attack-51-percent", "selfish-mining"],
    linkedAssumptions: ["hashpower-majority-assumption", "independent-validation-assumption"],
    policyRules: [
      "La politica endurece el comportamiento de mempool y relay frente a patrones de abuso.",
      "Una mala configuracion de politica puede crear exposicion local sin riesgo de fork global.",
    ],
    consensusRules: [
      "Los bugs de consenso pueden amenazar la seguridad contra inflacion o el acuerdo de cadena.",
      "La validacion de consenso es la frontera final de seguridad para cada nodo completo.",
    ],
    policyVsConsensusExplanation:
      "Los incidentes de seguridad suelen comenzar en capas de politica o implementacion, pero se vuelven sistemicos solo cuando se afecta la integridad del consenso.",
    caseStudies: [
      {
        title: "CVE-2018-17144",
        year: 2018,
        summary:
          "Riesgo critico de inflacion/consenso que reforzo la importancia de una disciplina rigurosa de releases y revision.",
      },
    ],
    explorerDeepLinks: [
      { label: "Investigacion de Vulnerabilidades", url: "https://www.rawblock.net/research/vulnerabilities" },
      { label: "Investigacion de Ataques", url: "https://www.rawblock.net/research/attacks" },
    ],
    claimSources: [
      {
        claim: "La seguridad de Bitcoin depende de la integridad del consenso y del costo economico de ataque.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          { title: "Developer block chain guide", url: "https://developer.bitcoin.org/devguide/block_chain.html", type: "dev-guide" },
        ],
      },
      {
        claim: "Los bugs y ataques historicos informan la estrategia moderna de endurecimiento.",
        sources: [
          { title: "CVE-2018-17144 notice", url: "https://bitcoincore.org/en/2018/09/20/notice/", type: "core-docs" },
          { title: "Bitcoin Optech topics", url: "https://bitcoinops.org/en/topics/", type: "reference" },
        ],
      },
    ],
    furtherReading: [
      { title: "Raw Block Research", url: "https://www.rawblock.net/research" },
      { title: "Bitcoin Ops Security Topics", url: "https://bitcoinops.org/en/topics/" },
    ],
    verifiedAt: "2026-02-12",
  },
];

export type ScriptConsensusFixture = {
  id: string;
  name: string;
  category:
    | "p2pkh"
    | "p2pk"
    | "p2sh"
    | "p2wpkh"
    | "p2sh-p2wpkh"
    | "p2wsh"
    | "taproot"
    | "opreturn"
    | "cltv"
    | "csv"
    | "sighash";
  objective: string;
  notes: string;
  scriptSig: string;
  scriptPubKey: string;
  scriptSigFormat: "asm";
  scriptPubKeyFormat: "asm";
  txHex: string;
  inputIndex: number;
  satoshis: number;
  witness: string[];
  expectedVerified: boolean;
  expectedError: string | null;
  traceScript?: string;
  traceInitialStack?: string[];
};

export const SCRIPT_CONSENSUS_FIXTURES: ScriptConsensusFixture[] = [
  {
    id: "p2pkh-valid",
    name: "P2PKH CHECKSIG (valid)",
    category: "p2pkh",
    objective: "Validate legacy P2PKH spend.",
    notes: "DER signature + compressed pubkey.",
    scriptSig:
      "3044022033a41c3a8314c76f24a05fb5f5b6726a880e05ee61d4add47d9891b33a7ccbc702201bd07e7f8827f99b9f9d692f1ea1553a23ab4e7ee571b2e1524de54493b82b7c01 034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa",
    scriptPubKey:
      "OP_DUP OP_HASH160 fc7250a211deddc70ee5a2738de5f07817351cef OP_EQUALVERIFY OP_CHECKSIG",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa000000006a473044022033a41c3a8314c76f24a05fb5f5b6726a880e05ee61d4add47d9891b33a7ccbc702201bd07e7f8827f99b9f9d692f1ea1553a23ab4e7ee571b2e1524de54493b82b7c0121034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aaffffffff01b0ad0100000000001976a914531260aa2a199e228c537dfa42c82bea2c7c1f4d88ac00000000",
    inputIndex: 0,
    satoshis: 120000,
    witness: [],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "p2pk-valid",
    name: "P2PK CHECKSIG (valid)",
    category: "p2pk",
    objective: "Validate bare public-key script spend.",
    notes: "Legacy P2PK output with signature-only scriptSig.",
    scriptSig:
      "3044022038a1607582bced8aad85f4ecb8ae9eef03ac13fa5e09280d527e40fff67e3ccb0220749137ca8deef0b94cb796642bde9fb97e116dcfd637cd17bf00c871eb1761d101",
    scriptPubKey:
      "034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa OP_CHECKSIG",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd0000000048473044022038a1607582bced8aad85f4ecb8ae9eef03ac13fa5e09280d527e40fff67e3ccb0220749137ca8deef0b94cb796642bde9fb97e116dcfd637cd17bf00c871eb1761d101ffffffff01c0d40100000000001976a914e73b9a69c634548563f4c72f76a4e2109461ff5b88ac00000000",
    inputIndex: 0,
    satoshis: 130000,
    witness: [],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "p2sh-multisig-2of3-valid",
    name: "P2SH 2-of-3 multisig (valid)",
    category: "p2sh",
    objective: "Validate P2SH multisig scriptSig evaluation.",
    notes: "Two signatures provided for a 2-of-3 redeem script.",
    scriptSig:
      "0 3044022029ad220a54ab7b5749317af54c02bf808cff46f07aff18c3335cd53ec076c61b022077c12ceafb8f940672ea2c7803db566a414f1c2ec84d4f8fc0504f5bafc6956601 304402204535ab2e9dec996918bcbf7baa5187150ec301032154ff5524ead440336fd1da02202608193ee63ad133ecbc10f28b249a72bb6af1f82611162ed7b731852fd524df01 5221028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f72102466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f272103e11f40af6b41f494bfbc27c47a178ce572e8b8ca687cc67e1298514861ac5e4853ae",
    scriptPubKey:
      "OP_HASH160 f5caa030f6e7bb4bc214da899accba4ae8df5442 OP_EQUAL",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee01000000fc00473044022029ad220a54ab7b5749317af54c02bf808cff46f07aff18c3335cd53ec076c61b022077c12ceafb8f940672ea2c7803db566a414f1c2ec84d4f8fc0504f5bafc695660147304402204535ab2e9dec996918bcbf7baa5187150ec301032154ff5524ead440336fd1da02202608193ee63ad133ecbc10f28b249a72bb6af1f82611162ed7b731852fd524df014c695221028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f72102466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f272103e11f40af6b41f494bfbc27c47a178ce572e8b8ca687cc67e1298514861ac5e4853aeffffffff0160de0200000000001976a91420cad328524786dff54d7614f174bea394832c7588ac00000000",
    inputIndex: 0,
    satoshis: 200000,
    witness: [],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "p2sh-multisig-2of3-missing-sig-fail",
    name: "P2SH 2-of-3 multisig missing signature (fail)",
    category: "p2sh",
    objective: "Show threshold failure with insufficient signatures.",
    notes: "Only one signature supplied for a 2-of-3 redeem script.",
    scriptSig:
      "0 3045022100a517bcc78eae6cc04cf42c67b15b65cf0410210e2e8767b671eb70bb202a0ff502207d9070bf6de9390e6fb1f0983800f27263ea740282d4aacc839b9863455a423501 5221036930f46dd0b16d866d59d1054aa63298b357499cd1862ef16f3f55f1cafceb82210290999dbbf43034bffb1dd53eac1eb4c33a4ea1c4f48ba585cfde3830840f055521023c72addb4fdf09af94f0c94d7fe92a386a7e70cf8a1d85916386bb2535c7b1b153ae",
    scriptPubKey:
      "OP_HASH160 4cb145e854412371ffbd0a282e8ff05af0236f29 OP_EQUAL",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01000000b500483045022100a517bcc78eae6cc04cf42c67b15b65cf0410210e2e8767b671eb70bb202a0ff502207d9070bf6de9390e6fb1f0983800f27263ea740282d4aacc839b9863455a4235014c695221036930f46dd0b16d866d59d1054aa63298b357499cd1862ef16f3f55f1cafceb82210290999dbbf43034bffb1dd53eac1eb4c33a4ea1c4f48ba585cfde3830840f055521023c72addb4fdf09af94f0c94d7fe92a386a7e70cf8a1d85916386bb2535c7b1b153aeffffffff0160de0200000000001976a9142ed5435d6f47740adfe824b7c6347720e4a8bc5d88ac00000000",
    inputIndex: 0,
    satoshis: 200000,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_INVALID_STACK_OPERATION",
  },
  {
    id: "p2wpkh-valid",
    name: "P2WPKH witness spend (valid)",
    category: "p2wpkh",
    objective: "Validate native segwit v0 key-hash spend.",
    notes: "Empty scriptSig; witness carries signature + pubkey.",
    scriptSig: "",
    scriptPubKey:
      "0 c53c82d3357f1f299330d585907b7c64b6b7a5f0",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000000010111111111111111111111111111111111111111111111111111111111111111110200000000ffffffff01d0fb0100000000001976a91414db4138d56a2ecfb10881a9be394d9f321985b288ac0247304402207054dbe98d9802ce1a97060c1971fe91f8b97860f1157b990c378a0f310cd9ba0220328831ab5893ca5002e0bf4632ea771ba156ffaa584d630baf18f0d52ad796fc012102eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f28368661900000000",
    inputIndex: 0,
    satoshis: 140000,
    witness: [
      "304402207054dbe98d9802ce1a97060c1971fe91f8b97860f1157b990c378a0f310cd9ba0220328831ab5893ca5002e0bf4632ea771ba156ffaa584d630baf18f0d52ad796fc01",
      "02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619",
    ],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "p2wpkh-missing-witness-fail",
    name: "P2WPKH missing witness (fail)",
    category: "p2wpkh",
    objective: "Show segwit failure when witness data is absent.",
    notes: "Same transaction context as valid P2WPKH but with empty witness.",
    scriptSig: "",
    scriptPubKey:
      "0 c0768e9f20309c2acf73cbb4cd1add0a1108c002",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000000010122222222222222222222222222222222222222222222222222222222222222220200000000ffffffff01d0fb0100000000001976a9149ca094c59d4dd4cf734b252e5ffad30060861fb788ac02483045022100b4b8737a4180225e48487ea55193100148d5e9c62e5cf5054c3668ec515ca1ac02202e820bade74fb1b63cfa89fdf5912f90a3d9c8af2545d28bbd075698917196af012103baf7689c0a3558fb604589036a8d1e4b685d909f6e0e2c6018a14049ae64ec2600000000",
    inputIndex: 0,
    satoshis: 140000,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_WITNESS_PROGRAM_MISMATCH",
  },
  {
    id: "p2sh-p2wpkh-valid",
    name: "P2SH-P2WPKH nested segwit (valid)",
    category: "p2sh-p2wpkh",
    objective: "Validate nested segwit redeem script + witness path.",
    notes: "scriptSig pushes redeem program; witness holds signature + pubkey.",
    scriptSig:
      "00147016cc099e003049b776999217a90b5d9030b9ab",
    scriptPubKey:
      "OP_HASH160 ba933b0fb896cfefbdb50edf0d9ba7c829543e9c OP_EQUAL",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "02000000000101333333333333333333333333333333333333333333333333333333333333333300000000171600147016cc099e003049b776999217a90b5d9030b9abffffffff01f81e0200000000001976a914eaafc63e264334c6b1fc0d94e17236e8336fd87188ac02483045022100edddeb475f22f44212c4d487a93fbc719fa5f25210b0d53ce4b9ceecbf0ee7ff02200351738a82be9d3a02bb07109eec344a1567692cadf0e9b99091356f6e28c47a012102e5a018b3a2e155316109d9cdc5eab739759c0e07e0c00bf9fccb8237fe4d7f0200000000",
    inputIndex: 0,
    satoshis: 150000,
    witness: [
      "3045022100edddeb475f22f44212c4d487a93fbc719fa5f25210b0d53ce4b9ceecbf0ee7ff02200351738a82be9d3a02bb07109eec344a1567692cadf0e9b99091356f6e28c47a01",
      "02e5a018b3a2e155316109d9cdc5eab739759c0e07e0c00bf9fccb8237fe4d7f02",
    ],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "p2wsh-optrue-valid",
    name: "P2WSH witness path OP_TRUE (valid)",
    category: "p2wsh",
    objective: "Validate segwit v0 script-hash witness execution.",
    notes: "Witness stack only contains serialized witness script OP_TRUE.",
    scriptSig: "",
    scriptPubKey:
      "0 4ae81572f06e1b88fd5ced7a1a000945432e83e1551e6f721ee9c00b8cc33260",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0100000000ffffffff01905f0100000000001976a9142eb0676badbe6b135933699a18bdfd18d1d98c7b88ac00000000",
    inputIndex: 0,
    satoshis: 100000,
    witness: ["51"],
    traceScript: "OP_TRUE",
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "p2wsh-multisig-2of2-valid",
    name: "P2WSH 2-of-2 multisig (valid)",
    category: "p2wsh",
    objective: "Validate native segwit multisig witness stack execution.",
    notes: "Witness includes dummy item, two signatures and witnessScript.",
    scriptSig: "",
    scriptPubKey:
      "0 434871078f359a314c7e4b010163e373d6e4b111e2605cbd8abbe1a44ed900f0",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000000010144444444444444444444444444444444444444444444444444444444444444440000000000ffffffff01b0240300000000001976a9143c8736f7eb322ca5bea463c4c802053956dd2e9d88ac040047304402203f86d0b793211612ea4d4774bf877ed81c42dd70593d7d7017a52afdb5a87195022074aa9509d806a7acfb58437211a46049daac20c4bdd8a88cb97a0f231861184501473044022034841babd1ce087a8b3182f24791221aa837397a749621dab064aa44eb6e5eb7022017ff20a703203bfa00ef84b4e265428690d4a66df4815aa3bcddaab45c7b046e014752210251b175b2b50a9e98520ed11777d0b3612761e279724bd2afa7b0b32f389c18e421037eff87ca3bb9f815f47e192641cad3aa58ed7343f67b835d735b28cec11a1bb452ae00000000",
    inputIndex: 0,
    satoshis: 220000,
    witness: [
      "EMPTY",
      "304402203f86d0b793211612ea4d4774bf877ed81c42dd70593d7d7017a52afdb5a87195022074aa9509d806a7acfb58437211a46049daac20c4bdd8a88cb97a0f231861184501",
      "3044022034841babd1ce087a8b3182f24791221aa837397a749621dab064aa44eb6e5eb7022017ff20a703203bfa00ef84b4e265428690d4a66df4815aa3bcddaab45c7b046e01",
      "52210251b175b2b50a9e98520ed11777d0b3612761e279724bd2afa7b0b32f389c18e421037eff87ca3bb9f815f47e192641cad3aa58ed7343f67b835d735b28cec11a1bb452ae",
    ],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "taproot-keypath-valid",
    name: "Taproot key-path Schnorr (valid)",
    category: "taproot",
    objective: "Validate segwit v1 key-path spend with Schnorr signature.",
    notes: "Witness stack contains one Schnorr signature.",
    scriptSig: "",
    scriptPubKey:
      "OP_1 6d26b82c3ea24ab4ed6cbc804c22337adccf0a953972b4ce12b3b7921a914530",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "02000000000101cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0200000000ffffffff01e0220200000000001976a91405b10a9db19226dca61d1d52925b25665661fc3788ac0140267005c5ab2977fd364d181a8143ee97cdd0062133113284d8887f50ecfef75684e675f79549f4fc6fcb4a0ffb695b859accfab6034805e27cfe0eec79396d5e00000000",
    inputIndex: 0,
    satoshis: 150000,
    witness: [
      "267005c5ab2977fd364d181a8143ee97cdd0062133113284d8887f50ecfef75684e675f79549f4fc6fcb4a0ffb695b859accfab6034805e27cfe0eec79396d5e",
    ],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "taproot-missing-witness-fail",
    name: "Taproot key-path missing witness (fail)",
    category: "taproot",
    objective: "Show taproot failure when witness signature is absent.",
    notes: "Uses a valid taproot spend tx context but clears witness stack.",
    scriptSig: "",
    scriptPubKey:
      "OP_1 340c02f493522d92c3bb4a8a1229752819db231d511d7b434b30133c37ddfbd5",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000000010155555555555555555555555555555555555555555555555555555555555555550200000000ffffffff01e0220200000000001976a91448e4f5970cb58b11a3af08a38127e84dd641b7ed88ac014002311701eeea882962c46ac51478ffe7d630ba97a528116d42e7edb483f57658bce1fb3b5814c641701bde766071d4b7ae7e24327d34bcd8e8fdde13cceda49600000000",
    inputIndex: 0,
    satoshis: 150000,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_WITNESS_PROGRAM_WITNESS_EMPTY",
  },
  {
    id: "taproot-scriptpath-invalid-control-fail",
    name: "Taproot script-path invalid control block (fail)",
    category: "taproot",
    objective: "Exercise script-path validation on malformed control blocks.",
    notes: "Witness provides tapscript + malformed control block to trigger taproot script-path checks.",
    scriptSig: "",
    scriptPubKey:
      "OP_1 340c02f493522d92c3bb4a8a1229752819db231d511d7b434b30133c37ddfbd5",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000000010155555555555555555555555555555555555555555555555555555555555555550200000000ffffffff01e0220200000000001976a91448e4f5970cb58b11a3af08a38127e84dd641b7ed88ac014002311701eeea882962c46ac51478ffe7d630ba97a528116d42e7edb483f57658bce1fb3b5814c641701bde766071d4b7ae7e24327d34bcd8e8fdde13cceda49600000000",
    inputIndex: 0,
    satoshis: 150000,
    witness: ["51", "c0"],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_TAPROOT_WRONG_CONTROL_SIZE",
  },
  {
    id: "cltv-pass-locktime-satisfied",
    name: "CLTV locktime satisfied (pass)",
    category: "cltv",
    objective: "Validate OP_CHECKLOCKTIMEVERIFY when tx locktime satisfies operand.",
    notes: "scriptPubKey pushes 500 and enforces CLTV; tx nLockTime is 500 and sequence is non-final.",
    scriptSig: "",
    scriptPubKey:
      "f401 OP_CHECKLOCKTIMEVERIFY OP_DROP OP_TRUE",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "020000000177777777777777777777777777777777777777777777777777777777777777770000000000feffffff01e8030000000000001976a914111111111111111111111111111111111111111188acf4010000",
    inputIndex: 0,
    satoshis: 1000,
    witness: [],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "cltv-fail-locktime-too-low",
    name: "CLTV locktime too low (fail)",
    category: "cltv",
    objective: "Show CLTV failure when tx locktime is below required operand.",
    notes: "Same script as CLTV pass fixture, but tx nLockTime is lower than operand 500.",
    scriptSig: "",
    scriptPubKey:
      "f401 OP_CHECKLOCKTIMEVERIFY OP_DROP OP_TRUE",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "020000000177777777777777777777777777777777777777777777777777777777777777770000000000feffffff01e8030000000000001976a914111111111111111111111111111111111111111188ac2c010000",
    inputIndex: 0,
    satoshis: 1000,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_UNSATISFIED_LOCKTIME",
  },
  {
    id: "csv-pass-sequence-satisfied",
    name: "CSV sequence satisfied (pass)",
    category: "csv",
    objective: "Validate OP_CHECKSEQUENCEVERIFY with a matching input sequence.",
    notes: "Operand is 2; tx input sequence is 2 and tx version is 2.",
    scriptSig: "",
    scriptPubKey:
      "02 OP_CHECKSEQUENCEVERIFY OP_DROP OP_TRUE",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001888888888888888888888888888888888888888888888888888888888888888800000000000200000001e8030000000000001976a914222222222222222222222222222222222222222288ac00000000",
    inputIndex: 0,
    satoshis: 1000,
    witness: [],
    expectedVerified: true,
    expectedError: null,
  },
  {
    id: "csv-fail-sequence-too-low",
    name: "CSV sequence too low (fail)",
    category: "csv",
    objective: "Show CSV failure when input sequence does not satisfy operand.",
    notes: "Operand is 2 while tx input sequence is 1.",
    scriptSig: "",
    scriptPubKey:
      "02 OP_CHECKSEQUENCEVERIFY OP_DROP OP_TRUE",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001888888888888888888888888888888888888888888888888888888888888888800000000000100000001e8030000000000001976a914222222222222222222222222222222222222222288ac00000000",
    inputIndex: 0,
    satoshis: 1000,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_UNSATISFIED_LOCKTIME",
  },
  {
    id: "sighash-invalid-type-byte-fail",
    name: "Sighash invalid type byte (fail)",
    category: "sighash",
    objective: "Enforce strict sighash type validation under SCRIPT_VERIFY_STRICTENC.",
    notes: "P2PKH signature ends with hashtype 0x00, which is invalid.",
    scriptSig:
      "3044022033a41c3a8314c76f24a05fb5f5b6726a880e05ee61d4add47d9891b33a7ccbc702201bd07e7f8827f99b9f9d692f1ea1553a23ab4e7ee571b2e1524de54493b82b7c00 034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa",
    scriptPubKey:
      "OP_DUP OP_HASH160 fc7250a211deddc70ee5a2738de5f07817351cef OP_EQUALVERIFY OP_CHECKSIG",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa000000006a473044022033a41c3a8314c76f24a05fb5f5b6726a880e05ee61d4add47d9891b33a7ccbc702201bd07e7f8827f99b9f9d692f1ea1553a23ab4e7ee571b2e1524de54493b82b7c0021034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aaffffffff01b0ad0100000000001976a914531260aa2a199e228c537dfa42c82bea2c7c1f4d88ac00000000",
    inputIndex: 0,
    satoshis: 120000,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_SIG_NULLFAIL",
  },
  {
    id: "sighash-mismatch-nullfail",
    name: "Sighash mismatch triggers NULLFAIL (fail)",
    category: "sighash",
    objective: "Exercise nullfail behavior on signature-check failure with non-empty signature.",
    notes: "Valid DER signature uses SIGHASH_ANYONECANPAY|ALL but was not produced for that hash type.",
    scriptSig:
      "3044022033a41c3a8314c76f24a05fb5f5b6726a880e05ee61d4add47d9891b33a7ccbc702201bd07e7f8827f99b9f9d692f1ea1553a23ab4e7ee571b2e1524de54493b82b7c81 034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa",
    scriptPubKey:
      "OP_DUP OP_HASH160 fc7250a211deddc70ee5a2738de5f07817351cef OP_EQUALVERIFY OP_CHECKSIG",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "0200000001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa000000006a473044022033a41c3a8314c76f24a05fb5f5b6726a880e05ee61d4add47d9891b33a7ccbc702201bd07e7f8827f99b9f9d692f1ea1553a23ab4e7ee571b2e1524de54493b82b7c8121034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aaffffffff01b0ad0100000000001976a914531260aa2a199e228c537dfa42c82bea2c7c1f4d88ac00000000",
    inputIndex: 0,
    satoshis: 120000,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_SIG_NULLFAIL",
  },
  {
    id: "op-return-unspendable-fail",
    name: "OP_RETURN spend attempt (fail)",
    category: "opreturn",
    objective: "Show consensus failure for provably unspendable output.",
    notes: "OP_RETURN outputs cannot be spent by script evaluation.",
    scriptSig: "",
    scriptPubKey:
      "OP_RETURN 726177626c6f636b2d66697874757265",
    scriptSigFormat: "asm",
    scriptPubKeyFormat: "asm",
    txHex:
      "020000000166666666666666666666666666666666666666666666666666666666666666660000000000ffffffff01e8030000000000001976a914eeacc5780d335048d698b56c1ee7ec4c02ea1ed288ac00000000",
    inputIndex: 0,
    satoshis: 0,
    witness: [],
    expectedVerified: false,
    expectedError: "SCRIPT_ERR_OP_RETURN",
  },
];

// initWasm.js






//console.log("initWasm.js caricato");
//export function initializeWasm() {
//    console.log('Inizializzazione del modulo WASM...');
//    if (typeof WASM_URI === 'undefined') {
//        console.error('WASM_URI non è definito.');
//        return;
//    }
//
//    fetch(WASM_URI)
//        .then(response => {
//            if (!response.ok) {
//                throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
//            }
//            return response.arrayBuffer();
//        })
//        .then(bytes => WebAssembly.instantiate(bytes))
//        .then(results => {
//            const wasmModule = results.instance;
//            // Utilizza il modulo WASM come necessario
//            console.log('WASM Module Caricato:', wasmModule);
//            // Esempio: chiama una funzione esportata dal WASM
//            // wasmModule.exports.myWasmFunction();
//        })
//        .catch(error => {
//            console.error('Errore nel caricamento del modulo WASM:', error);
//        });
//}

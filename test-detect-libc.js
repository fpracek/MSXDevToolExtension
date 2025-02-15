const path = require('path');

const nodeAbi = require('node-abi');
const version = process.versions.node;
console.log(`Node.js Version: ${version}`);
console.log(`ABI Version: ${nodeAbi.getAbi(version)}`);



const fs = require('fs');


// Verifica se il file esiste
if (!fs.existsSync(path.resolve()+ "/out/addon/bin/windows-x64/MSXimgLib.node")) {
  console.error('Il file .node specificato non esiste.');
  process.exit(1);
}

// Usa node-abi per ottenere l'ABI
const abi = nodeAbi.getAbi(process.version, 'node');

// Nota: Questo esempio assume che il file .node sia compatibile con la versione corrente di Node.js.
// Per ottenere l'ABI del file senza eseguire Node.js, potresti dover utilizzare strumenti più avanzati.
console.log(`ABI Version: ${abi}`);

try {
    const nativeModule = require(path.resolve()+ "/out/addon/bin/windows-x64/MSXimgLib.node");
    //return nativeModule;
} catch (err) {
    console.error('Failed to load native module:', err);
    throw err;
}




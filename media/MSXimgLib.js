// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == 'object';
var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != 'undefined';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string' && process.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {

}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  if (typeof process == 'undefined' || !process.release || process.release.name !== 'node') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  var nodeVersion = process.versions.node;
  var numericVersion = nodeVersion.split('.').slice(0, 3);
  numericVersion = (numericVersion[0] * 10000) + (numericVersion[1] * 100) + (numericVersion[2].split('-')[0] * 1);
  var minVersion = 160000;
  if (numericVersion < 160000) {
    throw new Error('This emscripten-generated code requires node v16.0.0 (detected v' + nodeVersion + ')');
  }

  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('fs');
  var nodePath = require('path');

  scriptDirectory = __dirname + '/';

// include: node_shell_read.js
readBinary = (filename) => {
  // We need to re-wrap `file://` strings to URLs.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename);
  assert(Buffer.isBuffer(ret));
  return ret;
};

readAsync = async (filename, binary = true) => {
  // See the comment in the `readBinary` function.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename, binary ? undefined : 'utf8');
  assert(binary ? Buffer.isBuffer(ret) : typeof ret == 'string');
  return ret;
};
// end include: node_shell_read.js
  if (!Module['thisProgram'] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, '/');
  }

  arguments_ = process.argv.slice(2);

  if (typeof module != 'undefined') {
    module['exports'] = Module;
  }

  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };

} else
if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof WorkerGlobalScope != 'undefined') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.startsWith('blob:')) {
    scriptDirectory = '';
  } else {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/')+1);
  }

  if (!(typeof window == 'object' || typeof WorkerGlobalScope != 'undefined')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
    // See https://github.com/github/fetch/pull/92#issuecomment-140665932
    // Cordova or Electron apps are typically loaded from a file:// url.
    // So use XHR on webview if URL is a file URL.
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('asm', 'wasmExports');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');

if (typeof WebAssembly != 'object') {
  err('no native wasm support detected');
}

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
function _malloc() {
  abort('malloc() called but not included in the build - add `_malloc` to EXPORTED_FUNCTIONS');
}
function _free() {
  // Show a helpful error since we used to include free by default in the past.
  abort('free() called but not included in the build - add `_free` to EXPORTED_FUNCTIONS');
}

// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/* BigInt64Array type is not correctly defined in closure
/** not-@type {!BigInt64Array} */
  HEAP64,
/* BigUint64Array type is not correctly defined in closure
/** not-t@type {!BigUint64Array} */
  HEAPU64,
/** @type {!Float64Array} */
  HEAPF64;

var runtimeInitialized = false;

// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');
// end include: URIUtils.js
// include: runtime_shared.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
// include: runtime_debug.js
// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

function legacyModuleProp(prop, newName, incoming=true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incoming ? ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)' : '';
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);

      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

/**
 * Intercept access to a global symbol.  This enables us to give informative
 * warnings/errors when folks attempt to use symbols they did not include in
 * their build, or no symbols that no longer exist.
 */
function hookGlobalSymbolAccess(sym, func) {
  if (typeof globalThis != 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        func();
        return undefined;
      }
    });
  }
}

function missingGlobal(sym, msg) {
  hookGlobalSymbolAccess(sym, () => {
    warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
  });
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');
missingGlobal('asm', 'Please use wasmExports instead');

function missingLibrarySymbol(sym) {
  hookGlobalSymbolAccess(sym, () => {
    // Can't `abort()` here because it would break code that does runtime
    // checks.  e.g. `if (typeof SDL === 'undefined')`.
    var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
    // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
    // library.js, which means $name for a JS name with no prefix, or name
    // for a JS name like _name.
    var librarySymbol = sym;
    if (!librarySymbol.startsWith('_')) {
      librarySymbol = '$' + sym;
    }
    msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
    if (isExportedByForceFilesystem(sym)) {
      msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
    }
    warnOnce(msg);
  });

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}
// end include: runtime_debug.js
// include: memoryprofiler.js
// end include: memoryprofiler.js


function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
  Module['HEAP64'] = HEAP64 = new BigInt64Array(b);
  Module['HEAPU64'] = HEAPU64 = new BigUint64Array(b);
}

// end include: runtime_shared.js
assert(!Module['STACK_SIZE'], 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(!Module['INITIAL_MEMORY'], 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
if (!Module['noFSInit'] && !FS.initialized)
  FS.init();
FS.ignorePermissions = false;

TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};
var runDependencyWatcher = null;

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  Module['onAbort']?.(what);

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;
function findWasmBinary() {
    return wasmUri;
}

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary
      ) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary &&
      typeof WebAssembly.instantiateStreaming == 'function' &&
      !isDataURI(binaryFile)
      // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
      && !isFileURI(binaryFile)
      // Avoid instantiateStreaming() on Node.js environment for now, as while
      // Node.js v18.1.0 implements it, it does not have a full fetch()
      // implementation yet.
      //
      // Reference:
      //   https://github.com/emscripten-core/emscripten/pull/16917
      && !ENVIRONMENT_IS_NODE
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  return {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  }
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, 'memory not found in wasm exports');
    updateMemoryViews();

    wasmTable = wasmExports['__indirect_function_table'];
    
    assert(wasmTable, 'table not found in wasm exports');

    addOnInit(wasmExports['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {
    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
        return false;
    }
  }

  wasmBinaryFile ??= findWasmBinary();

    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
}

// === Body ===
// end include: preamble.js


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP64[((ptr)>>3)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = Module['noExitRuntime'] || true;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number');
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': HEAP64[((ptr)>>3)] = BigInt(value); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
      }
    };

  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number=} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined/NaN means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    };
  var ___assert_fail = (condition, filename, line, func) =>
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);

  class ExceptionInfo {
      // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
      constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
      }
  
      set_type(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      }
  
      get_type() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      }
  
      set_destructor(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      }
  
      get_destructor() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      }
  
      set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr)+(12)] = caught;
      }
  
      get_caught() {
        return HEAP8[(this.ptr)+(12)] != 0;
      }
  
      set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr)+(13)] = rethrown;
      }
  
      get_rethrown() {
        return HEAP8[(this.ptr)+(13)] != 0;
      }
  
      // Initialize native structure fields. Should be called once after allocated.
      init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      }
  
      get_adjusted_ptr() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      }
    }
  
  var exceptionLast = 0;
  
  var uncaughtExceptionCount = 0;
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      assert(false, 'Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.');
    };

  /** @suppress {duplicate } */
  var syscallGetVarargI = () => {
      assert(SYSCALLS.varargs != undefined);
      // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
      var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
      SYSCALLS.varargs += 4;
      return ret;
    };
  var syscallGetVarargP = syscallGetVarargI;
  
  
  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },
  basename:(path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join:(...paths) => PATH.normalize(paths.join('/')),
  join2:(l, r) => PATH.normalize(l + '/' + r),
  };
  
  var initRandomFill = () => {
      // This block is not needed on v19+ since crypto.getRandomValues is builtin
      if (ENVIRONMENT_IS_NODE) {
        var nodeCrypto = require('crypto');
        return (view) => nodeCrypto.randomFillSync(view);
      }
  
      return (view) => crypto.getRandomValues(view);
    };
  var randomFill = (view) => {
      // Lazily init on the first invocation.
      (randomFill = initRandomFill())(view);
    };
  
  
  
  var PATH_FS = {
  resolve:(...args) => {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? args[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path != 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = PATH.isAbs(path);
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },
  relative:(from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      },
  };
  
  
  
  var FS_stdin_getChar_buffer = [];
  
  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
          var u1 = str.charCodeAt(++i);
          u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  /** @type {function(string, boolean=, number=)} */
  function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  }
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          // we will read data by chunks of BUFSIZE
          var BUFSIZE = 256;
          var buf = Buffer.alloc(BUFSIZE);
          var bytesRead = 0;
  
          // For some reason we must suppress a closure warning here, even though
          // fd definitely exists on process.stdin, and is even the proper way to
          // get the fd of stdin,
          // https://github.com/nodejs/help/issues/2136#issuecomment-523649904
          // This started to happen after moving this logic out of library_tty.js,
          // so it is related to the surrounding code in some unclear manner.
          /** @suppress {missingProperties} */
          var fd = process.stdin.fd;
  
          try {
            bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
          } catch(e) {
            // Cross-platform differences: on Windows, reading EOF throws an
            // exception, but on other OSes, reading EOF returns 0. Uniformize
            // behavior by treating the EOF exception to return 0.
            if (e.toString().includes('EOF')) bytesRead = 0;
            else throw e;
          }
  
          if (bytesRead > 0) {
            result = buf.slice(0, bytesRead).toString('utf-8');
          }
        } else
        if (typeof window != 'undefined' &&
          typeof window.prompt == 'function') {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else
        {}
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  },
  };
  
  
  var zeroMemory = (address, size) => {
      HEAPU8.fill(0, address, address + size);
    };
  
  var alignMemory = (size, alignment) => {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    };
  var mmapAlloc = (size) => {
      abort('internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported');
    };
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
      },
  createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
          dir: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              lookup: MEMFS.node_ops.lookup,
              mknod: MEMFS.node_ops.mknod,
              rename: MEMFS.node_ops.rename,
              unlink: MEMFS.node_ops.unlink,
              rmdir: MEMFS.node_ops.rmdir,
              readdir: MEMFS.node_ops.readdir,
              symlink: MEMFS.node_ops.symlink
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek
            }
          },
          file: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek,
              read: MEMFS.stream_ops.read,
              write: MEMFS.stream_ops.write,
              allocate: MEMFS.stream_ops.allocate,
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync
            }
          },
          link: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              readlink: MEMFS.node_ops.readlink
            },
            stream: {}
          },
          chrdev: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: FS.chrdev_stream_ops
          }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
        }
      },
  node_ops:{
  getattr(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          for (const key of ["mode", "atime", "mtime", "ctime"]) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          throw new FS.ErrnoError(44);
        },
  mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {}
          if (new_node) {
            if (FS.isDir(old_node.mode)) {
              // if we're overwriting a directory at new_name, make sure it's empty.
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
            FS.hashRemoveNode(new_node);
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  readdir(node) {
          return ['.', '..', ...Object.keys(node.contents)];
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          // The data buffer should be a typed array view
          assert(!(buffer instanceof ArrayBuffer));
  
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) {
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
          } else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  allocate(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  
  var asyncLoad = async (url) => {
      var arrayBuffer = await readAsync(url);
      assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
      return new Uint8Array(arrayBuffer);
    };
  
  
  var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
      FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
    };
  
  var preloadPlugins = Module['preloadPlugins'] || [];
  var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
      // Ensure plugins are ready.
      if (typeof Browser != 'undefined') Browser.init();
  
      var handled = false;
      preloadPlugins.forEach((plugin) => {
        if (handled) return;
        if (plugin['canHandle'](fullname)) {
          plugin['handle'](byteArray, fullname, finish, onerror);
          handled = true;
        }
      });
      return handled;
    };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
      // TODO we should allow people to just pass in a complete filename instead
      // of parent and name being that we just join them anyways
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
      function processData(byteArray) {
        function finish(byteArray) {
          preFinish?.();
          if (!dontCreateFile) {
            FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
          }
          onload?.();
          removeRunDependency(dep);
        }
        if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
          onerror?.();
          removeRunDependency(dep);
        })) {
          return;
        }
        finish(byteArray);
      }
      addRunDependency(dep);
      if (typeof url == 'string') {
        asyncLoad(url).then(processData, onerror);
      } else {
        processData(url);
      }
    };
  
  var FS_modeStringToFlags = (str) => {
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags == 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  
  
  
  
  
  
  var strError = (errno) => UTF8ToString(_strerror(errno));
  
  var ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:null,
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  ErrnoError:class extends Error {
        name = 'ErrnoError';
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          super(runtimeInitialized ? strError(errno) : '');
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
        }
      },
  filesystems:null,
  syncFSRequests:0,
  readFiles:{
  },
  FSStream:class {
        shared = {};
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.rdev = rdev;
          this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
      },
  lookupPath(path, opts = {}) {
        if (!path) {
          throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true
  
        if (!PATH.isAbs(path)) {
          path = FS.cwd() + '/' + path;
        }
  
        // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
          // split the absolute path
          var parts = path.split('/').filter((p) => !!p);
  
          // start at the root
          var current = FS.root;
          var current_path = '/';
  
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
  
            if (parts[i] === '.') {
              continue;
            }
  
            if (parts[i] === '..') {
              current_path = PATH.dirname(current_path);
              current = current.parent;
              continue;
            }
  
            current_path = PATH.join2(current_path, parts[i]);
            try {
              current = FS.lookupNode(current, parts[i]);
            } catch (e) {
              // if noent_okay is true, suppress a ENOENT in the last component
              // and return an object with an undefined node. This is needed for
              // resolving symlinks in the path when creating a file.
              if ((e?.errno === 44) && islast && opts.noent_okay) {
                return { path: current_path };
              }
              throw e;
            }
  
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
              current = current.mounted.root;
            }
  
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (FS.isLink(current.mode) && (!islast || opts.follow)) {
              if (!current.node_ops.readlink) {
                throw new FS.ErrnoError(52);
              }
              var link = current.node_ops.readlink(current);
              if (!PATH.isAbs(link)) {
                link = PATH.dirname(current_path) + '/' + link;
              }
              path = link + '/' + parts.slice(i + 1).join('/');
              continue linkloop;
            }
          }
          return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },
  createNode(parent, name, mode, rdev) {
        assert(typeof parent == 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
          return 54;
        }
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' // opening for write
              || (flags & (512 | 64))) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },
  checkOpExists(op, err) {
        if (!op) {
          throw new FS.ErrnoError(err);
        }
        return op;
      },
  MAX_OPEN_FDS:4096,
  nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
        assert(fd >= -1);
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach((mount) => {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },
  mount(type, opts, mountpoint) {
        if (typeof type == 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach((hash) => {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
          throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
          throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {follow: true}).node);
      },
  statfsStream(stream) {
        // We keep a separate statfsStream function because noderawfs overrides
        // it. In noderawfs, stream.node is sometimes null. Instead, we need to
        // look at stream.path.
        return FS.statfsNode(stream.node);
      },
  statfsNode(node) {
        // NOTE: None of the defaults here are true. We're just returning safe and
        //       sane values. Currently nodefs and rawfs replace these defaults,
        //       other file systems leave them alone.
        var rtn = {
          bsize: 4096,
          frsize: 4096,
          blocks: 1e6,
          bfree: 5e5,
          bavail: 5e5,
          files: FS.nextInode,
          ffree: FS.nextInode - 1,
          fsid: 42,
          flags: 2,
          namelen: 255,
        };
  
        if (node.node_ops.statfs) {
          Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
      },
  create(path, mode = 0o666) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode = 0o777) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev) {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          // update old node (we do this here to avoid each backend
          // needing to)
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
      },
  stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          ctime: Date.now(),
          dontFollow
        });
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
      },
  chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          timestamp: Date.now(),
          dontFollow
          // we ignore the uid / gid for now
        });
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },
  utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          atime: atime,
          mtime: mtime
        });
      },
  open(path, flags, mode = 0o666) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == 'string' ? FS_modeStringToFlags(flags) : flags;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path == 'object') {
          node = path;
        } else {
          isDirPath = path.endsWith("/");
          // noent_okay makes it so that if the final component of the path
          // doesn't exist, lookupPath returns `node: undefined`. `path` will be
          // updated to point to the target of all symlinks.
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072),
            noent_okay: true
          });
          node = lookup.node;
          path = lookup.path;
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else if (isDirPath) {
            throw new FS.ErrnoError(31);
          } else {
            // node doesn't exist, try to create it
            // Ignore the permission bits here to ensure we can `open` this new
            // file below. We use chmod below the apply the permissions once the
            // file is open.
            node = FS.mknod(path, mode | 0o777, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (created) {
          FS.chmod(node, mode & 0o777);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position, canOwn) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },
  writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
          llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (randomLeft === 0) {
            randomFill(randomBuffer);
            randomLeft = randomBuffer.byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16895, 73);
            node.stream_ops = {
              llseek: MEMFS.stream_ops.llseek,
            };
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                  id: fd + 1,
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              },
              readdir() {
                return Array.from(FS.streams.entries())
                  .filter(([k, v]) => v)
                  .map(([k, v]) => k.toString());
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams(input, output, error) {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (input) {
          FS.createDevice('/dev', 'stdin', input);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
          FS.createDevice('/dev', 'stdout', null, output);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
          FS.createDevice('/dev', 'stderr', null, error);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
      },
  staticInit() {
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },
  init(input, output, error) {
        assert(!FS.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input ??= Module['stdin'];
        output ??= Module['stdout'];
        error ??= Module['stderr'];
  
        FS.createStandardStreams(input, output, error);
      },
  quit() {
        FS.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },
  findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },
  analyzePath(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },
  createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },
  createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else { // Command-line.
          try {
            obj.contents = readBinary(obj.url);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
  createLazyFile(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          lengthKnown = false;
          chunks = []; // Loaded chunks. Index is the chunk number
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText || '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') throw new Error('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (typeof XMLHttpRequest != 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
          var fn = node.stream_ops[key];
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        });
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  absolutePath() {
        abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
      },
  createFolder() {
        abort('FS.createFolder has been removed; use FS.mkdir instead');
      },
  createLink() {
        abort('FS.createLink has been removed; use FS.symlink instead');
      },
  joinPath() {
        abort('FS.joinPath has been removed; use PATH.join instead');
      },
  mmapAlloc() {
        abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
      },
  standardizePath() {
        abort('FS.standardizePath has been removed; use PATH.normalize instead');
      },
  };
  
  var SYSCALLS = {
  DEFAULT_POLLMASK:5,
  calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return dir + '/' + path;
      },
  writeStat(buf, stat) {
        HEAP32[((buf)>>2)] = stat.dev;
        HEAP32[(((buf)+(4))>>2)] = stat.mode;
        HEAPU32[(((buf)+(8))>>2)] = stat.nlink;
        HEAP32[(((buf)+(12))>>2)] = stat.uid;
        HEAP32[(((buf)+(16))>>2)] = stat.gid;
        HEAP32[(((buf)+(20))>>2)] = stat.rdev;
        HEAP64[(((buf)+(24))>>3)] = BigInt(stat.size);
        HEAP32[(((buf)+(32))>>2)] = 4096;
        HEAP32[(((buf)+(36))>>2)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[(((buf)+(40))>>3)] = BigInt(Math.floor(atime / 1000));
        HEAPU32[(((buf)+(48))>>2)] = (atime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(56))>>3)] = BigInt(Math.floor(mtime / 1000));
        HEAPU32[(((buf)+(64))>>2)] = (mtime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(72))>>3)] = BigInt(Math.floor(ctime / 1000));
        HEAPU32[(((buf)+(80))>>2)] = (ctime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(88))>>3)] = BigInt(stat.ino);
        return 0;
      },
  writeStatFs(buf, stats) {
        HEAP32[(((buf)+(4))>>2)] = stats.bsize;
        HEAP32[(((buf)+(40))>>2)] = stats.bsize;
        HEAP32[(((buf)+(8))>>2)] = stats.blocks;
        HEAP32[(((buf)+(12))>>2)] = stats.bfree;
        HEAP32[(((buf)+(16))>>2)] = stats.bavail;
        HEAP32[(((buf)+(20))>>2)] = stats.files;
        HEAP32[(((buf)+(24))>>2)] = stats.ffree;
        HEAP32[(((buf)+(28))>>2)] = stats.fsid;
        HEAP32[(((buf)+(44))>>2)] = stats.flags;  // ST_NOSUID
        HEAP32[(((buf)+(36))>>2)] = stats.namelen;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          stream.flags |= arg;
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)] = 2;
          return 0;
        }
        case 13:
        case 14:
          return 0; // Pretend that the locking is successful.
      }
      return -28;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[((argp)>>2)] = termios.c_iflag || 0;
            HEAP32[(((argp)+(4))>>2)] = termios.c_oflag || 0;
            HEAP32[(((argp)+(8))>>2)] = termios.c_cflag || 0;
            HEAP32[(((argp)+(12))>>2)] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[(argp + i)+(17)] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[((argp)>>2)];
            var c_oflag = HEAP32[(((argp)+(4))>>2)];
            var c_cflag = HEAP32[(((argp)+(8))>>2)];
            var c_lflag = HEAP32[(((argp)+(12))>>2)];
            var c_cc = []
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[(argp + i)+(17)]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[((argp)>>2)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[((argp)>>1)] = winsize[0];
            HEAP16[(((argp)+(2))>>1)] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default: return -28; // not supported
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  var __abort_js = () =>
      abort('native code called abort()');

  var __emscripten_throw_longjmp = () => {
      throw Infinity;
    };

  var isLeapYear = (year) => year%4 === 0 && (year%100 !== 0 || year%400 === 0);
  
  var MONTH_DAYS_LEAP_CUMULATIVE = [0,31,60,91,121,152,182,213,244,274,305,335];
  
  var MONTH_DAYS_REGULAR_CUMULATIVE = [0,31,59,90,120,151,181,212,243,273,304,334];
  var ydayFromDate = (date) => {
      var leap = isLeapYear(date.getFullYear());
      var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
      var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1; // -1 since it's days since Jan 1
  
      return yday;
    };
  
  var INT53_MAX = 9007199254740992;
  
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  function __localtime_js(time, tmPtr) {
    time = bigintToI53Checked(time);
  
    
      var date = new Date(time*1000);
      HEAP32[((tmPtr)>>2)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)] = date.getDay();
  
      var yday = ydayFromDate(date)|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
      HEAP32[(((tmPtr)+(36))>>2)] = -(date.getTimezoneOffset() * 60);
  
      // Attention: DST is in December in South, and some regions don't have DST at all.
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset))|0;
      HEAP32[(((tmPtr)+(32))>>2)] = dst;
    ;
  }

  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  var __tzset_js = (timezone, daylight, std_name, dst_name) => {
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for
      // daylight savings.  This code uses the fact that getTimezoneOffset returns
      // a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it
      // compares whether the output of the given date the same (Standard) or less
      // (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU32[((timezone)>>2)] = stdTimezoneOffset * 60;
  
      HEAP32[((daylight)>>2)] = Number(winterOffset != summerOffset);
  
      var extractZone = (timezoneOffset) => {
        // Why inverse sign?
        // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        var sign = timezoneOffset >= 0 ? "-" : "+";
  
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        var minutes = String(absOffset % 60).padStart(2, "0");
  
        return `UTC${sign}${hours}${minutes}`;
      }
  
      var winterName = extractZone(winterOffset);
      var summerName = extractZone(summerOffset);
      assert(winterName);
      assert(summerName);
      assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
      assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
      } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
      }
    };

  var _emscripten_date_now = () => Date.now();

  var getHeapMax = () =>
      HEAPU8.length;
  
  
  var abortOnCannotGrowMemory = (requestedSize) => {
      abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      abortOnCannotGrowMemory(requestedSize);
    };

  var ENV = {
  };
  
  var getExecutableName = () => thisProgram || './this.program';
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator == 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  var stringToAscii = (str, buffer) => {
      for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
        HEAP8[buffer++] = str.charCodeAt(i);
      }
      // Null-terminate the string
      HEAP8[buffer] = 0;
    };
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(i*4))>>2)] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    };

  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      strings.forEach((string) => bufSize += string.length + 1);
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    };

  
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        Module['onExit']?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
  
  
  /** @suppress {duplicate } */
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        err(msg);
      }
  
      _proc_exit(status);
    };
  var _exit = exitJS;

  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
  
    
  try {
  
      if (isNaN(offset)) return 61;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[((newOffset)>>3)] = BigInt(stream.position);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) {
          // No more space to write.
          break;
        }
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  var wasmTableMirror = [];
  
  /** @type {WebAssembly.Table} */
  var wasmTable;
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        /** @suppress {checkTypes} */
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      /** @suppress {checkTypes} */
      assert(wasmTable.get(funcPtr) == func, 'JavaScript-side Wasm function table mirror is out of date!');
      return func;
    };

  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.staticInit();
  // Set module methods based on EXPORTED_RUNTIME_METHODS
  ;
function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var wasmImports = {
  /** @export */
  __assert_fail: ___assert_fail,
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */
  __syscall_ioctl: ___syscall_ioctl,
  /** @export */
  __syscall_openat: ___syscall_openat,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  _emscripten_throw_longjmp: __emscripten_throw_longjmp,
  /** @export */
  _localtime_js: __localtime_js,
  /** @export */
  _tzset_js: __tzset_js,
  /** @export */
  emscripten_date_now: _emscripten_date_now,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  exit: _exit,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write,
  /** @export */
  invoke_ii,
  /** @export */
  invoke_iii,
  /** @export */
  invoke_iiii,
  /** @export */
  invoke_iiiii,
  /** @export */
  invoke_iiiiii,
  /** @export */
  invoke_iiiiiii,
  /** @export */
  invoke_iiiiiiiii,
  /** @export */
  invoke_iiiiiiiiii,
  /** @export */
  invoke_vi,
  /** @export */
  invoke_vii,
  /** @export */
  invoke_viii,
  /** @export */
  invoke_viiii,
  /** @export */
  invoke_viiiii,
  /** @export */
  invoke_viiiiii,
  /** @export */
  invoke_viiiiiiiii
};
var wasmExports;
createWasm();
var ___wasm_call_ctors = createExportWrapper('__wasm_call_ctors', 0);
var _GetStringLength = Module['_GetStringLength'] = createExportWrapper('GetStringLength', 1);
var _CopyStringToWasm = Module['_CopyStringToWasm'] = createExportWrapper('CopyStringToWasm', 3);
var _GetStringFromWasm = Module['_GetStringFromWasm'] = createExportWrapper('GetStringFromWasm', 1);
var _Malloc = Module['_Malloc'] = createExportWrapper('Malloc', 1);
var _Free = Module['_Free'] = createExportWrapper('Free', 1);
var _ClearGetArrayFromImageAllocatedMemory = Module['_ClearGetArrayFromImageAllocatedMemory'] = createExportWrapper('ClearGetArrayFromImageAllocatedMemory', 1);
var _Test = Module['_Test'] = createExportWrapper('Test', 2);
var _GetArrayFromImage = Module['_GetArrayFromImage'] = createExportWrapper('GetArrayFromImage', 53);
var _strerror = createExportWrapper('strerror', 1);
var _fflush = createExportWrapper('fflush', 1);
var _setThrew = createExportWrapper('setThrew', 2);
var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports['emscripten_stack_init'])();
var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'])();
var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'])();
var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'])();
var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports['_emscripten_stack_restore'])(a0);
var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'])();

function invoke_iiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index,a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'stackAlloc',
  'getTempRet0',
  'setTempRet0',
  'growMemory',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'emscriptenLog',
  'readEmAsmArgs',
  'jstoi_q',
  'listenOnce',
  'autoResumeAudioContext',
  'getDynCaller',
  'dynCall',
  'handleException',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asmjsMangle',
  'HandleAllocator',
  'getNativeTypeSize',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'getCFunc',
  'ccall',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'intArrayToString',
  'AsciiToString',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'getCallstack',
  'convertPCtoSourceLocation',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'safeSetTimeout',
  'setImmediateWrapped',
  'safeRequestAnimationFrame',
  'clearImmediateWrapped',
  'registerPostMainLoop',
  'registerPreMainLoop',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'findMatchingCatch',
  'Browser_asyncPrepareDataCounter',
  'arraySum',
  'addDays',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_unlink',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'setErrNo',
  'demangle',
  'stackTrace',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

var unexportedSymbols = [
  'run',
  'addOnPreRun',
  'addOnInit',
  'addOnPreMain',
  'addOnExit',
  'addOnPostRun',
  'addRunDependency',
  'removeRunDependency',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmMemory',
  'wasmExports',
  'writeStackCookie',
  'checkStackCookie',
  'INT53_MAX',
  'INT53_MIN',
  'bigintToI53Checked',
  'stackSave',
  'stackRestore',
  'ptrToString',
  'zeroMemory',
  'exitJS',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'ENV',
  'ERRNO_CODES',
  'strError',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'jstoi_s',
  'getExecutableName',
  'keepRuntimeAlive',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'wasmTable',
  'noExitRuntime',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'stringToAscii',
  'UTF16Decoder',
  'JSEvents',
  'specialHTMLTargets',
  'findCanvasEventTarget',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'UNWIND_CACHE',
  'ExitStatus',
  'getEnvStrings',
  'doReadv',
  'doWritev',
  'initRandomFill',
  'randomFill',
  'emSetImmediate',
  'emClearImmediate_deps',
  'emClearImmediate',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'Browser',
  'getPreloadedImageData__data',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'isLeapYear',
  'ydayFromDate',
  'SYSCALLS',
  'preloadPlugins',
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_stdin_getChar_buffer',
  'FS_stdin_getChar',
  'FS_createPath',
  'FS_createDevice',
  'FS_readFile',
  'FS',
  'FS_createDataFile',
  'FS_createLazyFile',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'print',
  'printErr',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);



var calledRun;

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    Module['onRuntimeInitialized']?.();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(() => {
      setTimeout(() => Module['setStatus'](''), 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    ['stdout', 'stderr'].forEach((name) => {
      var info = FS.analyzePath('/dev/' + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty?.output?.length) {
        has = true;
      }
    });
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();

// end include: postamble.js





function getStringByteLength(str) {
  let encoder = new TextEncoder();  // Usa TextEncoder per contare i byte UTF-8
  return encoder.encode(str).length + 1; // +1 per il terminatore NULL
}

function writeStringToWasmMemory(str) {
  const length = getStringByteLength(str); // +1 per il terminatore null
  const ptr = Module._Malloc(length); // Alloca memoria in WASM




  for (let i = 0; i < str.length; i++) {
    Module.HEAPU8[ptr + i] = str.charCodeAt(i);
  }
  Module.HEAPU8[ptr + str.length] = 0; // Aggiunge il terminatore NULL


  //Module._CopyStringToWasm(str, ptr, length); // Copia la stringa in memoria WASM

  return { ptr, length };
}
function readStringFromMemory(ptr) {
  if (!ptr) {
      console.error("readStringFromMemory: Puntatore NULL ricevuto!");
      return "";
  }

  let str = "";
  let i = ptr;

  // Legge byte per byte finché non trova il terminatore NULL (0x00)
  while (Module.HEAP8[i] !== 0) {
      str += String.fromCharCode(Module.HEAP8[i]);
      i++;
  }

  return str;
}
function getPngDataArray(base64img,dataTableName,imageWidth,imageHeight,numBlockX,numBlockY,paletteType,startPosX,startPosY,gapX,gapY,bpc,exportArrayFormat,useTransColor,transColor,useOpacityColor,opacityColor,inputPaletteColors,palColoursCount,paletteOffset,palette24bit,compressionMethod,exportMode,ditherMethod,textDataFormat,asmType,blockLayersType,blockLayersTypeColors,blockLayersTypeNumX,blockLayersTypeNumY,blockLayersTypePosX,blockLayersTypePosY,bloadHeader,addFontDataHeader,fontHeaderFirst,fontHeaderLast,fontHeaderX,fontHeaderY,exportDataHeader,addIndex,skipEmptyBloks) {
      //const base64img="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VAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxWJUABTFYlQAFMViVAAUxVpu4j8BT9WVRweJwDAAAAAASUVORK5CYII=";
      //const base64img="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";
      const base64Image = writeStringToWasmMemory(base64img);
      const dataTableNameParam = writeStringToWasmMemory(dataTableName);
      const paletteTypeParam = writeStringToWasmMemory(paletteType);
      let inputPaletteColorsValues ="";
      if(inputPaletteColors!=null){
        inputPaletteColors.forEach(color => {
          if(inputPaletteColorsValues.length>0){
            inputPaletteColorsValues+=";";
          }
          inputPaletteColorsValues+=color;
        });
      }
      
      if(inputPaletteColorsValues=="")  {
        inputPaletteColorsValues="0;0;0;0;0;0;0;0;0;0;0;0;0;0;0";
      }
      const inputPaletteColorsParam=writeStringToWasmMemory(inputPaletteColorsValues);
      const compressionMethodParam = writeStringToWasmMemory(compressionMethod);
      const imageWidthParam=imageWidth;
      const imageHeightParam=imageHeight;
      const numBlockXParam=numBlockX;
      const numBlockYParam=numBlockY;
      const startPosXParam=startPosX;
      const startPosYParam=startPosY;
      const gapXParam=gapX;
      const gapYParam=gapY;
      const bpcParam=bpc;
      const exportArrayFormatParam = writeStringToWasmMemory(exportArrayFormat);
      let useTransColorParam=useTransColor;
      let useOpacityColorParam=useOpacityColor;
      let transColorParam=transColor;
      let opacityColorParam=opacityColor;
      let palColoursCountParam=palColoursCount;
      let paletteOffsetParam=paletteOffset;
      let palette24bitParam=palette24bit;
      let skipEmptyBloksParam=skipEmptyBloks;
      const exportModeParam=writeStringToWasmMemory(exportMode);
      const ditherMethodParam=writeStringToWasmMemory(ditherMethod);
      const textDataFormatParam=writeStringToWasmMemory(textDataFormat); // "hexa0x"
      const asmTypeParam=writeStringToWasmMemory(asmType); // "sjasm"
      const blockLayersTypeParam=writeStringToWasmMemory(blockLayersType); // "none"
      let blockLayersTypeColorsValues="";
      if(blockLayersTypeColors!=null){
        blockLayersTypeColors.forEach(color => {
          if(blockLayersTypeColorsValues.length>0){
            blockLayersTypeColorsValues+=";";
          }
          blockLayersTypeColorsValues+=color;
        });
      }
      if(blockLayersTypeColorsValues=="")  {
        blockLayersTypeColorsValues="0;0;0;0;0;0;0;0;0;0;0;0;0;0;0";
      }
      const blockLayersTypeColorsParam=writeStringToWasmMemory(blockLayersTypeColorsValues);
      const blockLayersTypeNumXParam=blockLayersTypeNumX;
      const blockLayersTypeNumYParam=blockLayersTypeNumY;
      const blockLayersTypePosXParam=blockLayersTypePosX;
      const blockLayersTypePosYParam=blockLayersTypePosY;
      const bloadHeaderParam=bloadHeader;
      const addFontDataHeaderParam=addFontDataHeader;
      const fontHeaderFirstParam=fontHeaderFirst;
      const fontHeaderLastParam=fontHeaderLast;
      const fontHeaderXParam=fontHeaderX;
      const fontHeaderYParam=fontHeaderY;
      const exportDataHeaderParam=exportDataHeader;
      const addIndexParam=addIndex;
      let strPtr=Module._GetArrayFromImage(base64Image.ptr, base64Image.length,dataTableNameParam.ptr,dataTableNameParam.length,imageWidthParam,imageHeightParam,numBlockXParam,numBlockYParam,paletteTypeParam.ptr,paletteTypeParam.length,startPosXParam,startPosYParam,gapXParam,gapYParam,bpcParam,exportArrayFormatParam.ptr,exportArrayFormatParam.length,useTransColorParam,transColorParam,useOpacityColorParam,opacityColorParam,inputPaletteColorsParam.ptr,inputPaletteColorsParam.length,palColoursCountParam,paletteOffsetParam,palette24bitParam,compressionMethodParam.ptr,compressionMethodParam.length,exportModeParam.ptr,exportModeParam.length,ditherMethodParam.ptr,ditherMethodParam.length,textDataFormatParam.ptr,textDataFormatParam.length,asmTypeParam.ptr,asmTypeParam.length,blockLayersTypeParam.ptr,blockLayersTypeParam.length,blockLayersTypeColorsParam.ptr,blockLayersTypeColorsParam.length,blockLayersTypeNumXParam,blockLayersTypeNumYParam,blockLayersTypePosXParam,blockLayersTypePosYParam,bloadHeaderParam,addFontDataHeaderParam,fontHeaderFirstParam,fontHeaderLastParam,fontHeaderXParam,fontHeaderYParam,exportDataHeaderParam,addIndexParam,skipEmptyBloksParam);
      let fnCallResult=readStringFromMemory(strPtr);
      let resultArray=fnCallResult.split("DATA--SEPARATOR--DATA");

  
      
      Module._ClearGetArrayFromImageAllocatedMemory(base64Image.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(dataTableNameParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(paletteTypeParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(inputPaletteColorsValues.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(compressionMethodParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(exportArrayFormatParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(exportModeParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(ditherMethodParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(textDataFormatParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(asmTypeParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(blockLayersTypeParam.ptr);
      Module._ClearGetArrayFromImageAllocatedMemory(blockLayersTypeColorsValues.ptr);
      Module._Free(strPtr);

      return resultArray;

}
Module.onRuntimeInitialized = function () {
  //console.log("Modulo WASM pronto per l'uso!");
  freeImageModuleIsReady=true;
  // Ora possiamo usare le funzioni esportate
  //testWasm();
};
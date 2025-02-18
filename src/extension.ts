/**
 * MSXDev Tool Extension for VS Code
 * Copyright (C) 2025  Fausto Pracek
 *
 * This file is part of MSXDev Tool Extension for VS Code.
 *
 * MSXDev Tool Extension for VS Code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MSXDev Tool Extension for VS Code is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MSXDev Tool Extension for VS Code. If not, see <https://www.gnu.org/licenses/>.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';


const os = require('os');







interface DataObject {
  Type: string;
  Subtype: string;
  ID: number;
  Description: string;
  Size: string;
  ChildObjectType: string;
  ChildObjectID: number | null;
  Values: object;
  FirstFontChar: string;
  LastFontChar: string;
  FontSpaces: string;
  EditingSettings?: object;
  TagName?: string;
}

let mainPanel: vscode.WebviewPanel | null = null;
let detailsPanel: vscode.WebviewPanel | null = null;
let targetedDetailsPanel: vscode.WebviewPanel | null = null;
let selectedCells: any[] = []; // Variable to store selected cells



export async function replaceTagInFiles(language: string, id: string, data: string) {
    const prefix = language === 'asm' ? '; ' : '// ';

    try {
        // Trova tutti i file del workspace
        const files = await vscode.workspace.findFiles('**/*');
        
        for (const file of files) {
            // Apri il file come TextDocument
            const doc = await vscode.workspace.openTextDocument(file);
            
            // Leggi il contenuto
            let content = doc.getText();
            let lines = content.split(/\r?\n/);
            let changed = false;
            
            let i = 0;
            while (i < lines.length) {
                const beginText = `${prefix}${id} BEGIN`;
                if (lines[i].includes(beginText)) {
                    const beginIndex = i;
                    i++;
                    
                    const endText = `${prefix}${id} END`;
                    while (i < lines.length && !lines[i].includes(endText)) {
                        i++;
                    }
                    
                    if (i < lines.length) {
                        const endIndex = i;
                        
                        // Righe da inserire
                        const dataLines = data.split(/\r?\n/);
         
                        // Sostituzione delle righe
                        lines.splice(
                            beginIndex + 1,
                            (endIndex - 1) - (beginIndex + 1) + 1,
                            ...dataLines
                        );
                        
                        i = beginIndex + 1 + dataLines.length + 1;
                        changed = true;
                    } else {
                        break; 
                    }
                } else {
                    i++;
                }
            }

            if (changed) {
                const newContent = lines.join('\n');

                // Qui costruiamo un WorkspaceEdit anziché scrivere solo su fs
                const edit = new vscode.WorkspaceEdit();

                // L'intero range del file è da 0 a content.length
                const fullRange = new vscode.Range(
                    doc.positionAt(0),
                    doc.positionAt(content.length)
                );

                // Applichiamo la sostituzione
                edit.replace(doc.uri, fullRange, newContent);

                // Applichiamo l'edit per aggiornare l'editor se il file è aperto
                await vscode.workspace.applyEdit(edit);

                // Opzionalmente salviamo anche su disco (se vuoi)
                //await doc.save();
            }
        }
    } catch (error) {
        console.error('Errore durante la sostituzione dei tag: ', error);
    }
}

function GetJSONData(){
  let loadedData: DataObject[] | null = null;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const folderPath = path.join(workspacePath, 'MSXDevToolExtension');
    const dataPath = path.join(folderPath, 'Objects.json');

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    if (!fs.existsSync(dataPath)) {
      const defaultData: DataObject[] = [
        {
          Type: "Palettes",
          Subtype: "",
          ID: 1,
          Description: "MSX Standard",
          Size: "",
          ChildObjectType: "",
          ChildObjectID: null,
          Values: getDefaultMSXColors(false),
          FirstFontChar: "",
          LastFontChar: "",
          FontSpaces: "",
          TagName: "MSXStandardPalette"
        },
        {
          Type: "Palettes",
          Subtype: "",
          ID: 2,
          Description: "MSX2 Standard",
          Size: "",
          ChildObjectType: "",
          ChildObjectID: null,
          Values: getDefaultMSXColors(true),
          FirstFontChar: "",
          LastFontChar: "",
          FontSpaces: "",
          TagName: "MSX2StandardPalette"
        }
      ];
      fs.writeFileSync(dataPath, JSON.stringify(defaultData), 'utf8');
      loadedData = defaultData;
    } else {
      const data = fs.readFileSync(dataPath, 'utf8');
      loadedData = JSON.parse(data);
    }
    
  } else {
    console.error('No workspace folder found');
  }
  return loadedData;
}


export function activate(context: vscode.ExtensionContext) {
  // Dispose of any open panels on activation
  if (mainPanel) {
    mainPanel.dispose();
    mainPanel = null;
  }
  if (detailsPanel) {
    detailsPanel.dispose();
    detailsPanel = null;
  }

  if (targetedDetailsPanel) {
    targetedDetailsPanel.dispose();
    targetedDetailsPanel = null;
  }

  let loadedData = GetJSONData();

  // Register the command
  const disposable = vscode.commands.registerCommand(
    'msxdevtool-extension.openWebview',
    () => {
      if (detailsPanel) {
        detailsPanel.reveal();
        return;
      }

      if (mainPanel) {
        mainPanel.reveal();
        mainPanel.webview.postMessage({
          command: 'loadDataStore',
          data: JSON.stringify(loadedData)
        });
        return;
      }

      initializeMainPanel(context, loadedData);
    }
  );

  context.subscriptions.push(disposable);

  // Register the view provider for the activity bar icon
  //const msxdevtoolViewProvider = new MSXDevToolViewProvider(context.extensionUri);
  //context.subscriptions.push(
  //  vscode.window.registerWebviewViewProvider(
  //    MSXDevToolViewProvider.viewType,
  //    msxdevtoolViewProvider
  //  )
  //);

  // Register the command to open the webview when the activity bar icon is clicked
  context.subscriptions.push(
    vscode.commands.registerCommand('msxdevtool.msxdevtoolView', () => {
      vscode.commands.executeCommand('msxdevtool-extension.openWebview');
    })
  );

  // Register the WebviewViewProvider for the view
  const webviewProvider = new MSXDevToolWebviewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('msxDevToolWebview', webviewProvider)
  );
}

//class MSXDevToolViewProvider implements vscode.WebviewViewProvider {
//  public static readonly viewType = 'msxdevtool.msxdevtoolView';
//
//  constructor(private readonly extensionUri: vscode.Uri) {}
//
//  public resolveWebviewView(
//    webviewView: vscode.WebviewView,
//    context: vscode.WebviewViewResolveContext,
//    _token: vscode.CancellationToken
//  ) {
//    initializeMainPanel({ extensionUri: this.extensionUri } as vscode.ExtensionContext, GetJSONData());
//  }
//}

class MSXDevToolWebviewProvider implements vscode.WebviewViewProvider {
  constructor(readonly contextParam: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getHtmlContent(); 
    // `getHtmlContent()` restituisce la tua pagina HTML 
    // con pulsante a tutta larghezza, sfondo azzurro, ecc.

    // Gestisci i messaggi dal webview e i comandi VS Code se serve...
    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'copyJsonDataToClipboard':
          vscode.env.clipboard.writeText(JSON.stringify(GetJSONData()));
          break;
        case 'openDesigner':
          if (!mainPanel && !detailsPanel) {
            initializeMainPanel(this.contextParam, GetJSONData());
          } else {
            if (mainPanel) {
              mainPanel.reveal();
            }
            if (detailsPanel) {
              detailsPanel.reveal();
            }
          }
          break;
      }
    });
  }

  
}

function getHtmlContent(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Open Designer</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
      }
      /* Semplice "bottone" di 100×24 con sfondo blu e testo bianco */
      .button {
        width: 100%;
        height: 28px;
        background-color: #007ACC; /* blu come da svg light */
        color: #ffffff;
        font-family: sans-serif;
        font-size: 16px;
        line-height: 24px;  /* per allineare verticalmente il testo */
        text-indent: 10px;  /* offset orizzontale del testo */
        box-sizing: border-box;
        text-align: center;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="button" onclick="openDesigner()">Open designer</div>
    <div class="button" style="margin-top:10px;background-color: #000000" onclick="copyJsonDataToClipboard()">Copy JSON data</div>
    <script>
      const vscode = acquireVsCodeApi();
      function openDesigner() {
        vscode.postMessage({ command: 'openDesigner' });
      }
      function copyJsonDataToClipboard() {
        vscode.postMessage({ command: 'copyJsonDataToClipboard' });
      }
    </script>
  </body>
  </html>
  `;
  
}

function initializeMainPanel(context: vscode.ExtensionContext, loadedData: DataObject[] | null) {
  mainPanel = vscode.window.createWebviewPanel(
    'msxDevToolExtension',     // Internal identifier
    'MSXDevTool',  // Visible title
    vscode.ViewColumn.One,     // Column to show the webview in
    {
      enableScripts: true,     // Allow scripts to run in the webview
      retainContextWhenHidden: true
    }
  );

  mainPanel.onDidDispose(() => {
    mainPanel = null;
    targetedDetailsPanel?.dispose();
    targetedDetailsPanel = null;
    detailsPanel?.dispose();
    detailsPanel = null;
  });

  detailsPanel?.onDidDispose(() => {
    targetedDetailsPanel?.dispose();
    targetedDetailsPanel = null;
    detailsPanel?.dispose();
    detailsPanel = null;
  });

  // Path to the HTML file in media/webview.html
  const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const scriptUri = mainPanel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "utils.js")
  );
  //htmlContent = htmlContent.replace(
  //  /<script\s+src=["'].*utils\.js["']\s*>/,
  //  `<script src="${scriptUri}">`
  //);

  const scriptThiefUri = mainPanel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "colorThief.js")
  );

  const MSXimgLibUri = mainPanel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "MSXimgLib.js")
  );
  
  //htmlContent = htmlContent.replace(
  //  /<script\s+src=["'].*colorThief\.js["']\s*>/,
  //  `<script src="${scriptThiefUri}">`
  //);

  
  const wasmPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'MSXimgLib.wasm');
  const wasmUri = mainPanel.webview.asWebviewUri(wasmPath).toString();






  htmlContent = htmlContent.replace('utils_js_URI', scriptUri.toString());
  //htmlContent = htmlContent.replace('initWasm_js_URI', wasmUri.toString());
  htmlContent = htmlContent.replace('thiefColor_js_URI', scriptThiefUri.toString());
  htmlContent = htmlContent.replace('MSXimgLib_js_URI', MSXimgLibUri.toString());
  htmlContent = htmlContent.replace('WASM_URI_PLACEHOLDER', wasmUri);

  // Set the HTML content in the panel
  mainPanel.webview.html = htmlContent;

  
  // Send the loaded data to the webview
  mainPanel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
      case 'CodeSynch':
        codeSync(message.language, message.id, message.data);
        return;
      case 'saveDataStore':
        saveDataToFile(message.data);
        return;
      case 'openDetailsView':
        openDetailsView(context, message.record, message.childRecord,null,"Details",message.dataStore);
        return;
      case 'openAnimationsDetailsView':
        openDetailsView(context, message.record, message.childRecord,message.spriteTilePaletteRecord,"Animations",message.dataStore);
        return;
      case 'openMapsDetailsView':  
        openDetailsView(context, message.record, message.childRecord,message.spriteTilePaletteRecord,"Maps",message.dataStore);  
        return;
      case 'closeDetailsView':
        closeDetailsView(context, message.record, message.action);
        return;
      case 'updateSelectedCells':
        selectedCells = message.selectedCells;
        return;
      case 'dispose':
        disposeExtension();
        return;
    }
  });
  loadedData=GetJSONData();
  mainPanel.webview.postMessage({
    command: 'loadDataStore',
    data: JSON.stringify(loadedData)
  });
}

function codeSync(language: string, id: string, data: string): void {
  replaceTagInFiles(language, id, data);
}

function openDetailsView(context: vscode.ExtensionContext, record: DataObject, childRecord: DataObject | null, spriteTilePaletteRecord: DataObject | null, type: string | null, dataStore:[] | null) {
  if (mainPanel) {
    mainPanel.dispose();
    mainPanel = null;
  }
  let internalPanelID="msxDetailsView";
  if(type==="Animations"){
    internalPanelID="msxAnimationsDetailsView";
  }else if(type==="Maps"){
    internalPanelID="msxMapsDetailsView";
  }

  let panelName="details.html";
  if(type==="Animations"){
    panelName="animations.html";
  }else if(type==="Maps"){
    panelName="maps.html";
  }

  detailsPanel = vscode.window.createWebviewPanel(
    internalPanelID,     // Internal identifier
    'MSX Objects editor',   // Visible title
    vscode.ViewColumn.One, // Column to show the webview in
    {
      enableScripts: true, // Allow scripts to run in the webview
      retainContextWhenHidden: true
    }
  );
  detailsPanel.onDidChangeViewState((e) => {
   if(detailsPanel?.active){
    targetedDetailsPanel?.dispose();
     targetedDetailsPanel = null;

   }
      
  });
  detailsPanel.onDidDispose(() => {
    detailsPanel = null;
    targetedDetailsPanel?.dispose();
    targetedDetailsPanel = null;
  });

  // Path to the HTML file in media/details.html
  const htmlPath = path.join(context.extensionPath, 'media', panelName);
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Path to the utils.js file
  const utilsPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'utils.js'));
  const utilsUri = detailsPanel.webview.asWebviewUri(utilsPath);

  // Replace the placeholder with the actual URI
  htmlContent = htmlContent.replace('src="./utils.js"', `src="${utilsUri}"`);

  // Set the HTML content in the panel
  detailsPanel.webview.html = htmlContent;

  // Send the data to the webview
  detailsPanel.webview.postMessage({
    command: 'loadDetails',
    record: record,
    childRecord: childRecord,
    bufferedCopiedCells: selectedCells,
    spriteTilePaletteRecord: spriteTilePaletteRecord,
    dataStore: dataStore
  });

  detailsPanel.webview.onDidReceiveMessage(message => {

    switch (message.command) {
      case 'openTargetedDetailsView':
        if(targetedDetailsPanel===null){
          openTargetedDetailsView(context, message.record, message.childRecord,null,"Details",message.dataStore,message.spriteTilePaletteRecord);
        }
        else{
          targetedDetailsPanel.reveal(vscode.ViewColumn.One);
        }
        return;
      case 'closeDetailsView':
        if (detailsPanel) {
          detailsPanel.dispose();
        }
        closeDetailsView(context, message.record, message.action);
        return;
      case 'updateSelectedCells':
        selectedCells = message.selectedCells;
        return;
    }
  });
}


function openTargetedDetailsView(context: vscode.ExtensionContext, record: DataObject, childRecord: DataObject | null, spriteTilePaletteRecord: DataObject | null, type: string | null, dataStore:[] | null, objectID:any) {
  //if (detailsPanel) {
  //  detailsPanel.dispose();
  //  detailsPanel = null;
  //}
  let internalPanelID="msxTergetedDetailsView";
  

  let panelName="details.html";
  

  targetedDetailsPanel = vscode.window.createWebviewPanel(
    internalPanelID,     // Internal identifier
    'MSX Objects editor',   // Visible title
    vscode.ViewColumn.One, // Column to show the webview in
    {
      enableScripts: true, // Allow scripts to run in the webview
      retainContextWhenHidden: true
    }
  );

  targetedDetailsPanel.onDidDispose(() => {
    targetedDetailsPanel = null;
  });

  // Path to the HTML file in media/details.html
  const htmlPath = path.join(context.extensionPath, 'media', panelName);
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Path to the utils.js file
  const utilsPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'utils.js'));
  const utilsUri = targetedDetailsPanel.webview.asWebviewUri(utilsPath);

  // Replace the placeholder with the actual URI
  htmlContent = htmlContent.replace('src="./utils.js"', `src="${utilsUri}"`);

  // Set the HTML content in the panel
  targetedDetailsPanel.webview.html = htmlContent;

  // Send the data to the webview
  targetedDetailsPanel.webview.postMessage({
    command: 'loadDetails',
    record: record,
    childRecord: childRecord,
    bufferedCopiedCells: selectedCells,
    spriteTilePaletteRecord: spriteTilePaletteRecord,
    dataStore: dataStore,
    objectID:objectID
  });
  targetedDetailsPanel.onDidDispose(() => {
    detailsPanel?.reveal(vscode.ViewColumn.One);
  });
  targetedDetailsPanel.webview.onDidReceiveMessage(message => {

    switch (message.command) {
      case 'updateRecord':
        updateDataRecordInFile(message.record);
        return;
        
      case 'closeDetailsView':
        
        closeDetailsView(context, message.record, message.action,true);
        
        detailsPanel?.webview.postMessage({
          command: 'returnFromTargetedDetails',
          record: message.record,
          action: message.action,
          data: message.record
        });
        
          targetedDetailsPanel?.dispose();
        
        return;
      case 'updateSelectedCells':
        selectedCells = message.selectedCells;
        return;
    }
  });
}


function loadDataFromFile(){
  var data = "";
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const folderPath = path.join(workspacePath, 'MSXDevToolExtension');
    const dataPath = path.join(folderPath, 'Objects.json');
    data = fs.readFileSync(dataPath, 'utf8');
  }
  return data;
}
function updateDataRecordInFile(record: DataObject){
  const data=loadDataFromFile();
   

    if (data!="") {
      const loadedData = JSON.parse(data);
      if (loadedData) {
        const index: number = loadedData.findIndex(
          (item: DataObject) => item.Type === record.Type && item.Subtype === record.Subtype && item.ID === record.ID
        );
        if (index !== -1) {
          loadedData[index].EditingSettings = record.EditingSettings;
          loadedData[index].Values = record.Values;
          saveDataToFile(JSON.stringify(loadedData));
        }
      }
    }
}
function closeDetailsView(context: vscode.ExtensionContext, record: DataObject, action: string, fromTargetedDetailPanel=false) {
  if(!fromTargetedDetailPanel){
    if (detailsPanel) {
      detailsPanel.dispose();
      detailsPanel = null;
    }
  }
 
  
  if (action !== 'unload') {
    initializeMainPanel(context, null);


    const data=loadDataFromFile();
   

    if (data!="") {
      const loadedData = JSON.parse(data);
      
      // Send the data to the webview
      if(mainPanel!=null && !fromTargetedDetailPanel){


        if (loadedData) {
            const index: number = loadedData.findIndex(
            (item: DataObject) => item.Type === record.Type && item.Subtype === record.Subtype && item.ID === record.ID
            );
          if (index !== -1) {
            loadedData[index].EditingSettings = record.EditingSettings;
            if(action === 'ok'){
              loadedData[index].Values = record.Values;
            }
            saveDataToFile(JSON.stringify(loadedData));
          }
        }
    

        if(!fromTargetedDetailPanel){
          mainPanel.webview.postMessage({
            command: 'returnFromDetails',
            record: record,
            action: action,
            data: JSON.stringify(loadedData)
          });
        }
       
      }
      
    }
  }
}

function saveDataToFile(data: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const folderPath = path.join(workspacePath, 'MSXDevToolExtension');
    const dataPath = path.join(folderPath, 'Objects.json');
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      fs.writeFileSync(dataPath, data, 'utf8');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  } else {
    console.error('No workspace folder found');
  }
}

function getDefaultMSXColors(isMSX2: boolean) {
  if (isMSX2) {
    return [
      { id: "0", color: "#000000" },
      { id: "1", color: "#010101" },
      { id: "2", color: "#21C842" },
      { id: "3", color: "#5EDC78" },
      { id: "4", color: "#5455ED" },
      { id: "5", color: "#7D76FC" },
      { id: "6", color: "#D4524D" },
      { id: "7", color: "#42EBF5" },
      { id: "8", color: "#FC5554" },
      { id: "9", color: "#FF7978" },
      { id: "A", color: "#D4C154" },
      { id: "B", color: "#E6CE80" },
      { id: "C", color: "#21B03B" },
      { id: "D", color: "#C95BBA" },
      { id: "E", color: "#CCCCCC" },
      { id: "F", color: "#FFFFFF" }
    ];
  } else {
    return [
      { id: "0", color: "#000000" },
      { id: "1", color: "#010101" },
      { id: "2", color: "#3EB849" },
      { id: "3", color: "#74D07D" },
      { id: "4", color: "#5955E0" },
      { id: "5", color: "#8076F1" },
      { id: "6", color: "#B95E51" },
      { id: "7", color: "#65DBEF" },
      { id: "8", color: "#DB6559" },
      { id: "9", color: "#FF897D" },
      { id: "A", color: "#CCC35E" },
      { id: "B", color: "#DED087" },
      { id: "C", color: "#3AA241" },
      { id: "D", color: "#B766B5" },
      { id: "E", color: "#CCCCCC" },
      { id: "F", color: "#FFFFFF" }
    ];
  }
}

export function deactivate() {
  // Questa funzione viene chiamata quando l'estensione viene disattivata
}

function disposeExtension() {
  if (mainPanel) {
    mainPanel.dispose();
    mainPanel = null;
  }
  if (detailsPanel) {
    detailsPanel.dispose();
    detailsPanel = null;
  }
  if (targetedDetailsPanel) {
    targetedDetailsPanel.dispose();
    targetedDetailsPanel = null;
  }
}





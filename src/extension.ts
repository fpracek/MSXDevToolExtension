import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
}

let mainPanel: vscode.WebviewPanel | null = null;
let detailsPanel: vscode.WebviewPanel | null = null;
let selectedCells: any[] = []; // Variable to store selected cells

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

  let loadedData: DataObject[] | null = null;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const folderPath = path.join(workspacePath, 'MSXDeseignerExtension');
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
          FontSpaces: ""
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
          FontSpaces: ""
        }
      ];
      fs.writeFileSync(dataPath, JSON.stringify(defaultData), 'utf8');
      console.log('Default data file created.');
      loadedData = defaultData;
    } else {
      const data = fs.readFileSync(dataPath, 'utf8');
      console.log('Data loaded from file:', data);
      loadedData = JSON.parse(data);
    }
  } else {
    console.error('No workspace folder found');
  }

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
}

function initializeMainPanel(context: vscode.ExtensionContext, loadedData: DataObject[] | null) {
  mainPanel = vscode.window.createWebviewPanel(
    'msxSpriteGridEditor',     // Internal identifier
    'MSX Objects editor',  // Visible title
    vscode.ViewColumn.One,     // Column to show the webview in
    {
      enableScripts: true,     // Allow scripts to run in the webview
      retainContextWhenHidden: true
    }
  );

  mainPanel.onDidDispose(() => {
    mainPanel = null;
  });

  // Path to the HTML file in media/webview.html
  const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const scriptUri = mainPanel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "utils.js")
  );
  htmlContent = htmlContent.replace(
    /<script\s+src=["'].*utils\.js["']\s*>/,
    `<script src="${scriptUri}">`
  );

  // Set the HTML content in the panel
  mainPanel.webview.html = htmlContent;

  // Send the loaded data to the webview
  mainPanel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
      case 'saveDataStore':
        saveDataToFile(message.data);
        return;
      case 'openDetailsView':
        openDetailsView(context, message.record, message.childRecord);
        return;
      case 'closeDetailsView':
        closeDetailsView(context, message.record, message.action);
        return;
      case 'updateSelectedCells':
        selectedCells = message.selectedCells;
        console.log('Selected cells updated:', selectedCells);
        return;
    }
  });

  mainPanel.webview.postMessage({
    command: 'loadDataStore',
    data: JSON.stringify(loadedData)
  });
}

function openDetailsView(context: vscode.ExtensionContext, record: DataObject, childRecord: DataObject | null) {
  if (mainPanel) {
    mainPanel.dispose();
    mainPanel = null;
  }

  detailsPanel = vscode.window.createWebviewPanel(
    'msxDetailsView',     // Internal identifier
    'MSX Objects editor',   // Visible title
    vscode.ViewColumn.One, // Column to show the webview in
    {
      enableScripts: true, // Allow scripts to run in the webview
      retainContextWhenHidden: true
    }
  );

  detailsPanel.onDidDispose(() => {
    detailsPanel = null;
  });

  // Path to the HTML file in media/details.html
  const htmlPath = path.join(context.extensionPath, 'media', 'details.html');
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
    bufferedCopiedCells: selectedCells
  });

  detailsPanel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
      case 'closeDetailsView':
        if (detailsPanel) {
          detailsPanel.dispose();
        }
        closeDetailsView(context, message.record, message.action);
        return;
      case 'updateSelectedCells':
        selectedCells = message.selectedCells;
        console.log('Selected cells updated:', selectedCells);
        return;
    }
  });
}

function closeDetailsView(context: vscode.ExtensionContext, record: DataObject, action: string) {
  if (detailsPanel) {
    detailsPanel.dispose();
    detailsPanel = null;
  }
  
  if (action !== 'unload') {
    initializeMainPanel(context, null);

    // Reload data from file
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      const folderPath = path.join(workspacePath, 'MSXDeseignerExtension');
      const dataPath = path.join(folderPath, 'Objects.json');
      const data = fs.readFileSync(dataPath, 'utf8');
      const loadedData = JSON.parse(data);

      // Send the data to the webview
      if(mainPanel!=null){


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
    
        console.log('Data reloaded from file:', loadedData);


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

function saveDataToFile(data: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const folderPath = path.join(workspacePath, 'MSXDeseignerExtension');
    const dataPath = path.join(folderPath, 'Objects.json');
    console.log(`Saving data to: ${dataPath}`);
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      fs.writeFileSync(dataPath, data, 'utf8');
      console.log('Data saved successfully.');
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

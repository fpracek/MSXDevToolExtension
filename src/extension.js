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

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
  console.log('Extension "MSXDevToolExtension" is now active!');

  let loadedData = null;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const folderPath = path.join(workspacePath, 'MSXDeseignerExtension');
    const dataPath = path.join(folderPath, 'Objects.json');

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    if (!fs.existsSync(dataPath)) {
      const defaultData = [
        {
          Type: "Palettes",
          Subtype: "",
          ID: 1,
          Description: "MSX Standard",
          Size: "",
          ChildObjectType: "",
          ChildObjectID: null,
          Values: JSON.stringify(getDefaultMSXColors(false)),
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
          Values: JSON.stringify(getDefaultMSXColors(true)),
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

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openWebview', () => {
      const panel = vscode.window.createWebviewPanel(
        'yourWebviewType',
        'MSX Dev Tool',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case 'saveDataStore':
            saveDataToFile(message.data);
            return;
        }
      });

      panel.webview.postMessage({
        command: 'loadDataStore',
        data: JSON.stringify(loadedData)
      });
    })
  );

  vscode.window.registerWebviewPanelSerializer('yourWebviewType', {
    async deserializeWebviewPanel(webviewPanel, state) {
      webviewPanel.webview.html = getWebviewContent();
      webviewPanel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case 'saveDataStore':
            saveDataToFile(message.data);
            return;
        }
      });

      webviewPanel.webview.postMessage({
        command: 'loadDataStore',
        data: JSON.stringify(loadedData)
      });
    }
  });
}

function saveDataToFile(data) {
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

function getDefaultMSXColors(isMSX2) {
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

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>MSX Dev Tool</title>
    </head>
    <body>
      <h1>MSX Dev Tool</h1>
      <button id="saveButton">Save Data</button>
      <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('saveButton').addEventListener('click', () => {
          console.log("Saving dataStore...");
          vscode.postMessage({
            command: 'saveDataStore',
            data: JSON.stringify({ key: 'value' }) // Example data
          });
        });
      </script>
    </body>
    </html>
  `;
}

exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate
};

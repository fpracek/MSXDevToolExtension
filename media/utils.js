function getImageFromObject(id, objectRecord, paletteRecord, onlyMatrix = -1) {
  // Deserializza l'attributo Values di paletteRecord
  const paletteValues = paletteRecord.Values;
  
  // Crea un array di tutti gli ID del paletteRecord con colore #000000
  const transparentColorsID = paletteValues.filter(color => color.color === "#000000").map(color => color.id);
  
  // Crea un array di tutti gli ID del paletteRecord
  const paletteColors = paletteValues.map(color => color.color);
  
  // Deserializza l'attributo Values di objectRecord
  const objectInfo = objectRecord.Values;
  
  // Individua il pattern in Values di objectInfo con ID uguale a quello ricevuto come parametro
  const pattern = objectInfo.find(o => o.ID === id);
  
  // Memorizza in una matrice di dimensioni dell'immagine da creare tutti i valori previsti
  const [width, height] = objectRecord.Size.split('x').map(Number);
  const tempImageMatrix = Array.from({ length: height }, () => Array(width).fill("0"));
  
  // Popola tempImageMatrix con i valori della matrice con ID=1 o con ID=onlyMatrix se specificato
  const baseMatrixID = onlyMatrix > 0 ? onlyMatrix : 1;
  const baseMatrix = pattern.Matrices.find(m => m.ID === baseMatrixID);
  baseMatrix.Values.forEach(cell => {
    tempImageMatrix[cell.PosY][cell.PosX] = cell.Value.toString(16).toUpperCase();
  });
  
  // Se onlyMatrix è maggiore di 0, non analizzare le altre matrici
  if (onlyMatrix <= 0) {
    // Analizza le matrici con ID maggiore di 1
    pattern.Matrices.filter(m => m.ID > 1).forEach(matrix => {
      
      matrix.Values.forEach(cell => {
        
        const currentValue = tempImageMatrix[cell.PosY][cell.PosX];
        const newValue = cell.Value.toString().toUpperCase();
        
        if (transparentColorsID.includes(currentValue)) {
          tempImageMatrix[cell.PosY][cell.PosX] = newValue;
        } else {
          const orOption = matrix.OrOptions.find(o => o.Row === cell.PosY).Status;
          if (orOption) {
            tempImageMatrix[cell.PosY][cell.PosX] = orTable[currentValue][newValue];
          }
        }
      });
    });
  }

  // Crea l'immagine transcodificando i codici colori di tempImageMatrix con i colori presenti in paletteRecord
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Disabilita l'interpolazione per immagini più nitide
  ctx.imageSmoothingEnabled = false;

  const imageData = ctx.createImageData(width, height);
  
  tempImageMatrix.forEach((row, y) => {
    row.forEach((value, x) => {
      const color = paletteColors[parseInt(value, 16)];
      const [r, g, b, a] = hexToRgb(color);
      const index = (y * width + x) * 4;
      imageData.data[index] = r;
      imageData.data[index + 1] = g;
      imageData.data[index + 2] = b;
      imageData.data[index + 3] = a; // Alpha channel
    });
  });
  
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

const orTable = {
  "0": { "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "A": "A", "B": "B", "C": "C", "D": "D", "E": "E", "F": "F" },
  "1": { "0": "1", "1": "1", "2": "3", "3": "3", "4": "5", "5": "5", "6": "7", "7": "7", "8": "9", "9": "9", "A": "B", "B": "B", "C": "D", "D": "D", "E": "F", "F": "F" },
  "2": { "0": "2", "1": "3", "2": "2", "3": "3", "4": "6", "5": "7", "6": "6", "7": "7", "8": "A", "9": "B", "A": "A", "B": "B", "C": "E", "D": "F", "E": "E", "F": "F" },
  "3": { "0": "3", "1": "3", "2": "3", "3": "3", "4": "7", "5": "7", "6": "7", "7": "7", "8": "B", "9": "B", "A": "B", "B": "B", "C": "F", "D": "F", "E": "F", "F": "F" },
  "4": { "0": "4", "1": "5", "2": "6", "3": "7", "4": "4", "5": "5", "6": "6", "7": "7", "8": "C", "9": "D", "A": "E", "B": "F", "C": "C", "D": "D", "E": "E", "F": "F" },
  "5": { "0": "5", "1": "5", "2": "7", "3": "7", "4": "5", "5": "5", "6": "7", "7": "7", "8": "D", "9": "D", "A": "F", "B": "F", "C": "D", "D": "D", "E": "F", "F": "F" },
  "6": { "0": "6", "1": "7", "2": "6", "3": "7", "4": "6", "5": "7", "6": "6", "7": "7", "8": "E", "9": "F", "A": "E", "B": "F", "C": "E", "D": "F", "E": "E", "F": "F" },
  "7": { "0": "7", "1": "7", "2": "7", "3": "7", "4": "7", "5": "7", "6": "7", "7": "7", "8": "F", "9": "F", "A": "F", "B": "F", "C": "F", "D": "F", "E": "F", "F": "F" },
  "8": { "0": "8", "1": "9", "2": "A", "3": "B", "4": "C", "5": "D", "6": "E", "7": "F", "8": "8", "9": "9", "A": "A", "B": "B", "C": "C", "D": "D", "E": "E", "F": "F" },
  "9": { "0": "9", "1": "9", "2": "B", "3": "B", "4": "D", "5": "D", "6": "F", "7": "F", "8": "9", "9": "9", "A": "B", "B": "B", "C": "D", "D": "D", "E": "F", "F": "F" },
  "A": { "0": "A", "1": "B", "2": "A", "3": "B", "4": "E", "5": "F", "6": "E", "7": "F", "8": "A", "9": "B", "A": "A", "B": "B", "C": "E", "D": "F", "E": "E", "F": "F" },
  "B": { "0": "B", "1": "B", "2": "B", "3": "B", "4": "F", "5": "F", "6": "F", "7": "F", "8": "B", "9": "B", "A": "B", "B": "B", "C": "F", "D": "F", "E": "F", "F": "F" },
  "C": { "0": "C", "1": "D", "2": "E", "3": "F", "4": "C", "5": "D", "6": "E", "7": "F", "8": "C", "9": "D", "A": "E", "B": "F", "C": "C", "D": "D", "E": "E", "F": "F" },
  "D": { "0": "D", "1": "D", "2": "F", "3": "F", "4": "D", "5": "D", "6": "F", "7": "F", "8": "D", "9": "D", "A": "F", "B": "F", "C": "D", "D": "D", "E": "F", "F": "F" },
  "E": { "0": "E", "1": "F", "2": "E", "3": "F", "4": "E", "5": "F", "6": "E", "7": "F", "8": "E", "9": "F", "A": "E", "B": "F", "C": "E", "D": "F", "E": "E", "F": "F" },
  "F": { "0": "F", "1": "F", "2": "F", "3": "F", "4": "F", "5": "F", "6": "F", "7": "F", "8": "F", "9": "F", "A": "F", "B": "F", "C": "F", "D": "F", "E": "F", "F": "F" }
};



function rgbToHex(rgb) {
  const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
  return result ? `#${((1 << 24) + (parseInt(result[1]) << 16) + (parseInt(result[2]) << 8) + parseInt(result[3])).toString(16).slice(1).toUpperCase()}` : rgb;
}

function hexToRgb(hex) {
  if (hex === "#000000") {
    return [0, 0, 0, 0]; // Transparent color
  }
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b, 255]; // Opaque color
}

function getContrastingColor(hex) {
  // Convert hex to RGB
  const rgb = hexToRgb(hex);
  // Calculate the brightness of the color
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  // Return black or white depending on the brightness
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

function computeBrightness(hex) {
  let c = hex.replace("#", "");
  if (c.length < 6) return 255;
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b);
}

function createColorGrid(container, paletteColors) {
  const triplets = [
    [1, 2, 3], [1, 4, 5], [1, 6, 7], [1, 8, 9], [1, 10, 11], [1, 12, 13], [1, 14, 15],
    [2, 4, 6], [2, 5, 7], [2, 8, 10], [2, 9, 11], [2, 12, 14], [2, 13, 15],
    [3, 4, 7], [3, 5, 7], [3, 6, 7], [3, 8, 11], [3, 9, 11], [3, 10, 11], [3, 12, 15],
    [3, 13, 15], [3, 14, 15], [4, 8, 12], [4, 9, 13], [4, 10, 14], [4, 11, 15],
    [5, 6, 7], [5, 8, 13], [5, 9, 13], [5, 10, 15], [5, 11, 15], [5, 12, 13], [5, 14, 15],
    [6, 8, 14], [6, 9, 15], [6, 10, 14], [6, 11, 15], [6, 12, 14], [6, 13, 15],
    [7, 8, 15], [7, 9, 15], [7, 10, 15], [7, 11, 15], [7, 12, 15], [7, 13, 15], [7, 14, 15],
    [9, 10, 11], [9, 12, 13], [9, 14, 15], [10, 12, 14], [10, 13, 15], [11, 12, 15],
    [11, 13, 15], [11, 14, 15], [13, 14, 15]
  ];

  const containerWidth = container.clientWidth;
  const columnWidth = 100; // Assume each column is 100px wide
  const columns = Math.floor(containerWidth / columnWidth);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  grid.style.overflowY = 'auto';

  triplets.forEach(triplet => {
    const tripletDiv = document.createElement('div');
    tripletDiv.style.border = '1px solid #ccc';
    tripletDiv.style.padding = '10px';
    tripletDiv.style.margin = '5px';
    tripletDiv.style.textAlign = 'center';
    tripletDiv.style.cursor = 'pointer';

    tripletDiv.innerHTML = `
      <div style="background-color: ${paletteColors[triplet[0]]}; color: ${getContrastingColor(paletteColors[triplet[0]])};">${triplet[0]}</div>
      <div style="background-color: ${paletteColors[triplet[1]]}; color: ${getContrastingColor(paletteColors[triplet[1]])};">${triplet[1]}</div>
      <div style="background-color: ${paletteColors[triplet[2]]}; color: ${getContrastingColor(paletteColors[triplet[2]])};">${triplet[0]} + ${triplet[1]} = ${triplet[2]}</div>
    `;

    tripletDiv.addEventListener('click', () => {
      document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
      tripletDiv.classList.add('focused');
    });

    grid.appendChild(tripletDiv);
  });

  container.appendChild(grid);
}


//_____________________________________________________________________________
//   ▄▄   ▄ ▄  ▄▄▄ ▄▄ ▄ ▄                                                      
//  ██ ▀ ██▀█ ▀█▄  ▀█▄▀ ▄  ▄█▄█ ▄▀██                                           
//  ▀█▄▀ ██ █ ▄▄█▀ ██ █ ██ ██ █  ▀██                                           
//_______________________________▀▀____________________________________________
//
// by Guillaume "Aoineko" Blanchard (aoineko@free.fr)
// available on GitHub (https://github.com/aoineko-fr/MSXimg)
// under CC BY-SA license (https://creativecommons.org/licenses/by-sa/2.0/)

#pragma once

#define MSXi_VERSION "1.19.0"
#define LIBRARY_API 




	/// Image processing parameters
	struct ImagePocessingParameters
	{
		std::string inputImage;
		std::string exportType;
		std::string imageFormat;
		int startPosX;
		int startPosY;
		int sizeX;
		int sizeY;
		int gapX;
		int gapY;
		int numBlockX;
		int numBlockY;
		int bpc;
		std::string transColor;
		std::string opacityColor;
		std::string paletteType;
		std::string inputPaletteColors[16];
		std::string dataTableName;
		int palColoursCount;
		int paletteOffset;
		bool palette24bit;
		std::string compressionMethod;
		std::string ditherMethod;
		std::string textDataFormat;
		std::string asmType;
		std::string exportMode;
		bool skipEmptyBlock;
		bool indexTable;
		std::string copyrightText;
		bool exportDataHeader;
		bool addFontDataHeader;
		int fontHeaderFirst;
		int fontHeaderLast;
		int fontHeaderX;
		int fontHeaderY;
		int startAddress;
		bool addCDefine;
		int offset;
		bool noTitle;
		std::string blockLayersType;
		int blockLayersTypePosX;					///< Start X position for the layer (relative to block coordante)
		int blockLayersTypePosY;					///< Start Y position for the layer (relative to block coordante)
		int blockLayersTypeNumX;					///< Width of the layer (in sprite size unit)
		int blockLayersTypeNumY;					///< Height of the layer (in sprite size unit)
		std::string blockLayersTypeColors[16];
		bool bloadHeader;
		bool tilesCompression;
		bool gm2CompressionNames;
		bool tilesUnique;
		bool gm2Unique;
		bool noTilesName;
		bool noTilesPattern;
		bool noTilesColor;

		ImagePocessingParameters()
		{
			blockLayersTypeColors[0] = {};
			blockLayersTypeColors[1] = {};
			blockLayersTypeColors[2] = {};
			blockLayersTypeColors[3] = {};
			blockLayersTypeColors[4] = {};
			blockLayersTypeColors[5] = {};
			blockLayersTypeColors[6] = {};
			blockLayersTypeColors[7] = {};
			blockLayersTypeColors[8] = {};
			blockLayersTypeColors[9] = {};
			blockLayersTypeColors[10] = {};
			blockLayersTypeColors[11] = {};
			blockLayersTypeColors[12] = {};
			blockLayersTypeColors[13] = {};
			blockLayersTypeColors[14] = {};
			blockLayersTypeColors[15] = {};
			inputPaletteColors[0] = {};
			inputPaletteColors[1] = {};
			inputPaletteColors[2] = {};
			inputPaletteColors[3] = {};
			inputPaletteColors[4] = {};
			inputPaletteColors[5] = {};
			inputPaletteColors[6] = {};
			inputPaletteColors[7] = {};
			inputPaletteColors[8] = {};
			inputPaletteColors[9] = {};
			inputPaletteColors[10] = {};
			inputPaletteColors[11] = {};
			inputPaletteColors[12] = {};
			inputPaletteColors[13] = {};
			inputPaletteColors[14] = {};
			inputPaletteColors[15] = {};
			inputImage = "";
			exportType = "c";
			imageFormat = "auto";
			startPosX = 0;
			startPosY = 0;
			sizeX = 0;
			sizeY = 0;
			gapX = 0;
			gapY = 0;
			numBlockX = 1;
			numBlockY = 1;
			bpc = 8;
			transColor = "0x000000";
			opacityColor = "0x000000";
			paletteType = "msx1";
			dataTableName = "";
			palColoursCount = -1;
			paletteOffset = 1;
			palette24bit = false;
			compressionMethod = "";
			ditherMethod = "none";
			textDataFormat = "hexa0x";
			asmType = "sjasm";
			exportMode = "";
			skipEmptyBlock = false;
			indexTable = false;
			copyrightText = "";
			exportDataHeader = false;
			addFontDataHeader = false;
			fontHeaderFirst = 0;
			fontHeaderLast = 0;
			fontHeaderX = 0;
			fontHeaderY = 0;
			startAddress = 0;
			addCDefine = false;
			offset = 0;
			noTitle = false;
			blockLayersType = "";
			bloadHeader = false;
			tilesCompression = false;
			gm2CompressionNames = false;
			tilesUnique = false;
			gm2Unique = false;
			noTilesName = false;
			noTilesPattern = false;
			noTilesColor = false;
			blockLayersTypePosX = 0;
			blockLayersTypePosY = 0;
			blockLayersTypeNumX = 0;
			blockLayersTypeNumY = 0;
		}
	};
	/// Image processing
	/// @param params Image processing parameters
	/// @param exitMessage Exit message
	/// @param exportedData Exported data
	/// @return 0 if succeed, -1 if failed
	LIBRARY_API int ImagePocessing(const ImagePocessingParameters& params, std::string &exitMessage, std::string &exportedData);



/// Header structure
struct MSXi_Header
{
	unsigned short sizeX;			///< Width of each image
	unsigned short sizeY;			///< Height of each image
	unsigned short numX;			///< Number of columns of images
	unsigned short numY;			///< Number of rows of images
	unsigned char bpc;				///< Bits-per-colors
	unsigned char comp;				///< Compressor ID @see MSXi_Compressor
	unsigned char bSkipEmpty;		///< Tell is empty blocks have been skipped or not
};

/// Font structure
struct MSXi_Font
{
	unsigned char dataSize;			///< Data size [x|y]
	unsigned char fontSize;			///< Font size [x|y]
	unsigned char firstChr;			///< First character ASCII code
	unsigned char lastChe;			///< Last character ASCII code
};

/// No entry flag
#define MSXi_NO_ENTRY	0x8000
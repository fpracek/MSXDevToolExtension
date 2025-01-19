// ____________________________
// ██▀▀█▀▀██▀▀▀▀▀▀▀█▀▀█        │  ▄              
// ██  ▀  █▄  ▀██▄ ▀ ▄█ ▄▀▀ █  │  ▄  ▄█▄█ ▄▀██   
// █  █ █  ▀▀  ▄█  █  █ ▀▄█ █▄ │  ██ ██ █  ▀██   
// ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀────────┘           ▀▀
//  by Guillaume "Aoineko" Blanchard (aoineko@free.fr)
//  available on GitHub (https://github.com/aoineko-fr/MSXgl/tree/main/tools/MSXtk)
//  under CC-BY-SA free license (https://creativecommons.org/licenses/by-sa/2.0/)
//─────────────────────────────────────────────────────────────────────────────
// by Guillaume "Aoineko" Blanchard (aoineko@free.fr)
// available on GitHub (https://github.com/aoineko-fr/MSXimg)
// under CC-BY-AS license (https://creativecommons.org/licenses/by-sa/2.0/)

// std
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <string>
#include <vector>
// FreeImage
#include "FreeImage.h"
// MSXi
#include "MSXimgLib.h"
#include "types.h"
#include "color.h"
#include "exporter.h"
#include "image.h"
#include "parser.h"


#include <string>
#include <vector>
#include <cctype>

#include <napi.h>




Napi::Value ProcessImage(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  bool success = false;         
  std::string data;             
  std::string messages;         
  

  if (info.Length() < 23) {
    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, false));
    result.Set("data", Napi::String::New(env, ""));
    result.Set("messages", Napi::String::New(env, "Not enough arguments. They must be 23."));
	return result;
  }


  

  

  
  ImagePocessingParameters params;

  params.inputImage = info[0].As<Napi::String>();
  params.exportType = info[1].As<Napi::String>();
  params.startPosX = info[2].As<Napi::Number>().Int32Value();
  params.startPosY = info[3].As<Napi::Number>().Int32Value();
  params.sizeX = info[4].As<Napi::Number>().Int32Value();
  params.sizeY = info[5].As<Napi::Number>().Int32Value();
  params.gapX = info[6].As<Napi::Number>().Int32Value();
  params.gapY = info[7].As<Napi::Number>().Int32Value();
  params.numBlockX = info[8].As<Napi::Number>().Int32Value();
  params.numBlockY = info[9].As<Napi::Number>().Int32Value();
  params.bpc = info[10].As<Napi::Number>().Int32Value();
  params.transColor = info[11].As<Napi::String>();
  params.opacityColor = info[12].As<Napi::String>();
  {
    Napi::Array arr = info[13].As<Napi::Array>();
	if (arr.Length() <= 16){
	  for (uint32_t i = 0; i < arr.Length() && i < 16; ++i) {
	    params.inputPaletteColors[i] = arr.Get(i).As<Napi::String>();
	  }
    }
 
    
  }
  params.paletteOffset = info[14].As<Napi::Number>().Int32Value();
  params.asmType = info[15].As<Napi::String>();
  params.exportMode = info[16].As<Napi::String>();
  params.skipEmptyBlock = info[17].As<Napi::Boolean>();
  params.copyrightText = info[18].As<Napi::String>();
  params.fontHeaderFirst = info[19].As<Napi::Number>().Int32Value();
  params.fontHeaderLast = info[20].As<Napi::Number>().Int32Value();
  params.fontHeaderX = info[21].As<Napi::Number>().Int32Value();
  params.fontHeaderY = info[22].As<Napi::Number>().Int32Value();


  int callResult = ImagePocessing(params, &messages, &data);

  Napi::Object result = Napi::Object::New(env);
  result.Set("success", Napi::Boolean::New(env, callResult>0));
  result.Set("data", Napi::String::New(env, data));
  result.Set("messages", Napi::String::New(env, messages));


  return result;

}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("processImage", Napi::Function::New(env, ProcessImage));
  return exports;
}

NODE_API_MODULE(addon, Init)



/// Check if filename contains the given extension
bool HaveExt(const std::string& str, const std::string& ext)
{
	return str.find(ext) != std::string::npos;
}

/// Remove the filename extension (if any)
std::string RemoveExt(const std::string& str)
{
	size_t lastdot = str.find_last_of(".");
	if (lastdot == std::string::npos)
		return str;
	return str.substr(0, lastdot);
}

/// Check if a file exist
bool FileExists(const std::string& filename)
{
	FILE* file;
	file = fopen(filename.c_str(), "r");
	if (file != NULL)
	{
		fclose(file);
		return true;
	}
	return false;
}



int ImagePocessing(const ImagePocessingParameters& params, std::string &exitMessage, std::string &exportedData)
{
	std::string strExitMessage;

	// for debug purpose
#ifdef DEBUG_ARGS
	argc = sizeof(ARGV) / sizeof(ARGV[0]); argv = ARGV;
#endif

	FreeImage_Initialise();

	MSX::FileFormat outFormat = MSX::FILEFORMAT_Auto;
	ExportParameters param;

	bool bAutoCompress = false;
	bool bBestCompress = false;

	// file name
	param.inputImage = params.inputImage;

	// Image format
	if (MSX::StrEqual(params.imageFormat, "auto"))
		outFormat = MSX::FILEFORMAT_Auto;
	else if (MSX::StrEqual(params.imageFormat, "c"))
		outFormat = MSX::FILEFORMAT_C;
	else if (MSX::StrEqual(params.imageFormat, "asm"))
		outFormat = MSX::FILEFORMAT_Asm;
	else if (MSX::StrEqual(params.imageFormat, "bas"))
		outFormat = MSX::FILEFORMAT_BASIC;
	else if (MSX::StrEqual(params.imageFormat, "bin"))
		outFormat = MSX::FILEFORMAT_Bin;



	// Start position
	param.posX = params.startPosX;
	param.posY = params.startPosY;

	// Size
	param.sizeX = params.sizeX;
	param.sizeY = params.sizeY;

	// Gap
	param.gapX = params.gapX;
	param.gapY = params.gapY;

	// Number of blocks
	param.numX = params.numBlockX;
	param.numY = params.numBlockY;

	// Byte per color
	param.bpc = params.bpc;

	// Transparent color
	if (params.transColor.c_str() != NULL) {
		if (sscanf(params.transColor.c_str(), "%i", &param.transColor) != 1) {
			strExitMessage="Error: Failed to parse transColor\n";
			*exitMessage = (char*)malloc(strExitMessage.size() + 1); 
			exitMessage = strExitMessage;
			return -1;
		}
		param.bUseTrans = true;
	}

	// Opacity color
	if (params.opacityColor.c_str() != NULL) {
		if (sscanf(params.opacityColor.c_str(), "%i", &param.opacityColor) != 1) {
			strExitMessage="Error: Failed to parse opacityColor\n";
			*exitMessage = (char*)malloc(strExitMessage.size() + 1);
			exitMessage = strExitMessage;
			return -1;
		}
		param.bUseOpacity = true;
	}

	// Palette type
	if (params.paletteType == "msx1") {
		param.palType = PALETTE_MSX1;
	}
	if (params.paletteType == "msx2") {
		param.palType = PALETTE_MSX2;
	}
	if (params.paletteType == "custom") {
		param.palType = PALETTE_Custom;
	}
	if (params.paletteType == "input") {
		param.palType = PALETTE_Input;
		param.palInput.clear();
		for (int i = 0; i < 16; i++) {
			u32 c24;
			if (sscanf(params.inputPaletteColors[i].c_str(), "%i", &c24) != 1) {
				strExitMessage= "Error: Failed to parse inputPaletteColors\n";
				*exitMessage = (char*)malloc(strExitMessage.size() + 1);
				exitMessage = strExitMessage;
				return -1;
			}
			param.palInput.push_back(c24);
		}
		

		
	}

	// table name
	param.tabName=params.dataTableName;

	// Pal colours count
	param.palCount = params.palColoursCount;

	// Palette offset
	param.palOffset = params.paletteOffset;

	// Palette 24 bits
	param.pal24 = params.palette24bit;

	// Compression method
	if (params.compressionMethod != "") {
		if (MSX::StrEqual(params.compressionMethod, "crop16"))
			param.comp = MSX::COMPRESS_Crop16;
		else if (MSX::StrEqual(params.compressionMethod, "cropline16"))
			param.comp = MSX::COMPRESS_CropLine16;
		else if (MSX::StrEqual(params.compressionMethod, "crop32"))
			param.comp = MSX::COMPRESS_Crop32;
		else if (MSX::StrEqual(params.compressionMethod, "cropline32"))
			param.comp = MSX::COMPRESS_CropLine32;
		else if (MSX::StrEqual(params.compressionMethod, "crop256"))
			param.comp = MSX::COMPRESS_Crop256;
		else if (MSX::StrEqual(params.compressionMethod, "cropline256"))
			param.comp = MSX::COMPRESS_CropLine256;
		else if (MSX::StrEqual(params.compressionMethod, "rle0"))
			param.comp = MSX::COMPRESS_RLE0;
		else if (MSX::StrEqual(params.compressionMethod, "rle4"))
			param.comp = MSX::COMPRESS_RLE4;
		else if (MSX::StrEqual(params.compressionMethod, "rle8"))
			param.comp = MSX::COMPRESS_RLE8;
		else if (MSX::StrEqual(params.compressionMethod, "rlep"))
			param.comp = MSX::COMPRESS_RLEp;
		else if (MSX::StrEqual(params.compressionMethod, "pletter"))
			param.comp = MSX::COMPRESS_Pletter;
		else if (MSX::StrEqual(params.compressionMethod, "auto"))
			bAutoCompress = true;
		else if (MSX::StrEqual(params.compressionMethod, "best"))
			bBestCompress = true;
		else
			param.comp = MSX::COMPRESS_None;
	}
	else {
		param.comp = MSX::COMPRESS_None;
	}
	// Dither method
	if (params.ditherMethod != "") {
		if (MSX::StrEqual(params.ditherMethod, "none"))
			param.dither = DITHER_None;
		else if (MSX::StrEqual(params.ditherMethod, "floyd"))
			param.dither = DITHER_Floyd;
		else if (MSX::StrEqual(params.ditherMethod, "bayer4"))
			param.dither = DITHER_Bayer4;
		else if (MSX::StrEqual(params.ditherMethod, "bayer8"))
			param.dither = DITHER_Bayer8;
		else if (MSX::StrEqual(params.ditherMethod, "bayer16"))
			param.dither = DITHER_Bayer16;
		else if (MSX::StrEqual(params.ditherMethod, "cluster6"))
			param.dither = DITHER_Cluster6;
		else if (MSX::StrEqual(params.ditherMethod, "cluster8"))
			param.dither = DITHER_Cluster8;
		else if (MSX::StrEqual(params.ditherMethod, "cluster16"))
			param.dither = DITHER_Cluster16;
	}
	else {
		param.dither = DITHER_None;
	}


	// Text data format
	if (params.textDataFormat != "") {
		if (MSX::StrEqual(params.textDataFormat, "dec"))
			param.format = MSX::DATAFORMAT_Decimal;
		else if (MSX::StrEqual(params.textDataFormat, "hexa"))
			param.format = MSX::DATAFORMAT_Hexa;
		else if (MSX::StrEqual(params.textDataFormat, "hexa0x"))
			param.format = MSX::DATAFORMAT_HexaC;
		else if (MSX::StrEqual(params.textDataFormat, "hexaH"))
			param.format = MSX::DATAFORMAT_HexaASM;
		else if (MSX::StrEqual(params.textDataFormat, "hexa$"))
			param.format = MSX::DATAFORMAT_HexaPascal;
		else if (MSX::StrEqual(params.textDataFormat, "hexa&H"))
			param.format = MSX::DATAFORMAT_HexaBasic;
		else if (MSX::StrEqual(params.textDataFormat, "hexa&"))
			param.format = MSX::DATAFORMAT_HexaAnd;
		else if (MSX::StrEqual(params.textDataFormat, "hexa#"))
			param.format = MSX::DATAFORMAT_HexaSharp;
		else if (MSX::StrEqual(params.textDataFormat, "hexaraw"))
			param.format = MSX::DATAFORMAT_HexaRaw;
		else if (MSX::StrEqual(params.textDataFormat, "bin"))
			param.format = MSX::DATAFORMAT_Binary;
		else if (MSX::StrEqual(params.textDataFormat, "bin0b"))
			param.format = MSX::DATAFORMAT_BinaryC;
		else if (MSX::StrEqual(params.textDataFormat, "binB"))
			param.format = MSX::DATAFORMAT_BinaryASM;
	}
	else {
		param.format = MSX::DATAFORMAT_HexaC;
	}
	// Assembly type
	if (params.asmType != "") {
		if (MSX::StrEqual(params.asmType, "sdasz80"))
			param.syntax = MSX::ASMSYNTAX_sdasz80;
		else if (MSX::StrEqual(params.asmType, "tniasm"))
			param.syntax = MSX::ASMSYNTAX_tniASM;
		else if (MSX::StrEqual(params.asmType, "asmsx"))
			param.syntax = MSX::ASMSYNTAX_asMSX;
		else if (MSX::StrEqual(params.asmType, "sjasm"))
			param.syntax = MSX::ASMSYNTAX_Sjasm;
	}
	else {
		param.syntax = MSX::ASMSYNTAX_Sjasm;
	}

	// Export mode
	if (params.exportMode != "") {
		if (MSX::StrEqual(params.exportMode, "bmp"))
			param.mode = MODE_Bitmap;
		else if (MSX::StrEqual(params.exportMode, "gm1"))
			param.mode = MODE_GM1;
		else if (MSX::StrEqual(params.exportMode, "gm2"))
			param.mode = MODE_GM2;
		else if (MSX::StrEqual(params.exportMode, "sprt"))
			param.mode = MODE_Sprite;
		//else if (MSX::StrEqual(params.exportMode, "mglv"))
		//	param.mode = MODE_MGLV;
	}
	else {
		param.mode = MODE_Bitmap;
	}
	// Skip empty block
	param.bSkipEmpty = params.skipEmptyBlock;

	// Index table
	param.bAddIndex= params.indexTable;

	// Copyright
	if (params.copyrightText != "") {
		param.bAddCopy = TRUE;
		param.copyrightText = params.copyrightText;
	}

	// Export data header
	param.bAddHeader = params.exportDataHeader;

	// Add font data header
	param.bAddFont = params.addFontDataHeader;
	if (param.bAddFont) {
		param.fontFirst = params.fontHeaderFirst;
		param.fontLast = params.fontHeaderLast;
		param.fontX = params.fontHeaderX;
		param.fontY = params.fontHeaderY;
	}
	// Start address
	if (params.startAddress != 0) {
		param.startAddr = params.startAddress;
		param.bStartAddr = true;
	}

	// Define
	param.bDefine = params.addCDefine;

	// Offset
	param.offset = params.offset;

	// No title
	param.bTitle = !params.noTitle;

	// Block layers
	if (params.blockLayersType!="") {
		Layer l;
		if (MSX::StrEqual(params.blockLayersType, "i8"))
		{
			l.size16 = false;
			l.include = true;
		}
		else if (MSX::StrEqual(params.blockLayersType, "i16"))
		{
			l.size16 = true;
			l.include = true;
		}
		else if (MSX::StrEqual(params.blockLayersType, "e8"))
		{
			l.size16 = false;
			l.include = false;
		}
		else if (MSX::StrEqual(params.blockLayersType, "e16"))
		{
			l.size16 = true;
			l.include = false;
		}
		l.posX = params.blockLayersTypePosX;
		l.posY = params.blockLayersTypePosY;
		l.numX = params.blockLayersTypeNumX;
		l.numY = params.blockLayersTypeNumY;
		l.colors.clear();
		for (int i = 0; i < 16; i++)
		{
			u32 c24;
			if (sscanf(params.blockLayersTypeColors[i].c_str(), "%i", &c24) != 1) {
				strExitMessage="Error: Failed to parse BlockLayersTypeColors\n";
				*exitMessage = (char*)malloc(strExitMessage.size() + 1);
				exitMessage = strExitMessage;
				return -1;
			}
			l.colors.push_back(c24);
		}
		
		
		
		if (l.colors.size() == 0)
		{
			if (l.include)
				l.colors.push_back(0xFFFFFF);
			else // LAYER_Exclude
				l.colors.push_back(0x000000);
		}
		param.layers.push_back(l);
	}
	// BLOAD header
	param.bBLOAD = params.bloadHeader;

	// GM1/2 names compression
	if (params.tilesCompression || params.gm2CompressionNames) {
		param.bTilesCompressNames = true;
	}

	// GM1/2 full export
	if (params.tilesUnique || params.gm2Unique) {
		param.bTilesUnique = true;
		param.bTilesName = false;
	}

	// GM2 include name table
	if (params.noTilesName) {
		param.bTilesName = false;
	}
	
	// GM2 include pattern table
	if (params.noTilesPattern) {
		param.bTilesPattern = false;
	}

	// GM2 include color table
	if (params.noTilesColor) {
		param.bTilesColor = false;
	}

	//-------------------------------------------------------------------------
	if (param.palCount < 0) // Set default palette count
	{
		if (param.bpc == 2)
			param.palCount = 4 - param.palOffset;
		else if (param.bpc == 4)
			param.palCount = 16 - param.palOffset;
	}

	// 
	//-------------------------------------------------------------------------
	// Determine a valid compression method according to input parameters
	if (bAutoCompress)
	{
		param.comp = MSX::COMPRESS_None;
		if ((param.sizeX != 0) && (param.sizeY != 0))
		{
			if (param.bUseTrans)
			{
				if ((param.bpc == 1) || (param.bpc == 2))
				{
					if ((param.sizeX <= 16) && (param.sizeY <= 16))
						param.comp = MSX::COMPRESS_Crop16;
					else if ((param.sizeX <= 32) && (param.sizeY <= 32))
						param.comp = MSX::COMPRESS_Crop32;
					else if ((param.sizeX <= 256) && (param.sizeY <= 256))
						param.comp = MSX::COMPRESS_Crop256;
				}
				else // bpc == 4 or 8
				{
					if ((param.sizeX <= 16) && (param.sizeY <= 16))
						param.comp = MSX::COMPRESS_CropLine16;
					else if ((param.sizeX <= 32) && (param.sizeY <= 32))
						param.comp = MSX::COMPRESS_CropLine32;
					else if ((param.sizeX <= 256) && (param.sizeY <= 256))
						param.comp = MSX::COMPRESS_CropLine256;
				}
			}
			else
			{
				if (param.bpc == 4)
					param.comp = MSX::COMPRESS_RLE4;
			}
		}
		//printf("Auto compress: %s method selected\n", GetCompressorName(param.comp));
	}

	//-------------------------------------------------------------------------
	// Search for best compressor according to input parameters
	if (bBestCompress)
	{
		//printf("Start benchmark to find the best compressor\n");
		static const MSX::Compressor compTable[] =
		{
			MSX::COMPRESS_None,
			MSX::COMPRESS_Crop16,
			MSX::COMPRESS_CropLine16,
			MSX::COMPRESS_Crop32,
			MSX::COMPRESS_CropLine32,
			MSX::COMPRESS_Crop256,
			MSX::COMPRESS_CropLine256,
			MSX::COMPRESS_RLE0,
			MSX::COMPRESS_RLE4,
			MSX::COMPRESS_RLE8
		};

		u32 bestSize = 0;
		MSX::Compressor bestComp = MSX::COMPRESS_None;

		for (u32 i = 0; i < numberof(compTable); i++)
		{
			param.comp = compTable[i];
			//printf("- Check %s... ", GetCompressorName(param.comp, true));
			if (IsCompressorCompatible(param.comp, param))
			{
				ExporterInterface* exp = new ExporterDummy(param.format, &param);
				std::string data;
				bool bSucceed = ParseImage(&param, exp, data);
				if (bSucceed)
				{
					//printf("Generated data: %i bytes\n", exp->GetTotalBytes());
					if ((bestSize == 0) || (exp->GetTotalBytes() < bestSize))
					{
						bestSize = exp->GetTotalBytes();
						bestComp = param.comp;
					}
				}
				else
				{
					//printf("Parse error!\n");
				}
				delete exp;
			}
			else
			{
				strExitMessage= "Compression not avaible!\n";
				*exitMessage = (char*)malloc(strExitMessage.size() + 1);
				exitMessage = strExitMessage;
				return -1;
			}
		}

		//printf("- Best compressor selected: %s\n", GetCompressorName(bestComp));
		param.comp = bestComp;
	}
	param.startAddr = params.startAddress;
	param.bAddHeader = param.startAddr > 0;



	//-------------------------------------------------------------------------
	// Validate parameters

	//.........................................................................
	strExitMessage = "";
	// Errors
	if (param.inputImage == "")
	{
		strExitMessage= "Error: Input image required!\n";
		*exitMessage = (char*)malloc(strExitMessage.size() + 1);
		exitMessage = strExitMessage;
		return -1;
	}
	
	if ((param.bpc != 1) && (param.bpc != 2) && (param.bpc != 4) && (param.bpc != 8) && (param.bpc != 16))
	{
	
		strExitMessage+="Error: Invalid bits-per-color value ("
			+ std::to_string(param.bpc)
			+ "). Only 1, 2, 4, 8 or 16-bits colors are supported!\n";
		*exitMessage = (char*)malloc(strExitMessage.size() + 1);
		exitMessage = strExitMessage;
		return -1;
	}
	if ((param.bAddCopy) && (!FileExists(param.copyrightText)))
	{
		std::string msg = "Error: Copyright file not found ("
			+ param.copyrightText
			+ ")!\n";
		*exitMessage = (char*)malloc(strExitMessage.size() + 1);
		exitMessage = strExitMessage;
		return -1;
	}
	if (param.bUseTrans && param.bUseOpacity)
	{
		strExitMessage= "Error: Transparency and Opacity can't be use together!\n";
		*exitMessage = (char*)malloc(strExitMessage.size() + 1);
		exitMessage = strExitMessage;
		return -1;
	}
	if (((param.bpc == 2) || (param.bpc == 4)) && (param.palCount < 1))
	{
		strExitMessage="Error: Palette count can't be less that 1 with 2-bits and 4-bits color mode!\n";
		*exitMessage = (char*)malloc(strExitMessage.size() + 1);
		exitMessage = strExitMessage;
		return -1;
	}

	//.........................................................................
	// Warnings
	std::string warningMessages;
	
	if ((param.sizeX == 0) || (param.sizeY == 0))
	{
		warningMessages.append("Warning: sizeX or sizeY is 0. The whole image will be exported.\n");
	}
	if (!param.bUseTrans && (param.comp & MSX::COMPRESS_Crop_Mask))
	{
		warningMessages.append("Warning: Crop compressor can't be use without transparency color. Crop compressor removed.\n");
		param.comp = MSX::COMPRESS_None;
	}
	if (!param.bUseTrans && (param.comp == MSX::COMPRESS_RLE0))
	{
		warningMessages.append("Warning: RLE0 compressor can't be use without transparency color. RLE0 compressor removed.\n");
		param.comp = MSX::COMPRESS_None;
	}
	if (((param.bpc == 1) || (param.bpc == 2)) && (param.comp & MSX::COMPRESS_RLE_Mask))
	{
		warningMessages.append("Warning: RLE compressor can be use only with 4 and 8-bits color format. RLE compressor removed.\n");
		param.comp = MSX::COMPRESS_None;
	}
	if ((param.bpc == 8) && (param.comp == MSX::COMPRESS_RLE4))
	{
		warningMessages.append("Warning: RLE4 compressor have no advantage with 8-bits color format. RLE8 compressor will be use instead.\n");
		param.comp = MSX::COMPRESS_RLE8;
	}
	if (!param.bUseTrans && param.bSkipEmpty)
	{
		warningMessages.append("Warning: -skip as no effect without transparency color.\n");
	}
	if ((param.bpc == 2) && (param.palOffset + param.palCount > 4))
	{
		std::string msg = "Warning: -paloffset is " + std::to_string(param.palOffset) + " and -palcount is " + std::to_string(param.palCount) + " but total can't be more than 4 with 2-bits color (color index 0 is always transparent). Continue with 4 as value.\n";
		warningMessages.append(msg);
		param.palCount = 4 - param.palOffset;
	}
	if ((param.bpc == 4) && (param.palOffset + param.palCount > 16))
	{
		std::string msg = "Warning: -paloffset is " + std::to_string(param.palOffset) + " and -palcount is " + std::to_string(param.palCount) + " but total can't be more than 16 with 4-bits color (color index 0 is always transparent). Continue with 16 as value.\n";
		warningMessages.append(msg);
		param.palCount = 16 - param.palOffset;
	}
	if ((param.dither != DITHER_None) && (param.bpc != 1))
	{
		std::string msg = "Warning: Dithering only work with 1-bit color format (current is " + std::to_string(param.bpc) + "-bits). Dithering value will be ignored.\n";
		warningMessages.append(msg);
	}

	*exitMessage = (char*)malloc(warningMessages.size() + 1);
	exitMessage=warningMessages;

	bool bSucceed = false;
	u32 size = 0;

	//-------------------------------------------------------------------------
	// Convert
	if ((param.inputImage != "") )
	{
		ExporterInterface* exp = NULL;
		if (outFormat == MSX::FILEFORMAT_C)
		{
			exp = new ExporterC(param.format, &param);
		}
		else if (outFormat == MSX::FILEFORMAT_Asm)
		{
			exp = new ExporterASM(param.format, &param);
		}
		else if (outFormat == MSX::FILEFORMAT_BASIC)
		{
			exp = new ExporterBASIC(param.format, &param);
		}
		else if (outFormat == MSX::FILEFORMAT_Bin)
		{
			exp = new ExporterBin(param.format, &param);
		}

		if (exp)
		{
			std::string data;
			bSucceed = ParseImage(&param, exp, data);
			*exportedData = (char*)malloc(data.size() + 1); // +1 per il terminatore null
			if (*exportedData != NULL) {
				exportedData=data;
			}
			
			size = exp->GetTotalBytes();
			delete exp;
		}
		
	}

	FreeImage_DeInitialise();
	

	return bSucceed ? param.startAddr + size : -1;
}

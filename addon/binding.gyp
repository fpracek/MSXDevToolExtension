{
  "targets": [
    {
      "target_name": "MSXimgLib",               
      "sources": [
        "cpp/MSXimgLib.cpp",
        "cpp/color.cpp",
        "cpp/exporter.cpp",
        "cpp/image.cpp",
        "cpp/lVGM.cpp",
        "cpp/MSXzip.cpp",
        "cpp/parser.cpp",
        "cpp/Pletter.cpp",
        "cpp/RLEp.cpp"
      ],
      "include_dirs": [
        "./cpp",
        "<!(node -p \"require('path').join(__dirname, 'libs', 'include')\")",
        "<!(node -p \"require('path').join(__dirname, '..', 'node_modules', 'node-addon-api')\")"                     
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS"
      ],
      "cflags_cc": [
        "-fexceptions",
        "-std=c++17"
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LANGUAGE_STANDARD": "c++17"
      },

      "conditions": [
       
        [
          "OS=='win'",
          {
            "libraries": [
              "..\\libs\\windows\\FreeImage.lib"
            ],
            "defines": ["_WINDOWS"]
          }
        ],

 
        [
          "OS=='mac' and 'arch'=='x64'",
          {
            "libraries": [
              "<!(node -p \"'-L' + require('path').join(__dirname, 'libs/osx')\")",
              "-lfreeimage"
            ],
            "defines": ["_MACOS", "_MACOS_X64"]
          }
        ],

       
        [
          "OS=='mac' and 'arch'=='arm64'",
          {
            "libraries": [
              "<!(node -p \"'-L' + require('path').join(__dirname, 'libs/darwin-arm64')\")",
              "-lfreeimage"
            ],
            "defines": ["_MACOS", "_MACOS_ARM64"]
          }
        ],


        [
          "OS=='linux' and 'arch'=='x64'",
          {
            "libraries": [
              "<!(node -p \"require('path').join(__dirname, 'libs/linux/libfreeimage.so.3')\")"
            ],
            "defines": ["_LINUX", "_LINUX_X64"]
          }
        ],


        [
          "OS=='linux' and 'arch'=='arm64'",
          {
            "libraries": [
              "<!(node -p \"require('path').join(__dirname, 'libs/aarch64/libfreeimage.so.3')\")"
            ],
            "defines": ["_LINUX", "_LINUX_ARM64"]
          }
        ]
      ]
    }
  ]
}

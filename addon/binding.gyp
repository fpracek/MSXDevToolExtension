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
        "<!(node -p \"require('path').join(__dirname, 'libs', 'include')\")"                                 
      ],
      
      "conditions": [
       
        [
          "OS=='win' and 'arch'=='x64'",
          {
            "libraries": [
              "../libs/windows/FreeImage.lib"
            ],
            "defines": ["_WINDOWS"]
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

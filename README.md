# Audio Alpaca

## What does it do?
Audio Alpaca is meant to format .wav files for use in **Logic Pro X untagged loops**. Logic requires that its samples must be 44100 HZ and <= 24 bit. Thus, Audio Alpaca reduces any overly deep .wav files and esures all .wav formatting is correct. Audio Alpaca can do more than this though! The software **filters out any .mid and instrument files** and dumps them into an organized directory named "SoundManagerDump", leaving your data 100% sound files. Audio Alpaca preserves .mp3 files and other common Logic Pro playable formats. Finally, Audio Alpaca can **filter out duplicate samples** you may have so you don't waste any space on your hard drive!

## Installing
Audio Alpaca is only OSX compatible. Find an installer for the current version [here](https://drive.google.com/open?id=11XHHExbhgrWE0sXKIWSwJOrhXx1hjWfV).

## Developing
### Installation
To install for dev, you must navigate into the root level directory and retrieve node dependencies with:
`npm install`

Next, compile the formatter python script with
`pyinstaller formatter/run.py -F --distpath formatter`

If this fails for you, [set up pyinstaller](https://www.pyinstaller.org/)

### Running
The project can be run from the root directory with
`npm start`

### Building
To build the .app file, run
`npm run make`

### Signing
To sign the app for distribution, add the following to packagerConfig in package.json
```     
"osxSign": {
  "identity": "Your Developer ID Application",
  "hardened-runtime": true,
  "entitlements": "entitlements.plist",
  "entitlements-inherit": "entitlements.plist"
},
"osxNotarize": {
  "appleId": "Your Email",
  "appleIdPassword": "Your Password"
},
```    

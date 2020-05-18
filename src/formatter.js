const ipcRenderer = require('electron').ipcRenderer;
var $ = require( "jquery" );
var sourcetoggle = false
var duplicatetoggle = false
var inputdir = ""
var outputdir = ""
var filecount = 0

ipcRenderer.on('selectInputDirectoryReply', (event, arg) => {
  inputdir = arg
  $("#inputdir").text(inputdir)
})

ipcRenderer.on('selectOutputDirectoryReply', (event, arg) => {
  outputdir = arg
  $("#outputdir").text(outputdir)
})

ipcRenderer.on('fileCount', (event, arg) => {
  filecount = arg
})

ipcRenderer.on('processFile', (event, arg) => {
  let percent = (arg.count/filecount) * 100
  $("#spinner").css({"stroke-dashoffset": (440 - (440 * percent) / 100)})
  $("#percent").text(Math.round(percent) + "%")
  $("#status").text("Formatting\n" + arg.count + "/" + filecount)
  $("#currentfile").text(arg.file)
})

ipcRenderer.on('scanFile', (event, arg) => {
  let percent = (arg.count/filecount) * 100
  $("#spinner").css({"stroke-dashoffset": (440 - (440 * percent) / 100)})
  $("#percent").text(Math.round(percent) + "%")
  $("#status").text("Scanning\n" + arg.count + "/" + filecount)
  $("#currentfile").text(arg.file)
})

ipcRenderer.on('completedFormat', (event, arg) => {
  $("#format").animate({opacity: "0"}, 200, function() {
    $("#format").addClass("hidden")
    $("#results").removeClass("hidden")
    $("#results").animate({opacity: "1"}, 200)
  });
  $("#summary").text("Formatted " + filecount + " files")
  let resultstring = ""
  if (arg.duplicates.length > 0) {
    resultstring += "Found " + arg.duplicates.length + " duplicates\n\n"
    for (let i = 0; i < arg.duplicates.length; i++) {
      resultstring += (arg.duplicates[i].removed + " duplicate of " +
                          arg.duplicates[i].duplicate + "\n")
    }
    resultstring += "\n\n"
  }
  if (arg.errors.length > 0) {
    resultstring += "Encountered " + arg.errors.length + " errors\n\n"
    for (let i = 0; i < arg.errors.length; i++) {
      resultstring += arg.errors[i] + "\n"
    }
  }
  $("#resultbox").text(resultstring)
})

$(document).ready(function() {
  $("#inputdir").click(function() {
    ipcRenderer.send('selectInputDirectory');
  })
  $("#outputdir").click(function() {
    if (sourcetoggle) {
      return
    }
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('selectOutputDirectory');
  })
  $("#duplicatetoggle").change(function(e) {
    duplicatetoggle = this.checked
    ipcRenderer.send('toggleDuplicate', duplicatetoggle);
  })
  $("#sourcetoggle").change(function() {
    sourcetoggle = this.checked
    if (sourcetoggle) {
      $("#outputdir").css({opacity: "0.3", cursor: "default"})
    } else {
      $("#outputdir").css({opacity: "1", cursor: "pointer"})
    }
    ipcRenderer.send('toggleSource', sourcetoggle);
  })
  $("#formatbutton").click(function() {
    if (inputdir == "" || (outputdir == "" && !sourcetoggle)) {
      return
    }
    $("#start").animate({opacity: "0"}, 200, function() {
      $("#start").addClass("hidden")
      $("#format").removeClass("hidden")
      $("#format").animate({opacity: "1"}, 200)
    });
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('startFormatting');
  })
  $("#cancel").click(function() {
    $("#format").animate({opacity: "0"}, 200, function() {
      $("#format").addClass("hidden")
      $("#start").removeClass("hidden")
      $("#start").animate({opacity: "1"}, 200)
    });
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('cancelFormatting');
  })
  $("#done").click(function() {
    $("#results").animate({opacity: "0"}, 200, function() {
      $("#results").addClass("hidden")
      $("#start").removeClass("hidden")
      $("#start").animate({opacity: "1"}, 200)
    });
  })
})

(function exportPremiereClipManifest() {
  function asNumber(value) {
    var n = Number(value);
    return isNaN(n) ? NaN : n;
  }

  function timeToSeconds(timeObj) {
    if (!timeObj) return NaN;

    if (typeof timeObj.seconds === "number") return timeObj.seconds;
    if (timeObj.seconds !== undefined) return asNumber(timeObj.seconds);

    if (typeof timeObj.ticks === "number") return timeObj.ticks / 254016000000;
    if (typeof timeObj.ticks === "string") return asNumber(timeObj.ticks) / 254016000000;

    return asNumber(timeObj);
  }

  function detectFrameRate(sequence) {
    try {
      if (sequence && sequence.getSettings) {
        var settings = sequence.getSettings();
        if (settings && settings.videoFrameRate) {
          if (typeof settings.videoFrameRate === "number") return settings.videoFrameRate;
          if (settings.videoFrameRate.seconds !== undefined) {
            var sec = asNumber(settings.videoFrameRate.seconds);
            if (!isNaN(sec) && sec > 0) return 1 / sec;
          }
          var fromValue = asNumber(settings.videoFrameRate);
          if (!isNaN(fromValue) && fromValue > 0) return fromValue;
        }
      }
    } catch (e) {}

    return 0;
  }

  function writeTextFile(path, content) {
    var file = new File(path);
    file.encoding = "UTF-8";
    file.lineFeed = "Unix";
    if (!file.open("w")) {
      throw new Error("Unable to open file for write: " + path);
    }
    file.write(content);
    file.close();
  }

  if (!app || !app.project) {
    alert("No active Premiere project.");
    return;
  }

  var sequence = app.project.activeSequence;
  if (!sequence) {
    alert("No active sequence. Please open a sequence and try again.");
    return;
  }

  if (!sequence.videoTracks || sequence.videoTracks.numTracks < 1) {
    alert("Active sequence has no video tracks.");
    return;
  }

  var track = sequence.videoTracks[0];
  var clips = [];

  for (var i = 0; i < track.clips.numItems; i++) {
    var clip = track.clips[i];
    var sourceIn = timeToSeconds(clip.inPoint);
    var sourceOut = timeToSeconds(clip.outPoint);
    var sequenceIn = timeToSeconds(clip.start);
    var sequenceOut = timeToSeconds(clip.end);

    if (isNaN(sourceIn) || isNaN(sourceOut) || isNaN(sequenceIn) || isNaN(sequenceOut)) {
      continue;
    }
    if (sourceOut <= sourceIn || sequenceOut <= sequenceIn) {
      continue;
    }

    clips.push({
      sourceIn: sourceIn,
      sourceOut: sourceOut,
      sequenceIn: sequenceIn,
      sequenceOut: sequenceOut
    });
  }

  clips.sort(function(a, b) {
    return (a.sequenceIn - b.sequenceIn) || (a.sourceIn - b.sourceIn);
  });

  var projectPath = app.project.path;
  if (!projectPath) {
    alert("Project path is unavailable. Save the project first.");
    return;
  }

  var projectFile = new File(projectPath);
  var outPath = projectFile.parent.fsName + "/clip_manifest.json";
  var manifest = {
    sequenceName: sequence.name || "Active Sequence",
    frameRate: detectFrameRate(sequence),
    clips: clips
  };

  writeTextFile(outPath, JSON.stringify(manifest, null, 2));
  alert("Exported clip manifest: " + outPath + " (" + clips.length + " clips)");
})();

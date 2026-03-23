export interface ClipEntry {
  sourceIn: number;
  sourceOut: number;
  sequenceIn: number;
  sequenceOut: number;
}

export interface ClipManifest {
  sequenceName: string;
  frameRate: number;
  clips: ClipEntry[];
}

export interface SrtCue {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
}

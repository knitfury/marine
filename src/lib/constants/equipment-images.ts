/**
 * Representative photos for each equipment type, sourced from Wikimedia
 * Commons via its `Special:FilePath` redirect (a stable MediaWiki feature
 * that serves the current file for a given filename without needing to
 * know its content-hashed storage path). Filenames were confirmed to exist
 * as real, indexed Commons file pages before use here - not invented.
 *
 * These are decorative/illustrative, not literal photos of Marine
 * Travelift's actual product line (which isn't publicly photographed under
 * a reusable license) - they depict the same general class of equipment
 * (mobile boat hoists, forklifts, hydraulic trailers) for a realistic
 * catalogue feel. Every consumer of these URLs (`Avatar`, `EquipmentImage`)
 * falls back gracefully on a load error, so a single broken link never
 * shows as a broken-image icon.
 */

const COMMONS_FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";

function commonsImage(filename: string, width = 1200): string {
  return `${COMMONS_FILE_PATH}${encodeURIComponent(filename)}?width=${width}`;
}

export const EQUIPMENT_TYPE_IMAGES: Record<string, string[]> = {
  "Mobile Boat Hoist": [
    commonsImage("Augustenborg Yachthavn - Travelift.jpg"),
    commonsImage("Boat lift, Port Edgar Marina - geograph.org.uk - 5004053.jpg"),
  ],
  "Self-Propelled Boat Hoist": [commonsImage("Augustenborg Yachthavn - Travelift.jpg")],
  Forklift: [commonsImage("Forklift.jpeg"), commonsImage("Forklift classes.JPG")],
  "Hydraulic Trailer": [commonsImage("Hydraulic multi axle trailer.jpg")],
};

/** Deterministically picks one of the candidate images for a type, varying by `seed` for some visual variety across records of the same type. */
export function pickEquipmentImage(equipmentType: string, seed: number): string | undefined {
  const options = EQUIPMENT_TYPE_IMAGES[equipmentType];
  if (!options || options.length === 0) return undefined;
  return options[seed % options.length];
}

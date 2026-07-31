/**
 * Utility to parse Spine .atlas files and extract texture image filenames.
 */
export function parseAtlasTextures(atlasText) {
    const textures = [];
    if (!atlasText) return textures;
    
    const lines = atlasText.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        
        // A page name line must start at column 0 (no leading whitespace)
        // and must NOT contain a colon (":").
        if (!rawLine.startsWith(' ') && !rawLine.startsWith('\t') && !line.includes(':')) {
            // Rule 1: Standard file extension match
            if (/\.(png|jpg|jpeg|webp|gif|webg)$/i.test(line)) {
                textures.push(line);
                continue;
            }
            
            // Rule 2: Followed immediately by unindented size: or format: properties
            if (i + 1 < lines.length) {
                const nextRawLine = lines[i + 1];
                if (nextRawLine.startsWith('size:') || nextRawLine.startsWith('format:') || nextRawLine.startsWith('filter:')) {
                    textures.push(line);
                }
            }
        }
    }
    return textures;
}

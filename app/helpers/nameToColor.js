module.exports = {
    nameToColor: (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 60%, 55%)`; // Pastel-ish color
    }
}

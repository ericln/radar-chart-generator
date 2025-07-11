export async function getClipboardData() {
    try {
        const csvData = await navigator.clipboard.readText();
        return csvData;
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        return null;
    }
}

export function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index].trim();
        });
        return obj;
    });
    return data;
}
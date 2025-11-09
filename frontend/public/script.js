function downloadJSON() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter') || '';
    const select_filter = urlParams.get('select_filter') || 'all';
    
    fetch(`/api/data?filter=${encodeURIComponent(filter)}&select_filter=${encodeURIComponent(select_filter)}`)
        .then(response => response.json())
        .then(data => {
            const hierarchicalData = getHierarchicalData(data);
            const jsonStr = JSON.stringify(hierarchicalData, null, 2);
            downloadFile(jsonStr, 'filtered_data.json', 'application/json');
        })
        .catch(error => {
            console.error('Error downloading JSON:', error);
            alert('Došlo je do greške pri preuzimanju JSON datoteke.');
        });
}

function downloadCSV() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter') || '';
    const select_filter = urlParams.get('select_filter') || 'all';
    
    fetch(`/api/data?filter=${encodeURIComponent(filter)}&select_filter=${encodeURIComponent(select_filter)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert("Nema podataka za preuzimanje!");
                return;
            }

            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','), 
                ...data.map(row =>
                    headers.map(field => `"${row[field] ?? ''}"`).join(',')
                )
            ];

            const csvStr = csvRows.join('\n');
            downloadFile(csvStr, 'filtered_data.csv', 'text/csv');
        })
        .catch(error => {
            console.error('Error downloading CSV:', error);
            alert('Došlo je do greške pri preuzimanju CSV datoteke.');
        });
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getHierarchicalData(data) {
    const countriesMap = {};

    data.forEach(row => {
        const countryName = row.drzava;

        if (!countriesMap[countryName]) {
            countriesMap[countryName] = {
                naziv: row.drzava,
                glavni_grad: row.glavni_grad,
                jezik: row.jezik,
                trajanje_putovanja: row.trajanje_putovanja,
                valuta: row.valuta,
                godina_posjete: row.godina_posjete,
                tip_putovanja: row.tip_putovanja,
                prijevoz: row.prijevoz,
                ocjena: row.ocjena,
                broj_stanovnika: row.broj_stanovnika,
                gradovi: []
            };
        }

        if (row.grad_naziv) {
            countriesMap[countryName].gradovi.push({
                grad_naziv: row.grad_naziv,
                broj_stanovnika: row.broj_stanovnika_grad,
                aktivnost: row.aktivnost
            });
        }
    });

    return Object.values(countriesMap);
}

document.addEventListener('DOMContentLoaded', function() {
    const downloadCsvBtn = document.getElementById('download-csv');
    const downloadJsonBtn = document.getElementById('download-json');

    if (downloadCsvBtn) downloadCsvBtn.addEventListener('click', downloadCSV);
    if (downloadJsonBtn) downloadJsonBtn.addEventListener('click', downloadJSON);
    
});
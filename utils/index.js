const XLSX = require('xlsx');
const {
    Chart,
    registerables
} = require('chart.js');


// Registro de componentes necessários para Chart.js
Chart.register(...registerables);

let globalData = [];
document.getElementById('file-input').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
        type: 'array'
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, {
        header: 1
    });


    // Gera o gráfico Doughnut
    const chartData = extractChartData(globalData);
    generateDoughnutChart(chartData.labels, chartData.values);
    // const chartData2 = extractChartData(globalData);
    // generateDoughnutChart2(chartData2.labels, chartData2.values);
    const chartData3 = extractChartDataSaldo(globalData);
    generateLineChart(chartData3.labels, chartData3.values);
    atualizarSaldosNoHTML(globalData)


    globalData = consolidateData(data); // Armazena os dados consolidados na variável global
    generateTable(globalData);
});

// Aglutina todos os Lançamentos duplicados em uma unica linha (pix realizado 4x) soma-se o valor deles e coloca-se em uma unica row
function consolidateData(data) {
    const headers = data[0];
    const launchIndex = headers.indexOf('Lançamento');
    const valueIndex = headers.indexOf('Valor');
    const consolidatedMap = {};
    const nonConsolidatedRows = [];

    data.slice(1).forEach(row => {
        const launch = row[launchIndex];
        let value = parseFloat(row[valueIndex].toString().replace('-', ''));

        if (launch === "Saldo do dia") {
             nonConsolidatedRows.push(row);
        } else {
            if (!consolidatedMap[launch]) {
                consolidatedMap[launch] = [...row];
                consolidatedMap[launch][valueIndex] = value; // Adiciona o valor corrigido
            } else {
                consolidatedMap[launch][valueIndex] += value;
            }
        }
    });

    const consolidatedData = [headers];
    for (const key in consolidatedMap) {
        consolidatedData.push(consolidatedMap[key]);
    }
    consolidatedData.push(...nonConsolidatedRows);

    return consolidatedData;
}

// Extrai labels e valores dos dados consolidados
function extractChartData(data) {
    const headers = data[0];
    const launchIndex = headers.indexOf('Lançamento');
    const valueIndex = headers.indexOf('Valor');
    const lancamento = headers.indexOf('Tipo Lançamento')

    const labels = [];
    const values = [];

    data.slice(1).forEach(row => {
        if (row[lancamento] == 'Saída') {
            labels.push(row[launchIndex]);
            values.push(row[valueIndex]);
        }
    });

    return {
        labels,
        values
    };
}
function extractChartDataSaldo(data) {
    const headers = data[0];
    const valueIndex = headers.indexOf('Valor');
    const lanca = headers.indexOf('Lançamento');
    const lancamento = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    const labels = [];
    const values = [];

    data.slice(1).forEach((row, index) => {
        if (row[lanca] == "Saldo do dia" && index < lancamento.length) {
            labels.push(lancamento[index]); // Adiciona apenas um item do array lancamento
            values.push(parseFloat(row[valueIndex])); // Certifique-se de que os valores são numéricos
        }
    });


    return {
        labels,
        values
    };
}

// Função para gerar gráfico tipo Doughnut
function generateDoughnutChart(labels, data) {
    const ctx = document.getElementById('myDoughnutChart').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return labels[context.dataIndex] + ': ' + data[context.dataIndex];
                        }
                    }
                }
            }
        }
    });
}
// function generateDoughnutChart2(labels, data) {
//     const ctx = document.getElementById('myDoughnutChart2').getContext('2d');

//     new Chart(ctx, {
//         type: 'doughnut',
//         data: {
//             labels: labels,
//             datasets: [{
//                 data: data,
//                 backgroundColor: [
//                     'rgba(255, 99, 132, 0.2)',
//                     'rgba(54, 162, 235, 0.2)',
//                     'rgba(255, 206, 86, 0.2)',
//                     'rgba(75, 192, 192, 0.2)',
//                     'rgba(153, 102, 255, 0.2)',
//                     'rgba(255, 159, 64, 0.2)'
//                 ],
//                 borderColor: [
//                     'rgba(255, 99, 132, 1)',
//                     'rgba(54, 162, 235, 1)',
//                     'rgba(255, 206, 86, 1)',
//                     'rgba(75, 192, 192, 1)',
//                     'rgba(153, 102, 255, 1)',
//                     'rgba(255, 159, 64, 1)'
//                 ],
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             responsive: true,
//             plugins: {
//                 legend: {
//                     position: 'top',
//                 },
//                 tooltip: {
//                     callbacks: {
//                         label: function (context) {
//                             return labels[context.dataIndex] + ': ' + data[context.dataIndex];
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }

function getSaldos(data){
    const headers = data[0];
    const valueIndex = headers.indexOf('Valor');
    const lanca = headers.indexOf('Lançamento');

    let saldoAnterior;
    let saldoDoDia;

    data.slice(1).forEach((row) => {
        const lancamento = row[lanca];
        const valor = row[valueIndex];

        if (lancamento === 'Saldo Anterior') {
            saldoAnterior = valor;
        }

        if (lancamento === 'Saldo do dia') {
            saldoDoDia = valor;
        }
        
    });

    return {saldoAnterior, saldoDoDia}

}
function atualizarSaldosNoHTML(data) {
    const { saldoAnterior, saldoDoDia } = getSaldos(data);

    document.getElementById('saldoAnterior').innerText = saldoAnterior;
    document.getElementById('saldoAtual').innerText = saldoDoDia;
}

function generateLineChart(dates, balances) {
    const ctx = document.getElementById('lineChart').getContext('2d');
 

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Saldo ao longo do tempo',
                data: balances,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
         
        }
    });
}


// Gera a tabela
function generateTable(data) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = ''; // Limpa o conteúdo anterior

    const table = document.createElement('table');
    table.className = 'excel-table';

    // Cria o cabeçalho da tabela
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    data[0].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Cria o corpo da tabela
    const tbody = document.createElement('tbody');
    data.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    contentDiv.appendChild(table);
}

// Função para carregar a tela principal e manter os dados
function loadMainScreen() {
    document.querySelector('.content').innerHTML = `
        <h1>Table analitics</h1>
        <input type="file" id="file-input" />
           <div class="cont-graph">
            <div class="graphicos">
                 <div class="card-saldo">

                    <div>
                        <p>Saldo Anterior</p>
                        <h2 id="saldoAnterior">0</h2>
                    </div>
                    <div>
                        <p>Saldo Atual</p>
                        <h2 id="saldoAtual">0</h2>
                    </div>
                </div>
            </div>
            <div class="graphicos">
                <canvas id="myDoughnutChart" ></canvas>
            </div>
            <div class="graphicos">
                <canvas id="lineChart" ></canvas>
            </div>

        </div>
        <div id="content"></div>
    `;
    if (globalData.length > 0) {
        generateTable(globalData);
        const chartData = extractChartData(globalData);
        // const chartData2 = extractChartData(globalData);
        const chartData3 = extractChartDataSaldo(globalData);
        generateDoughnutChart(chartData.labels, chartData.values);
        // generateDoughnutChart2(chartData2.labels, chartData2.values);
        generateLineChart(chartData3.labels, chartData3.values);
    }
    // Adiciona o evento ao novo elemento input
    document.getElementById('file-input').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
            type: 'array'
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, {
            header: 1
        });


        globalData = consolidateData(data); // Armazena os dados consolidados na variável global
        generateTable(globalData);

        // Gera o gráfico Doughnut
        const chartData = extractChartData(globalData);
        // const chartData2 = extractChartData(globalData);
        const chartData3 = extractChartDataSaldo(globalData);
        generateDoughnutChart(chartData.labels, chartData.values);
        // generateDoughnutChart2(chartData2.labels, chartData2.values);
        atualizarSaldosNoHTML(globalData)
        generateLineChart(chartData3.labels, chartData3.values);
    });
}

// Inicializa a tela principal
loadMainScreen();


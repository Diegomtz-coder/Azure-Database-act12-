const express = require('express');
const sql = require('mssql');
require('dotenv').config();

const app = express();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: { encrypt: true, trustServerCertificate: false }
};

// Menu para Sucursales
app.get('/', (req, res) => {
    const htmlMenu = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>DSS - Selección de Sucursal</title>
        <style>
            body { background: black; color: white; font-family: monospace; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            h1 { color: #44ff44; margin-bottom: 30px; }
            .menu { display: flex; gap: 20px; }
            .btn { 
                padding: 15px 25px; 
                border: 2px solid white; 
                color: white; 
                text-decoration: none; 
                font-size: 1.2rem; 
                transition: 0.3s;
            }
            .btn:hover { background: white; color: black; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>PANEL DE CONTROL DSS</h1>
        <p>Selecciona una sucursal para ver la recomendacion:</p>
        <div class="menu">
            <a href="/dss/recomendacion?sucursal=101" class="btn">Sucursal 101</a>
            <a href="/dss/recomendacion?sucursal=102" class="btn">Sucursal 102</a>
            <a href="/dss/recomendacion?sucursal=103" class="btn">Sucursal 103</a>
        </div>
    </body>
    </html>
    `;
    res.send(htmlMenu);
});

app.get('/dss/recomendacion', async (req, res) => {
    const sucursalId = req.query.sucursal || 101;
    try {
        let pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('sucursalId', sql.Int, sucursalId)
            .query('SELECT Cantidad FROM Ventas WHERE ID_Sucursal = @sucursalId');

        const datos = result.recordset;
        const promedio = datos.length > 0 
            ? (datos.reduce((acc, curr) => acc + curr.Cantidad, 0) / datos.length).toFixed(2)
            : "0.00";

        const colorTexto = parseFloat(promedio) < 5 ? "#ff4444" : "#44ff44";
        const recomendacion = parseFloat(promedio) < 5 
            ? "ALERTA: Ventas bajas. Aplicar descuentos como un 3x2 en la categoria de Tecnologia." 
            : "OPERACIÓN OK: Mantener las ventas.";

        // HTML muy simple
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DSS - ${sucursalId}</title>
            <style>
                body { 
                    background-color: black; 
                    color: white; 
                    font-family: monospace; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0; 
                }
                h1 { font-size: 2rem; border-bottom: 2px solid white; padding-bottom: 10px; }
                .dato { font-size: 1.5rem; margin: 10px 0; }
                .destaque { color: ${colorTexto}; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>REPORTE SUCURSAL ${sucursalId}</h1>
            <div class="dato">Promedio de Ventas: <span class="destaque">${promedio}</span></div>
            <div class="dato">Recomendación: <span class="destaque">${recomendacion}</span></div>
            <p style="margin-top: 50px; color: #444;">Fuente: Azure SQL Server</p>
        </body>
        </html>
        `;

        res.send(html);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const port = process.env.PORT || 3000; 

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
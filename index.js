const express = require('express');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// config de conexión a Azure
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, 
        trustServerCertificate: false
    }
};

app.get('/dss/recomendacion', async (req, res) => {
    const sucursalId = req.query.sucursal || 101;

    try {
        let pool = await sql.connect(dbConfig);
        
        // Consultamos datos históricos para el análisis
        const result = await pool.request()
            .input('sucursalId', sql.Int, sucursalId)
            .query(`
                SELECT P.Nombre, V.Cantidad, V.MontoTotal 
                FROM Ventas V 
                JOIN Productos P ON V.ID_Producto = P.ID_Producto 
                WHERE V.ID_Sucursal = @sucursalId
            `);

        const datos = result.recordset;

        // DSS
        let recomendacion = "";
        if (datos.length === 0) {
            recomendacion = "No hay datos suficientes para generar una recomendación.";
        } else {
            // regla: si el promedio de ventas es bajo, sugerir promoción
            const promedioVentas = datos.reduce((acc, curr) => acc + curr.Cantidad, 0) / datos.length;
            
            if (promedioVentas < 5) {
                recomendacion = "ALERTA: Ventas bajas detectadas. Recomendación: Implementar 3x2 en productos de tecnología este fin de semana.";
            } else {
                recomendacion = "Estado Óptimo: Mantener precios actuales y reforzar inventario de temporada.";
            }
        }

        res.json({
            sucursal: sucursalId,
            analisis: datos,
            decision_dss: recomendacion,
            fecha_consulta: new Date().toISOString()
        });

    } catch (err) {
        res.status(500).json({ error: "Error conectando al DSS", details: err.message });
    }
});

app.listen(port, () => {
    console.log(`API DSS corriendo en http://localhost:${port}`);
});
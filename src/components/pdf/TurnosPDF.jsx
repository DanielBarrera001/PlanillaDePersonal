import React from 'react';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#10b981',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    padding: 8,
    fontWeight: 'bold',
    color: '#334155',
    fontSize: 10,
  },
  tableCol: {
    width: '25%',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
    color: '#475569',
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  }
});

// Componente del Documento PDF en sí
const DocumentoTurnos = ({ turnos, fechaInicio, fechaFin }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>Reporte de Turnos y Descansos</Text>
        <Text style={styles.subtitle}>Período del {fechaInicio} al {fechaFin}</Text>
      </View>

      {/* Tabla de Registros */}
      <View style={styles.table}>
        {/* Cabecera de la tabla */}
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Fecha</Text>
          <Text style={styles.tableColHeader}>Colaborador</Text>
          <Text style={styles.tableColHeader}>Jornada</Text>
          <Text style={styles.tableColHeader}>Local / Estado</Text>
        </View>

        {/* Filas dinámicas */}
        {turnos.map((t, index) => {
          const esDescanso = t.tipo_jornada === 'Descanso';
          return (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCol}>{t.fecha_turno}</Text>
              <Text style={styles.tableCol}>{t.nombre_persona}</Text>
              <Text style={styles.tableCol}>{t.tipo_jornada}</Text>
              <Text style={styles.tableCol}>{esDescanso ? 'Descanso' : t.local}</Text>
            </View>
          );
        })}
      </View>

      {/* Pie de página */}
      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Página ${pageNumber} de ${totalPages}`
      )} fixed />

    </Page>
  </Document>
);

// Componente Wrapper con el Botón de Descarga
export const TurnosPDF = ({ turnos, fechaInicio, fechaFin }) => {
  return (
    <PDFDownloadLink
      document={<DocumentoTurnos turnos={turnos} fechaInicio={fechaInicio} fechaFin={fechaFin} />}
      fileName={`Turnos_${fechaInicio}_al_${fechaFin}.pdf`}
      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
    >
      {({ blob, url, loading, error }) => 
        loading ? 'Preparando documento...' : 'Descargar Reporte PDF'
      }
    </PDFDownloadLink>
  );
};
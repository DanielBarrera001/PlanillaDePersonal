import React from 'react';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

// Paleta extraída del logo "Centro de Copias La Ranita"
// Verde Bosque (Borde/Texto): #0b6623
// Verde Lima (Rana): #65a30d
// Verde Menta Suave (Fondos): #ecfdf5 / #dcfce7
// Ámbar/Dorado (Ojos): #d97706

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2.5,
    borderBottomColor: '#0b6623',
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 58,
    height: 58,
    objectFit: 'contain',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b6623',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3f6212',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#475569',
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#064e3b',
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 15,
    marginBottom: 8,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  tableHeader: {
    backgroundColor: '#0b6623',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  colNombre: { width: '45%', padding: 7, fontSize: 10 },
  colTipo: { width: '25%', padding: 7, fontSize: 10 },
  colDetalle: { width: '30%', padding: 7, fontSize: 10 },
  emptyText: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    padding: 10,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
    paddingTop: 8,
  }
});

const DocumentoAusencias = ({ fecha, descansos, vacaciones, logoUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          <View>
            <Text style={styles.businessName}>Centro de Copias La Ranita</Text>
            <Text style={styles.title}>Control de Descansos y Vacaciones</Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN 1: DESCANSOS PROGRAMADOS */}
      <Text style={styles.sectionTitle}>1. Personal en Día de Descanso ({descansos.length})</Text>
      {descansos.length > 0 ? (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNombre}>Colaborador</Text>
            <Text style={styles.colTipo}>Categoría</Text>
            <Text style={styles.colDetalle}>Estado</Text>
          </View>
          {descansos.map((item, idx) => (
            <View style={[styles.tableRow, { backgroundColor: idx % 2 === 1 ? '#f0fdf4' : '#ffffff' }]} key={idx}>
              <Text style={styles.colNombre}>{item.nombre_persona}</Text>
              <Text style={styles.colTipo}>{item.empleado_id ? 'Planilla / Formal' : 'Temporal'}</Text>
              <Text style={styles.colDetalle}>Descanso Programado</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No hay personal registrado en descanso para esta fecha.</Text>
      )}

      {/* SECCIÓN 2: VACACIONES ACTIVAS */}
      <Text style={styles.sectionTitle}>2. Personal de Vacaciones ({vacaciones.length})</Text>
      {vacaciones.length > 0 ? (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNombre}>Colaborador</Text>
            <Text style={styles.colTipo}>Período</Text>
            <Text style={styles.colDetalle}>Observación</Text>
          </View>
          {vacaciones.map((v, idx) => (
            <View style={[styles.tableRow, { backgroundColor: idx % 2 === 1 ? '#f0fdf4' : '#ffffff' }]} key={idx}>
              <Text style={styles.colNombre}>{v.nombre_empleado}</Text>
              <Text style={styles.colTipo}>{v.fecha_inicio} ({v.dias_tomados} días)</Text>
              <Text style={styles.colDetalle}>{v.observacion || 'Vacaciones anuales'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No hay personal en período de vacaciones para esta fecha.</Text>
      )}

      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `Centro de Copias La Ranita — Generado el ${new Date().toLocaleDateString('es-SV')} — Página ${pageNumber} de ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
);

export const DescansosVacacionesPDF = ({ 
  fecha, 
  descansos = [], 
  vacaciones = [], 
  logoUrl = 'src/assets/Ranita.jpeg' // Reemplaza con tu ruta local o URL pública
}) => {
  if (!fecha) return null;

  return (
    <PDFDownloadLink
      document={<DocumentoAusencias fecha={fecha} descansos={descansos} vacaciones={vacaciones} logoUrl={logoUrl} />}
      fileName={`Descansos_y_Vacaciones_${fecha}.pdf`}
      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
    >
      {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF de Ausencias')}
    </PDFDownloadLink>
  );
};
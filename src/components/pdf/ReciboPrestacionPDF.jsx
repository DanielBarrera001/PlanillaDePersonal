import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
    color: '#555555',
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    width: '40%',
  },
  value: {
    width: '60%',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: 8,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Helvetica-Bold',
  },
  col: {
    flex: 1,
  },
  textRight: {
    textAlign: 'right',
  },
  legalText: {
    marginTop: 20,
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: '40%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    textAlign: 'center',
    paddingTop: 5,
  },
});

export const ReciboPrestacionPDF = ({ empleado, pago }) => {
  const getTitulo = (tipo) => {
    switch (tipo) {
      case 'aguinaldo': return 'Comprobante de Pago de Aguinaldo';
      case 'vacaciones': return 'Comprobante de Pago de Vacaciones';
      case 'quincena_25': return 'Comprobante de Pago Quincenal';
      case 'indemnizacion': return 'Comprobante de Pago de Indemnización';
      default: return 'Comprobante de Pago';
    }
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>UDP, Centro de Copias La Rana</Text>
          <Text style={styles.subtitle}>{getTitulo(pago.tipo_pago)}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre del Empleado:</Text>
            <Text style={styles.value}>{empleado.nombre_completo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DUI:</Text>
            <Text style={styles.value}>{empleado.dui}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cargo:</Text>
            <Text style={styles.value}>{empleado.cargo || 'N/A'}</Text>
          </View>
          
          {/* Ocultar Fecha de Ingreso si es quincenal */}
          {['aguinaldo', 'vacaciones', 'indemnizacion'].includes(pago.tipo_pago) && (
            <View style={styles.row}>
              <Text style={styles.label}>Fecha de Ingreso:</Text>
              <Text style={styles.value}>{empleado.fecha_ingreso}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Emisión:</Text>
            <Text style={styles.value}>{pago.fecha_pago}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col}>Concepto</Text>
            <Text style={[styles.col, styles.textRight]}>Monto</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.col}>Monto Devengado ({pago.dias_calculados || 0} días)</Text>
            <Text style={[styles.col, styles.textRight]}>${Number(pago.monto_bruto).toFixed(2)}</Text>
          </View>

          {Number(pago.monto_bono_vacaciones) > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col}>Bono por Vacaciones (30%)</Text>
              <Text style={[styles.col, styles.textRight]}>${Number(pago.monto_bono_vacaciones).toFixed(2)}</Text>
            </View>
          )}

          {Number(pago.descuento_renta) > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col}>Retención Renta</Text>
              <Text style={[styles.col, styles.textRight]}>-${Number(pago.descuento_renta).toFixed(2)}</Text>
            </View>
          )}

          {Number(pago.adelanto_salario) > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col}>Adelanto Salarial / Descuento</Text>
              <Text style={[styles.col, styles.textRight]}>-${Number(pago.adelanto_salario).toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={styles.col}>LÍQUIDO A RECIBIR</Text>
            <Text style={[styles.col, styles.textRight]}>${Number(pago.monto_neto).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.legalText}>
          Recibí a mi entera satisfacción la cantidad de {pago.monto_letras || ''} (${Number(pago.monto_neto).toFixed(2)}) 
          en concepto de pago por {getTitulo(pago.tipo_pago).toLowerCase()}, conforme a las disposiciones legales vigentes.
        </Text>

        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <Text>Entrega (Administración)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>F: {empleado.nombre_completo}</Text>
            <Text style={{ marginTop: 4 }}>DUI: {empleado.dui}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
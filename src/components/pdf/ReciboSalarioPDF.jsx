import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import logoRanita from '../../assets/Ranita.jpeg';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#333333' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#cccccc', paddingBottom: 10 },
  logo: { width: 45, height: 45, marginRight: 15, objectFit: 'contain' },
  headerText: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  subtitle: { fontSize: 11, marginTop: 4, color: '#555555' },
  section: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontFamily: 'Helvetica-Bold', width: '40%' },
  value: { width: '60%' },
  table: { marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', padding: 8 },
  tableHeader: { backgroundColor: '#f9fafb', fontFamily: 'Helvetica-Bold' },
  totalRow: { backgroundColor: '#f3f4f6', fontFamily: 'Helvetica-Bold' },
  col: { flex: 1 },
  textRight: { textAlign: 'right' },
  legalText: { marginTop: 20, fontSize: 9, lineHeight: 1.4, textAlign: 'justify' },
  signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50, paddingHorizontal: 20 },
  signatureBox: { width: '40%', borderTopWidth: 1, borderTopColor: '#000000', textAlign: 'center', paddingTop: 5 },
});

export const ReciboSalarioPDF = ({ empleado, pago, montoLetras }) => {
  const esHonorarios = empleado.tipo_empleado === 'honorarios';

  const getSubtitulo = (tipo) => {
    if (esHonorarios) return 'Comprobante de Pago por Honorarios';
    switch (tipo) {
      case 'aguinaldo': return 'Comprobante de Pago de Aguinaldo';
      case 'vacaciones': return 'Comprobante de Pago de Vacaciones';
      case 'quincena_25': return 'Comprobante de Pago Quincena 25';
      case 'quincena': return 'Comprobante de Pago de Salario Quincenal';
      default: return 'Comprobante de Pago de Salario Ordinario';
    }
  };

  const getTextoConcepto = (tipo) => {
    if (esHonorarios) return 'servicios profesionales';
    switch (tipo) {
      case 'aguinaldo': return 'pago de aguinaldo anual';
      case 'vacaciones': return 'pago de vacaciones anuales y bono';
      case 'quincena_25': return 'pago de quincena 25';
      case 'quincena': return 'pago de salario quincenal';
      default: return 'pago de salario ordinario';
    }
  };

  const textoLegal = `Recibí a mi entera satisfacción la cantidad de ${montoLetras || pago.monto_letras || ''} ($${Number(pago.monto_neto).toFixed(2)}). En concepto de ${getTextoConcepto(pago.tipo_pago)}, los cuales recibo en este acto a mi entera satisfacción, no teniendo ninguna otra suma de dinero en concepto de honorarios ordinarios ni extraordinarios, trabajo en concepto de contraprestación de ninguna otra suma de dinero, puesto que todas las cantidades que devengue en esos conceptos mientras trabajé al servicio de ustedes, me fueron canceladas a mi entera satisfacción en su oportunidad, no teniendo ningún reclamo presente o futuro. Firmo la presente.`;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoRanita} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>UDP Centro de Copias La Ranita</Text>
            <Text style={styles.subtitle}>{getSubtitulo(pago.tipo_pago)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre del Colaborador:</Text>
            <Text style={styles.value}>{empleado.nombre_completo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Emisión:</Text>
            <Text style={styles.value}>{pago.fecha_pago}</Text>
          </View>
        </View>

        {!esHonorarios ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.col}>Concepto</Text>
              <Text style={[styles.col, styles.textRight]}>Monto</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.col}>Monto Devengado {pago.dias_calculados ? `(${pago.dias_calculados} días)` : ''}</Text>
              <Text style={[styles.col, styles.textRight]}>${Number(pago.monto_bruto || 0).toFixed(2)}</Text>
            </View>

            {Number(pago.monto_bono_vacaciones) > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.col}>Bono por Vacaciones (30%)</Text>
                <Text style={[styles.col, styles.textRight]}>${Number(pago.monto_bono_vacaciones).toFixed(2)}</Text>
              </View>
            )}

            {Number(pago.descuento_isss) > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.col}>Descuento ISSS (3%)</Text>
                <Text style={[styles.col, styles.textRight]}>-${Number(pago.descuento_isss).toFixed(2)}</Text>
              </View>
            )}

            {Number(pago.descuento_afp) > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.col}>Descuento AFP (7.25%)</Text>
                <Text style={[styles.col, styles.textRight]}>-${Number(pago.descuento_afp).toFixed(2)}</Text>
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
                <Text style={styles.col}>Descuento de Adelanto</Text>
                <Text style={[styles.col, styles.textRight]}>-${Number(pago.adelanto_salario).toFixed(2)}</Text>
              </View>
            )}

            {Number(pago.descuento_credito) > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.col}>Abono a Crédito</Text>
                <Text style={[styles.col, styles.textRight]}>-${Number(pago.descuento_credito).toFixed(2)}</Text>
              </View>
            )}

            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={styles.col}>LÍQUIDO A RECIBIR</Text>
              <Text style={[styles.col, styles.textRight]}>${Number(pago.monto_neto).toFixed(2)}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.legalText}>{textoLegal}</Text>

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
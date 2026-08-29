import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#000000',
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
  },
  entity: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  presente: {
    fontSize: 11,
    marginTop: 2,
  },
  bodyText: {
    textAlign: 'justify',
    marginBottom: 40,
  },
  signatureArea: {
    marginTop: 60,
  },
  line: {
    width: 250,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginBottom: 8,
  },
  name: {
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  dui: {
    fontSize: 11,
    marginTop: 3,
  },
});

export const ReciboHonorariosPDF = ({ empleado, monto, montoLetras }) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.entity}>UDP, Centro de Copias La Rana</Text>
          <Text style={styles.presente}>Presente</Text>
        </View>

        <Text style={styles.bodyText}>
          Por este medio recibí la cantidad de {montoLetras} (${Number(monto).toFixed(2)}) en concepto de pago por servicios, los cuales recibo en este acto a mi entera satisfacción, no teniendo ninguna otra suma de dinero en concepto de honorarios ordinarios ni extraordinarios, trabajo en concepto de contraprestación de ninguna otra suma de dinero, vacaciones, días de asueto, indemnizaciones, horas extras, puesto que todas las cantidades que devengue en esos conceptos mientras trabajé al servicio de ustedes, me fueron canceladas a mi entera satisfacción en su oportunidad, no teniendo ningún reclamo presente o futuro. Firmo la presente.
        </Text>

        <View style={styles.signatureArea}>
          <View style={styles.line} />
          <Text style={styles.name}>F: ___________________________________</Text>
          <Text style={[styles.name, { marginTop: 10 }]}>{empleado.nombre_completo}</Text>
          <Text style={styles.dui}>DUI: {empleado.dui}</Text>
        </View>
      </Page>
    </Document>
  );
};
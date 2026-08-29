import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReciboPrestacionPDF } from './ReciboPrestacionPDF';
import { ReciboHonorariosPDF } from './ReciboHonorariosPDF';
import { ReciboSalarioPDF } from './ReciboSalarioPDF';
import { Download, FileText } from 'lucide-react';

export const BotonDescargaPDF = ({ tipoRecibo, empleado, pago, monto, montoLetras }) => {
  if (!empleado || !pago) return null;

  // Enrutamiento correcto de los tres tipos de recibo disponibles
  const Documento = tipoRecibo === 'honorarios' ? (
    <ReciboHonorariosPDF empleado={empleado} monto={monto} montoLetras={montoLetras} />
  ) : tipoRecibo === 'quincena' ? (
    <ReciboSalarioPDF empleado={empleado} pago={pago} />
  ) : (
    <ReciboPrestacionPDF empleado={empleado} pago={pago} />
  );

  const nombreEmpleado = empleado.nombre_completo ? empleado.nombre_completo.replace(/\s+/g, '_') : 'Empleado';
  const nombreArchivo = tipoRecibo === 'honorarios'
    ? `Recibo_Honorarios_${nombreEmpleado}.pdf`
    : `Recibo_${pago?.tipo_pago || 'Pago'}_${nombreEmpleado}.pdf`;

  return (
    <PDFDownloadLink
      document={Documento}
      fileName={nombreArchivo}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
    >
      {({ loading }) =>
        loading ? (
          <>
            <FileText className="w-4 h-4 animate-spin" />
            <span>Generando PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Descargar Recibo PDF</span>
          </>
        )
      }
    </PDFDownloadLink>
  );
};
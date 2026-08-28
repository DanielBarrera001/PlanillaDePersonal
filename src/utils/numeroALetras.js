function Unidades(num) {
  switch (num) {
    case 1: return 'un';
    case 2: return 'dos';
    case 3: return 'tres';
    case 4: return 'cuatro';
    case 5: return 'cinco';
    case 6: return 'seis';
    case 7: return 'siete';
    case 8: return 'ocho';
    case 9: return 'nueve';
    default: return '';
  }
}

function Decenas(num) {
  const decena = Math.floor(num / 10);
  const unidad = num % 10;
  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return 'diez';
        case 1: return 'once';
        case 2: return 'doce';
        case 3: return 'trece';
        case 4: return 'catorce';
        case 5: return 'quince';
        default: return 'dieci' + Unidades(unidad);
      }
    case 2:
      switch (unidad) {
        case 0: return 'veinte';
        default: return 'veinti' + Unidades(unidad);
      }
    case 3: return DecenasY('treinta', unidad);
    case 4: return DecenasY('cuarenta', unidad);
    case 5: return DecenasY('cincuenta', unidad);
    case 6: return DecenasY('sesenta', unidad);
    case 7: return DecenasY('setenta', unidad);
    case 8: return DecenasY('ochenta', unidad);
    case 9: return DecenasY('noventa', unidad);
    case 0: return Unidades(unidad);
  }
}

function DecenasY(strSin, numUnidades) {
  if (numUnidades > 0) return strSin + ' y ' + Unidades(numUnidades);
  return strSin;
}

function Centenas(num) {
  const centenas = Math.floor(num / 100);
  const decenas = num % 100;
  switch (centenas) {
    case 1:
      if (decenas > 0) return 'ciento ' + Decenas(decenas);
      return 'cien';
    case 2: return 'doscientos ' + Decenas(decenas);
    case 3: return 'trescientos ' + Decenas(decenas);
    case 4: return 'cuatrocientos ' + Decenas(decenas);
    case 5: return 'quinientos ' + Decenas(decenas);
    case 6: return 'seiscientos ' + Decenas(decenas);
    case 7: return 'setecientos ' + Decenas(decenas);
    case 8: return 'ochocientos ' + Decenas(decenas);
    case 9: return 'novecentos ' + Decenas(decenas);
    default: return Decenas(decenas);
  }
}

function Seccion(num, divisor, strSingular, strPlural) {
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  let letras = '';
  if (cientos > 0) {
    if (cientos > 1) letras = Centenas(cientos) + ' ' + strPlural;
    else letras = strSingular;
  }
  if (resto > 0) letras += '';
  return letras;
}

function Miles(num) {
  const divisor = 1000;
  const cientos = Math.floor(num / divisor);
  const resto = num % divisor;
  const strMiles = Seccion(num, divisor, 'un mil', 'mil');
  const strCentenas = Centenas(resto);
  if (strMiles === '') return strCentenas;
  return strMiles + ' ' + strCentenas;
}

export function numeroALetras(monto) {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const strCentavos = centavos < 10 ? `0${centavos}` : `${centavos}`;

  if (entero === 0) return `cero ${strCentavos}/100 dólares`;
  return `${Miles(entero)} ${strCentavos}/100 dólares`.toLowerCase();
}
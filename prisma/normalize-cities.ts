/**
 * normalize-cities.ts
 *
 * Script de normalizacion de datos historicos: asigna el campo `ciudad` a
 * clientes que lo tienen nulo, siempre que la ciudad pueda determinarse con
 * suficiente certeza a partir del patron estructurado que genera Mapbox
 * Geocoding en el campo `direccion`: "..., {Ciudad} - {Provincia}, ..."
 *
 * Por defecto funciona en modo DRY-RUN (solo muestra los cambios que realizaria).
 * Para aplicar los cambios en base de datos, ejecutar con el flag --apply:
 *
 *   npx tsx prisma/normalize-cities.ts           # dry-run
 *   npx tsx prisma/normalize-cities.ts --apply   # aplica cambios
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

/**
 * Extrae la ciudad del patron de direccion generado por Mapbox Geocoding:
 *   "Calle XYZ, {Ciudad} - {Provincia}, {CP}, {Pais}"
 *
 * Solo se considera el segmento inmediatamente anterior al " - ". Si el patron
 * no coincide, retorna null para evitar asignaciones incorrectas.
 */
function extractCiudadFromDireccion(direccion: string | null): string | null {
  if (!direccion) return null;
  // Busca el segmento " - ProvinciaNombre" precedido por la ciudad
  // Ejemplo: "Olmedo, Riobamba - Chimborazo, 0601, Ecuador"
  //                              ^^^^^^^
  const match = direccion.match(/,\s+([^,]+)\s+-\s+[A-Za-z\u00C0-\u024F\s]+,/);
  if (!match) return null;
  return match[1].trim();
}

async function main() {
  console.log(`\n=== normalize-cities.ts (${APPLY ? "APPLY MODE" : "DRY-RUN"}) ===\n`);

  const clientes = await prisma.cliente.findMany({
    where: { ciudad: null },
    select: { id: true, nombre: true, ruc: true, direccion: true },
    orderBy: { nombre: "asc" },
  });

  console.log(`Clientes con ciudad NULL: ${clientes.length}\n`);

  const actualizaciones: Array<{ id: string; nombre: string; ciudadDetectada: string }> = [];
  const sinDetectar: Array<{ nombre: string; ruc: string; direccion: string | null }> = [];

  // Clientes cuyas direcciones en Mapbox arrojan provincias/ciudades inconsistentes
  const excluidosManual = ["PRONACA BUCAY", "PROMARISCO DURAN"];

  for (const c of clientes) {
    const ciudad = extractCiudadFromDireccion(c.direccion);
    
    if (ciudad && !excluidosManual.includes(c.nombre)) {
      actualizaciones.push({ id: c.id, nombre: c.nombre, ciudadDetectada: ciudad });
    } else {
      sinDetectar.push({ nombre: c.nombre, ruc: c.ruc, direccion: c.direccion });
    }
  }

  // Mostrar resumen de actualizaciones
  if (actualizaciones.length > 0) {
    console.log(`Clientes que se ${APPLY ? "actualizaron" : "actualizarian"}:`);
    for (const a of actualizaciones) {
      console.log(`  [OK] ${a.nombre.padEnd(40)} -> ciudad: "${a.ciudadDetectada}"`);
    }
    console.log("");
  } else {
    console.log("No se encontraron clientes actualizables con certeza suficiente.\n");
  }

  // Mostrar registros que requieren revision manual
  if (sinDetectar.length > 0) {
    console.log(`Clientes que requieren revision manual (ciudad NO modificada):`);
    for (const s of sinDetectar) {
      console.log(`  [MANUAL] ${s.nombre.padEnd(40)} | RUC: ${s.ruc} | dir: "${s.direccion ?? "(sin direccion)"}"`);
    }
    console.log("");
  }

  // Aplicar cambios si se especifico --apply
  if (APPLY && actualizaciones.length > 0) {
    console.log("Aplicando cambios en base de datos...");
    let ok = 0;
    let err = 0;
    for (const a of actualizaciones) {
      try {
        await prisma.cliente.update({
          where: { id: a.id },
          data: { ciudad: a.ciudadDetectada },
        });
        ok++;
        console.log(`  [OK] ${a.nombre} -> "${a.ciudadDetectada}"`);
      } catch (e) {
        err++;
        console.error(`  [ERR] ${a.nombre}:`, e);
      }
    }
    console.log(`\nResultado: ${ok} actualizados, ${err} errores.`);
  } else if (!APPLY) {
    console.log("Modo DRY-RUN: ningun registro fue modificado.");
    console.log("Para aplicar, ejecutar: npx tsx prisma/normalize-cities.ts --apply\n");
  }

  // Resumen final
  console.log(`\n=== Resumen ===`);
  console.log(`Total con ciudad null:     ${clientes.length}`);
  console.log(`Con ciudad detectable:     ${actualizaciones.length}`);
  console.log(`Requieren revision manual: ${sinDetectar.length}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("Error fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

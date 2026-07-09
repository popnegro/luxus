import fs from 'fs';
import postcss from 'postcss';
import path from 'path';

const CSS_FILE = './dist/assets/css/main.css';

async function auditCss() {
    console.log('📊 Iniciando auditoría de redundancia en main.css...');
    
    if (!fs.existsSync(CSS_FILE)) {
        console.error('❌ Error: No se encontró el archivo en dist. Ejecuta build primero.');
        return;
    }

    const css = fs.readFileSync(CSS_FILE, 'utf8');
    const root = postcss.parse(css);
    
    let duplicateProps = 0;
    let totalRules = 0;
    let totalDecls = 0;

    root.walkRules(rule => {
        totalRules++;
        const seenProps = new Map();

        rule.walkDecls(decl => {
            totalDecls++;
            if (seenProps.has(decl.prop)) {
                const prevValue = seenProps.get(decl.prop);
                if (prevValue === decl.value) {
                    console.warn(`⚠️  Redundancia Total: [${decl.prop}: ${decl.value}] duplicado en "${rule.selector}"`);
                } else {
                    console.warn(`⚠️  Sobrescritura interna: [${decl.prop}] cambia de "${prevValue}" a "${decl.value}" en "${rule.selector}"`);
                }
                duplicateProps++;
            }
            seenProps.set(decl.prop, decl.value);
        });
    });

    console.log('\n--- Resumen de Auditoría ---');
    console.log(`Reglas analizadas: ${totalRules}`);
    console.log(`Declaraciones totales: ${totalDecls}`);
    console.log(`Propiedades duplicadas/sobrescritas: ${duplicateProps}`);
    
    const efficiency = totalDecls > 0 ? ((1 - (duplicateProps / totalDecls)) * 100).toFixed(2) : 100;
    console.log(`Eficiencia de empaquetado: ${efficiency}%`);

    if (duplicateProps > 50) {
        console.error('\n❌ Alerta: Demasiada redundancia detectada. Revisa tus capas de Tailwind.');
    } else {
        console.log('\n✅ El archivo main.css tiene un nivel de limpieza saludable.');
    }
}

auditCss();
/* ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE LA PLATAFORMA — PLANTILLA
 * ---------------------------------------------------------------------------
 * Este archivo SÍ se versiona: es la plantilla de referencia.
 *
 * PARA PONER LA PLATAFORMA EN MARCHA:
 *   1. Copiar este archivo como  config.js
 *   2. Rellenar URL_SCRIPT con la URL real del despliegue del Apps Script
 *   3. Subir config.js al hosting junto a los HTML
 *
 * ⚠️  config.js NO se versiona (está en .gitignore). La URL del despliegue es
 *     la llave de la base de datos: quien la tiene puede leer, modificar y
 *     borrar todas las evaluaciones. Nunca debe acabar en el repositorio.
 * ═══════════════════════════════════════════════════════════════════════════ */
window.CONFIG = {

    /* URL del despliegue del web app de Apps Script.
     * Se obtiene en el editor de Apps Script:
     *   Implementar ▸ Administrar implementaciones ▸ copiar la URL /exec
     * Al rotar el despliegue, este es el ÚNICO sitio que hay que cambiar. */
    URL_SCRIPT: "https://script.google.com/macros/s/PEGAR_AQUI_EL_ID_DEL_DESPLIEGUE/exec",

    /* Página a la que se envía a un residente si abre por error una dirección
     * del portal docente. Debe existir en este mismo sitio. */
    PAGINA_RESIDENTE: "dashboard_residentes2.html",

    /* Opcional — solo si se quiere sobrescribir el client_id de Google que
     * viene en el atributo data-client_id de index.html. Los client ID de
     * OAuth son públicos por diseño, así que no es un secreto. */
    GOOGLE_CLIENT_ID: ""

};

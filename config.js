/* ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE LA PLATAFORMA
 * ---------------------------------------------------------------------------
 * ⚠️  ESTE ARCHIVO NO SE VERSIONA (está en .gitignore).
 *     La URL del despliegue es la llave de la base de datos: quien la tiene
 *     puede leer, modificar y borrar todas las evaluaciones.
 *
 *     Sí debe subirse al HOSTING, junto a los archivos HTML.
 * ═══════════════════════════════════════════════════════════════════════════ */
window.CONFIG = {

    /* ⬇⬇⬇  PEGAR AQUÍ LA URL DEL DESPLIEGUE NUEVO  ⬇⬇⬇
     *
     * Editor de Apps Script ▸ Implementar ▸ Administrar implementaciones
     * ▸ copiar la URL que termina en /exec
     *
     * Mientras diga PEGAR_AQUI, las páginas mostrarán un aviso rojo arriba. */
    URL_SCRIPT: "https://script.google.com/macros/s/AKfycbzK3f6lG2jcuxlPmS-s9WU-SPnOsqf7tdZTnYrbscda-uLUA9K-ztBMs9_unP1U--_D/exec",

    /* Página a la que se envía a un residente si abre por error una dirección
     * del portal docente. Debe existir en este mismo sitio. */
    PAGINA_RESIDENTE: "dashboard_residentes2.html",

    /* Opcional. Los client ID de OAuth son públicos por diseño, así que el de
     * index.html puede quedarse donde está. */
    GOOGLE_CLIENT_ID: "148157700207-r8g2es764v635uckj1d1ff3dsfsdit56.apps.googleusercontent.com"

};

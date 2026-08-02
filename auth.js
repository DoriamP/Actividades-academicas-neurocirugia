/* ═══════════════════════════════════════════════════════════════════════════
 * AUTENTICACIÓN DEL CLIENTE — P1
 * ---------------------------------------------------------------------------
 * Se incluye en las 10 páginas. Hace cuatro cosas:
 *
 *   1. Muestra la pantalla de acceso si no hay sesión válida: botón de Google
 *      para quien tenga cuenta, y campo de código para quien no.
 *   2. Guarda la sesión (token + rol + nombre) y la renueva cuando caduca.
 *   3. INTERCEPTA todas las llamadas al Apps Script y les añade el token, sin
 *      que haya que tocar ninguna de las 23 llamadas repartidas por el código.
 *   4. Envía a los residentes a su propio panel si abren una dirección del
 *      portal docente. Es cortesía, no seguridad: los datos ya los protege el
 *      servidor, que filtra por rol en cada petición.
 *
 * Este archivo NO contiene secretos: el token de sesión se obtiene en tiempo
 * de ejecución y el client_id de Google es público por diseño. Puede
 * versionarse sin problema.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var CLAVE_SESION = 'neuro_sesion_v1';
    var BASE = (window.CONFIG && window.CONFIG.URL_SCRIPT) || '';
    var CLIENT_ID = (window.CONFIG && window.CONFIG.GOOGLE_CLIENT_ID) || _clientIdDelHtml();

    // El _fetch original, antes de interceptarlo
    var _fetch = window.fetch ? window.fetch.bind(window) : null;

    function _clientIdDelHtml() {
        var el = document.getElementById('g_id_onload') ||
                 document.querySelector('[data-client_id]');
        return el ? (el.getAttribute('data-client_id') || '') : '';
    }

    // ── Sesión guardada ──────────────────────────────────────────────────
    function sesion() {
        try {
            var s = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
            if (!s || !s.token) return null;
            if (s.caduca && s.caduca < Date.now()) { localStorage.removeItem(CLAVE_SESION); return null; }
            return s;
        } catch (e) { return null; }
    }
    function guardarSesion(s) { localStorage.setItem(CLAVE_SESION, JSON.stringify(s)); }
    function borrarSesion()   { localStorage.removeItem(CLAVE_SESION); }

    // ── Interceptor: añade el token a toda llamada al Apps Script ─────────
    // Se hace aquí y no en cada punto de llamada para que ninguna se quede
    // sin autenticar por descuido al añadir código nuevo más adelante.
    if (_fetch) {
        window.fetch = function (input, init) {
            try {
                var url = (typeof input === 'string') ? input
                        : (input && input.url) ? input.url : '';
                if (BASE && url.indexOf(BASE) === 0) {
                    var s = sesion();
                    var tk = s ? s.token : '';
                    if (tk && url.indexOf('_t=') === -1) {
                        var esLogin = url.indexOf('action=login') !== -1 ||
                                      url.indexOf('action=logout') !== -1;
                        if (!esLogin) {
                            var m = (init && init.method ? init.method : 'GET').toUpperCase();
                            if (m === 'POST' && init && typeof init.body === 'string') {
                                init = Object.assign({}, init,
                                    { body: init.body + '&_t=' + encodeURIComponent(tk) });
                            } else {
                                url += (url.indexOf('?') === -1 ? '?' : '&') + '_t=' + encodeURIComponent(tk);
                                if (typeof input !== 'string') input = url; else input = url;
                            }
                        }
                    }
                    if (typeof input === 'string') input = url;
                }
            } catch (e) { /* ante la duda, se deja pasar tal cual */ }
            return _fetch(input, init);
        };
    }

    // ── Llamadas de login / logout (sin token) ───────────────────────────
    function pedirSesion(params) {
        return _fetch(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: params.toString()
        }).then(function (r) { return r.json(); });
    }

    function entrarConGoogle(idToken) {
        var p = new URLSearchParams({ action: 'login', id_token: idToken });
        return pedirSesion(p);
    }
    function entrarConCodigo(codigo) {
        var p = new URLSearchParams({ action: 'login', codigo: codigo });
        return pedirSesion(p);
    }

    function salir() {
        var s = sesion();
        borrarSesion();
        if (s) {
            var p = new URLSearchParams({ action: 'logout', _t: s.token });
            _fetch(BASE, { method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: p.toString() }).catch(function () {});
        }
        location.reload();
    }

    // ── Pantalla de acceso ───────────────────────────────────────────────
    // Dos entradas separadas, una por tipo de usuario. Técnicamente ambas
    // hacen lo mismo —el rol lo decide el servidor a partir del correo—, pero
    // así cada persona reconoce de un vistazo cuál es la suya y aterriza
    // directamente donde le toca, sin mensajes de «esta sección no es para
    // usted» ni redirecciones a media carga.
    function pintarPantalla(mensajeInicial) {
        if (document.getElementById('authOverlay')) return;

        var ov = document.createElement('div');
        ov.id = 'authOverlay';
        ov.setAttribute('style',
            'position:fixed;inset:0;z-index:2147483647;background:#0f172a;' +
            'display:flex;align-items:flex-start;justify-content:center;padding:20px;' +
            'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow:auto;');

        var tarjeta =
            'background:#fff;border-radius:16px;padding:20px 18px;border:1px solid #e2e8f0;';
        var rotulo =
            'font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 2px;';
        var sub =
            'font-size:11.5px;color:#64748b;margin:0 0 14px;line-height:1.4;';

        ov.innerHTML =
          '<div style="max-width:400px;width:100%;margin:auto 0;">' +

            '<div style="text-align:center;margin-bottom:20px;">' +
              '<div style="font-size:36px;line-height:1;margin-bottom:10px;">🧠</div>' +
              '<h1 style="font-size:19px;font-weight:800;color:#fff;margin:0 0 4px;line-height:1.3;">' +
                'Actividades académicas de Neurocirugía</h1>' +
              '<p style="font-size:12px;color:#94a3b8;margin:0;">Curso académico 2026 – 2027</p>' +
            '</div>' +

            '<div id="authMsg" style="display:none;font-size:12.5px;font-weight:600;padding:10px 12px;' +
                 'border-radius:10px;margin-bottom:14px;line-height:1.45;"></div>' +

            // ── Docentes y coordinación ──
            '<div style="' + tarjeta + 'margin-bottom:14px;">' +
              '<p style="' + rotulo + 'color:#4f46e5;">👨‍⚕️ Docentes y coordinación</p>' +
              '<p style="' + sub + '">Registrar evaluaciones, consultar el plan docente y el resumen académico.</p>' +
              '<div id="authGoogleWrapDocente">' +
                '<div id="authGoogleBtnDocente" style="display:flex;justify-content:center;min-height:44px;"></div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:10px;margin:14px 0 12px;">' +
                '<div style="flex:1;height:1px;background:#e2e8f0;"></div>' +
                '<span style="font-size:10px;color:#94a3b8;font-weight:700;">O CON CÓDIGO</span>' +
                '<div style="flex:1;height:1px;background:#e2e8f0;"></div>' +
              '</div>' +
              '<input id="authCodigo" type="text" autocomplete="one-time-code" spellcheck="false" ' +
                 'placeholder="XXXXX-XXXXX-XXXXX-XXXXX" ' +
                 'style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #cbd5e1;' +
                 'border-radius:10px;font-size:13.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;' +
                 'letter-spacing:.05em;text-transform:uppercase;outline:none;">' +
              '<button id="authCodigoBtn" type="button" ' +
                 'style="width:100%;margin-top:9px;padding:10px;border:0;border-radius:10px;' +
                 'background:#4f46e5;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">' +
                 'Entrar con código</button>' +
              '<p style="font-size:10px;color:#94a3b8;margin:9px 0 0;line-height:1.45;">' +
                 'Para quien no tenga cuenta de Google. Su código es personal.</p>' +
            '</div>' +

            // ── Residentes ──
            '<div style="' + tarjeta + '">' +
              '<p style="' + rotulo + 'color:#0d9488;">🎓 Médicos residentes</p>' +
              '<p style="' + sub + '">Consultar mis notas, mi avance por módulo y mis actividades pendientes.</p>' +
              '<div id="authGoogleWrapResidente">' +
                '<div id="authGoogleBtnResidente" style="display:flex;justify-content:center;min-height:44px;"></div>' +
              '</div>' +
            '</div>' +

            '<p style="font-size:10.5px;color:#64748b;margin:16px 0 0;text-align:center;line-height:1.5;">' +
              'Use la cuenta de Google que registró en la coordinación.</p>' +
          '</div>';

        document.body.appendChild(ov);

        if (mensajeInicial) mostrarMsg(mensajeInicial, 'err');

        var inp = document.getElementById('authCodigo');
        var btn = document.getElementById('authCodigoBtn');
        btn.addEventListener('click', function () { enviarCodigo(inp, btn); });
        inp.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); enviarCodigo(inp, btn); }
        });

        cargarGoogle();
    }

    function mostrarMsg(txt, tipo) {
        var el = document.getElementById('authMsg');
        if (!el) return;
        el.textContent = txt;
        el.style.display = 'block';
        el.style.background = tipo === 'ok' ? '#ecfdf5' : '#fef2f2';
        el.style.color      = tipo === 'ok' ? '#047857' : '#b91c1c';
        el.style.border     = '1px solid ' + (tipo === 'ok' ? '#a7f3d0' : '#fecaca');
    }

    function enviarCodigo(inp, btn) {
        var cod = (inp.value || '').trim().toUpperCase();
        if (cod.length < 8) { mostrarMsg('Escriba el código completo.', 'err'); return; }
        btn.disabled = true; btn.textContent = 'Comprobando…'; btn.style.background = '#94a3b8';
        entrarConCodigo(cod).then(function (res) {
            if (res && res.status === 'success') { aceptar(res); return; }
            mostrarMsg((res && res.message) || 'No se pudo entrar.', 'err');
            btn.disabled = false; btn.textContent = 'Entrar'; btn.style.background = '#4f46e5';
        }).catch(function () {
            mostrarMsg('No se pudo conectar con el servidor.', 'err');
            btn.disabled = false; btn.textContent = 'Entrar'; btn.style.background = '#4f46e5';
        });
    }

    function aceptar(res) {
        guardarSesion({ token: res.token, email: res.email, nombre: res.nombre,
                        rol: res.rol, caduca: res.caduca });
        // Cada perfil aterriza directamente donde le corresponde. Antes se
        // recargaba la misma página y, si era un residente en el portal
        // docente, se le mostraba un aviso y se le redirigía después: dos
        // pasos y un mensaje innecesario para algo que ya se sabe aquí.
        var destino = _destinoSegunRol(res.rol);
        if (destino) location.replace(destino); else location.reload();
    }

    /** Página que corresponde a un rol, o null si ya está donde debe */
    function _destinoSegunRol(rol) {
        if (rol !== 'residente') return null;                 // docentes: se quedan
        var destino = _destinoResidente();
        var actual  = _paginaActual();
        if (PAGINAS_RESIDENTE.indexOf(actual) !== -1) return null;   // ya está en su panel
        return destino;
    }

    // ── Botones de Google ────────────────────────────────────────────────
    // Se inicializa una sola vez y se dibuja el botón en las dos tarjetas.
    // Ambos hacen lo mismo: quién es cada uno lo decide el servidor a partir
    // del correo, así que si alguien pulsa el botón de la tarjeta que no le
    // toca, entra igual y va a su sitio. Es a propósito: separar las tarjetas
    // orienta, no restringe.
    var CONTENEDORES_GOOGLE = ['authGoogleBtnDocente', 'authGoogleBtnResidente'];

    function cargarGoogle() {
        if (!CLIENT_ID) {
            // Antes esto ocultaba el botón sin más, y quien no supiera del
            // acceso por código pensaba que la plataforma estaba rota.
            ['authGoogleWrapDocente', 'authGoogleWrapResidente'].forEach(function (id) {
                var w = document.getElementById(id);
                if (!w) return;
                w.innerHTML =
                  '<p style="font-size:11.5px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;' +
                     'border-radius:10px;padding:9px 11px;margin:0;line-height:1.45;">' +
                     'Acceso con Google no disponible: falta <strong>GOOGLE_CLIENT_ID</strong> ' +
                     'en config.js. Avise a la coordinación.</p>';
            });
            return;
        }

        function init() {
            try {
                google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: function (resp) {
                        mostrarMsg('Verificando su cuenta…', 'ok');
                        entrarConGoogle(resp.credential).then(function (r) {
                            if (r && r.status === 'success') { aceptar(r); return; }
                            mostrarMsg((r && r.message) || 'Cuenta no autorizada.', 'err');
                        }).catch(function () {
                            mostrarMsg('No se pudo conectar con el servidor.', 'err');
                        });
                    }
                });
                CONTENEDORES_GOOGLE.forEach(function (id) {
                    var el = document.getElementById(id);
                    if (!el) return;
                    google.accounts.id.renderButton(el,
                        { theme: 'outline', size: 'large', width: 300,
                          text: 'signin_with', locale: 'es' });
                });
            } catch (e) {
                CONTENEDORES_GOOGLE.forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) el.style.display = 'none';
                });
            }
        }

        if (window.google && google.accounts && google.accounts.id) { init(); return; }
        var sc = document.createElement('script');
        sc.src = 'https://accounts.google.com/gsi/client';
        sc.async = true;
        sc.onload = init;
        sc.onerror = function () {
            ['authGoogleWrapDocente', 'authGoogleWrapResidente'].forEach(function (id) {
                var w = document.getElementById(id);
                if (w) w.innerHTML = '<p style="font-size:11.5px;color:#b45309;margin:0;">' +
                    'No se pudo cargar el acceso con Google. Revise su conexión.</p>';
            });
        };
        document.head.appendChild(sc);
    }

    // ── Qué páginas puede abrir cada perfil ──────────────────────────────
    // Esto NO es una medida de seguridad: los datos ya los protege el servidor,
    // que filtra por rol en cada petición. Es para que un residente que abra
    // por error la dirección del portal docente vea un mensaje claro en vez de
    // una pantalla llena de secciones vacías y errores de permiso.
    var PAGINAS_RESIDENTE = ['dashboard_residentes.html', 'dashboard_residentes2.html'];

    function _paginaActual() {
        var p = (location.pathname || '').split('/').pop();
        return (p || 'index.html').toLowerCase();
    }

    function _destinoResidente() {
        return (window.CONFIG && window.CONFIG.PAGINA_RESIDENTE) || 'dashboard_residentes2.html';
    }

    function comprobarAccesoPagina() {
        var s = sesion();
        if (!s || s.rol !== 'residente') return;                 // docentes: sin restricción
        if (PAGINAS_RESIDENTE.indexOf(_paginaActual()) !== -1) return;
        pintarRedireccion(s);
    }

    function pintarRedireccion(s) {
        var destino = _destinoResidente();

        // Antes aquí había un aviso de «esta sección es del equipo docente» con
        // cuenta atrás de cinco segundos. Sobra: con las dos entradas separadas
        // en la pantalla de acceso, llegar aquí es raro, y cuando pasa lo suyo
        // es llevarle a su panel sin hacerle sentir que se equivocó.
        function montar() {
            if (document.getElementById('authRedirect')) return;
            var ov = document.createElement('div');
            ov.id = 'authRedirect';
            ov.setAttribute('style',
                'position:fixed;inset:0;z-index:2147483647;background:#0f172a;' +
                'display:flex;align-items:center;justify-content:center;' +
                'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;');
            ov.innerHTML =
              '<div style="text-align:center;color:#fff;">' +
                '<div style="font-size:34px;line-height:1;margin-bottom:12px;">🧠</div>' +
                '<p style="font-size:14px;font-weight:700;margin:0 0 6px;">Abriendo su panel…</p>' +
                '<p style="font-size:12px;color:#94a3b8;margin:0;">' +
                   (s && s.nombre ? String(s.nombre).split(' ')[0] : '') + '</p>' +
                '<a href="' + destino + '" style="display:inline-block;margin-top:18px;font-size:12px;' +
                   'color:#a5b4fc;text-decoration:underline;">Continuar</a>' +
              '</div>';
            document.body.appendChild(ov);
            setTimeout(function () { location.replace(destino); }, 400);
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
        else montar();
    }

    // ── Arranque ─────────────────────────────────────────────────────────
    function arrancar() {
        if (!BASE) return;   // sin config.js ya se avisa por otra vía
        if (!sesion()) { pintarPantalla(null); return; }
        comprobarAccesoPagina();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arrancar);
    } else { arrancar(); }

    // Si el servidor rechaza la sesión en cualquier momento, se vuelve a pedir
    window.addEventListener('neuro:sesion-caducada', function () {
        borrarSesion();
        pintarPantalla('Su sesión ha caducado. Vuelva a iniciarla.');
    });

    // ── API pública ──────────────────────────────────────────────────────
    window.AUTH = {
        sesion: sesion,
        salir: salir,
        rol:    function () { var s = sesion(); return s ? s.rol : null; },
        nombre: function () { var s = sesion(); return s ? s.nombre : null; },
        email:  function () { var s = sesion(); return s ? s.email : null; },
        es:     function (r) { var s = sesion(); return !!s && s.rol === r; },
        caducada: function () { window.dispatchEvent(new Event('neuro:sesion-caducada')); },
        paginaResidente: _destinoResidente
    };
})();

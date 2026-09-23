# Gestor Maestro

PROMPT 1 — ESTRUCTURA INICIAL Y DASHBOARD MASTER

Construye la primera fase de la aplicación Tomar el Fresco en Yucatán.

Esta fase será exclusivamente para el rol MASTER.

No desarrollar todavía:

Panel del dueño del negocio.

Vista pública del usuario final.

Google Maps.

Geolocalización.

Inteligencia artificial.

Reseñas.

Menús o catálogos.

Pagos en línea.

Automatizaciones n8n.

El objetivo actual es crear una base administrativa limpia, funcional, segura y preparada para crecer.

1. BASE TÉCNICA

Usar Supabase como backend principal.

La arquitectura debe quedar preparada para que en el futuro el frontend pueda migrarse fuera de Lovable sin perder:

usuarios;

negocios;

planes;

fechas;

estados;

información almacenada.

No guardar lógica crítica únicamente en el frontend.

Preparar el proyecto para integración con GitHub.

La aplicación debe ser:

responsive;

mobile-first;

instalable posteriormente como PWA;

completamente en español;

especialmente cómoda de utilizar desde teléfono.

La interfaz debe privilegiar:

botones grandes;

textos fáciles de leer;

pocos campos;

navegación sencilla;

ausencia de términos técnicos innecesarios.

2. AUTENTICACIÓN

No utilizar correo electrónico como dato visible ni como método de acceso del usuario.

El inicio de sesión debe mostrar únicamente:

Usuario

Contraseña

Botón:

INICIAR SESIÓN

Debe existir el rol:

master

Crear inicialmente el usuario MASTER:

Usuario: master

Contraseña: master123

IMPORTANTE:

No colocar estas credenciales directamente en el frontend ni exponerlas en código cliente.

El usuario debe existir mediante el sistema de autenticación y quedar asociado al rol master.

Si Supabase Auth requiere internamente un email técnico, resolverlo internamente sin mostrarlo jamás al usuario. El acceso visible debe seguir siendo exclusivamente usuario + contraseña.

3. REGLAS DE USUARIO Y CONTRASEÑA

Para futuros usuarios de negocios:

Usuario

mínimo 6 caracteres;

debe contener al menos una letra mayúscula;

debe contener al menos un número;

no permitir espacios;

debe ser único.

Ejemplo válido:

Carlos1

Contraseña

mínimo 6 caracteres;

al menos una mayúscula;

al menos un número.

Ejemplo:

Carlos1

No exigir símbolos especiales.

La intención es mantener el acceso sencillo para usuarios con poca experiencia digital.

4. DASHBOARD MASTER

Después del login, el MASTER debe ingresar directamente a:

Resumen

No utilizar la palabra Dashboard en la interfaz.

Diseñar un panel muy limpio.

En la parte superior mostrar únicamente indicadores realmente útiles:

Negocios activos

Cantidad de negocios actualmente activos.

Prueba gratis

Negocios que se encuentran dentro de sus primeros 30 días gratuitos.

Por vencer

Negocios cuyo plan termina dentro de los próximos 7 días.

Vencidos

Negocios cuya fecha de vigencia ya terminó.

Debajo colocar un botón principal grande:

+ CREAR NEGOCIO

Este botón debe ser especialmente fácil de utilizar desde celular.

5. ALTA RÁPIDA DE NEGOCIO

El objetivo operativo es que el MASTER pueda crear un negocio presencialmente en aproximadamente 1 minuto.

No solicitar información que el dueño pueda completar posteriormente.

Al pulsar:

+ CREAR NEGOCIO

abrir un formulario sencillo con:

Nombre del dueño

Campo obligatorio.

Celular / WhatsApp

Campo obligatorio.

Solo números y formato telefónico válido.

Nombre del negocio

Campo obligatorio.

Tipo de negocio

Selector obligatorio.

Opciones iniciales:

Comida y bebida

Turismo y experiencias

Hospedaje y rentas

Movilidad y transporte

Diversión y entretenimiento

Otro

Municipio

Selector.

Por ahora permitir seleccionar municipios de Yucatán.

Debe quedar preparado para manejar posteriormente localidades o colonias.

Usuario

Campo obligatorio.

Aplicar automáticamente las reglas de usuario definidas anteriormente.

Mostrar inmediatamente si el usuario ya existe.

Contraseña

Campo obligatorio.

Aplicar las reglas definidas anteriormente.

Agregar icono mostrar/ocultar contraseña.

6. PLAN INICIAL

Todo negocio nuevo debe recibir automáticamente:

PLAN GRATIS — 30 DÍAS

El MASTER no debe capturar manualmente las fechas.

Al crear el negocio:

fecha_inicio = fecha actual

fecha_fin = fecha_inicio + 30 días

tipo_plan = prueba_gratis

estatus_plan = activo

Mostrar al MASTER antes de guardar:

Primer mes gratis

Inicio: [fecha]

Vence: [fecha calculada]

No solicitar información de pago.

7. CREACIÓN

Botón:

CREAR NEGOCIO

Al pulsarlo:

validar todos los campos;

crear el usuario;

crear el negocio;

relacionar usuario y negocio;

asignar automáticamente el plan gratuito;

calcular fechas;

guardar todo en Supabase.

Si todo fue correcto mostrar:

Negocio creado correctamente

Después mostrar una tarjeta sencilla con:

Negocio

Usuario

Contraseña temporal

Vigencia gratuita hasta

y botones:

COPIAR DATOS

VOLVER A NEGOCIOS

No enviar todavía correo ni WhatsApp automáticamente.

8. ESTADOS DEL NEGOCIO

Cada negocio debe manejar:

activo

suspendido

vencido

y adicionalmente un estado de configuración:

perfil_incompleto

perfil_completo

Cuando el MASTER crea el negocio:

estado_configuracion = perfil_incompleto

Esto permitirá que posteriormente el dueño complete:

dirección;

horarios;

fotografías;

menú;

servicios;

precios;

entrega a domicilio;

información específica de su giro.

No crear todavía ese flujo.

9. LISTADO DE NEGOCIOS

Agregar en el menú:

Negocios

Mostrar una tabla sencilla en escritorio y tarjetas adaptadas en móvil.

Campos:

Nombre del negocio

Dueño

Tipo

Municipio

Plan

Inicio

Vence

Estatus

Agregar buscador:

Buscar negocio o dueño

Agregar filtros sencillos:

Todos

Activos

Prueba gratis

Por vencer

Vencidos

10. ACCIONES DEL MASTER

Cada negocio debe tener un botón:

Ver

Al entrar mostrar únicamente:

Datos del negocio

Nombre del dueño

Celular

Nombre del negocio

Tipo

Municipio

Usuario

Plan

Fecha inicio

Fecha fin

Días restantes

Estatus

Estado de configuración

Agregar acciones:

Editar datos

Suspender negocio

Reactivar negocio

No permitir eliminar definitivamente negocios en esta fase.

11. CÁLCULO AUTOMÁTICO DE ESTATUS

El sistema debe determinar automáticamente:

Activo

Fecha actual <= fecha_fin y negocio no suspendido.

Por vencer

Faltan 7 días o menos para fecha_fin.

Vencido

Fecha actual > fecha_fin.

Suspendido

El MASTER suspendió manualmente el negocio.

No depender de que el MASTER actualice estos estados manualmente.

12. NAVEGACIÓN MASTER

Menú inicial exclusivamente:

Resumen

Negocios

Cerrar sesión

No agregar más módulos todavía.

En celular utilizar navegación sencilla y accesible.

13. DISEÑO

No crear todavía una identidad visual compleja.

Usar una interfaz:

limpia;

elegante;

cálida;

moderna;

amigable;

muy fácil de leer.

Tomar como referencia conceptual la identidad de Tomar el Fresco en Yucatán, donde el rosa será posteriormente parte importante de la marca.

Por ahora utilizar el rosa únicamente como acento moderado en:

botones principales;

elementos activos;

pequeños detalles visuales.

Evitar saturar toda la interfaz de rosa.

No agregar gráficas decorativas.

No llenar el Resumen con métricas innecesarias.

Priorizar funcionalidad y facilidad de uso.

14. SEGURIDAD Y DATOS

Crear una estructura multi-negocio desde el inicio.

Un usuario de negocio posteriormente deberá quedar relacionado exclusivamente con su negocio.

El MASTER tendrá acceso total.

Preparar RLS correctamente en Supabase desde esta primera fase.

No permitir que futuras cuentas de negocios puedan consultar datos de otros negocios.

El rol MASTER debe poder consultar todos los negocios.

No guardar contraseñas en texto plano en tablas propias.

Utilizar el sistema de autenticación para contraseñas.

15. CRITERIO DE TERMINACIÓN DE ESTA FASE

Esta fase se considera terminada cuando sea posible:

iniciar sesión como MASTER;

entrar al Resumen;

observar los cuatro indicadores;

crear un negocio en aproximadamente un minuto;

generar usuario y contraseña sin utilizar correo visible;

asignarle automáticamente 30 días gratis;

verlo inmediatamente en el listado;

abrir su ficha;

editarlo;

suspenderlo o reactivarlo;

cerrar sesión.

No desarrollar ninguna funcionalidad adicional fuera de este alcance.

Si alguna parte requiere una decisión técnica interna, elegir la alternativa más estable y escalable sin modificar la experiencia definida anteriormente.
AJUSTE AL PROMPT 1 — PWA

Agregar a esta primera fase soporte PWA (Progressive Web App).

La aplicación debe quedar instalable desde dispositivos compatibles y funcionar correctamente como aplicación independiente después de instalarse.

Configurar desde ahora:

manifest de la aplicación;

nombre y nombre corto preparados para poder modificarse posteriormente;

iconos temporales de PWA;

display: standalone;

comportamiento responsive y mobile-first;

instalación desde navegador en dispositivos compatibles;

estructura preparada para actualizar posteriormente nombre, logotipo, iconos y colores sin modificar la arquitectura.

No implementar todavía funciones offline complejas ni almacenamiento offline de información.

El objetivo de esta fase es únicamente que la aplicación tenga desde el inicio una base PWA correctamente configurada e instalable.

No alterar ninguna otra funcionalidad definida en el Prompt 1.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fresco-master-panel.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/555ddd79-2183-4ca8-9149-8b269eae915d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

<!-- Autor: Daniel Benjamin Perez Morales -->
<!-- GitHub: https://github.com/D4nitrix13 -->
<!-- Gitlab: https://gitlab.com/D4nitrix13 -->
<!-- Correo electrónico: danielperezdev@proton.me -->

# FRONTEND (React)

Aquí tienes una versión mucho más útil que el boilerplate de Create React App.  
Úsalo como `frontend/README.md`.

```markdown
# Frontend – React para CRUD de Usuarios (Go API)

Este frontend está construido en **React** y consume la API REST escrita en Go.  
Permite gestionar usuarios (crear, listar, filtrar, editar y eliminar) de forma sencilla.

---

## Funcionalidades principales

- **Listado de usuarios** en la página raíz (`/`).
- **Barra de búsqueda** para filtrar por nombre o email en tiempo real.
- **Creación de usuarios** desde `/create-user`.
- **Edición de usuarios** desde `/edit-user/:id`.
- **Eliminación de usuarios** desde la tabla (botón Delete).
- **Notificaciones globales** (éxito/error) que aparecen en la parte superior al volver a la raíz.
- Integración con la API Go a través de **Axios**.

---

## Estructura de componentes

Ubicación: `src/components/`

- `Users.js`  
  - Lista todos los usuarios (`GET /users`).
  - Incluye barra de búsqueda.
  - Muestra botones:
    - **Edit** → Navega a `/edit-user/:id`.
    - **Delete** → Llama a `DELETE /users/:id` y refresca la lista.
  - Usa estilos de `User.css`.

- `CreateUser.js`  
  - Formulario para crear un nuevo usuario.
  - Valida:
    - Nombre no vacío.
    - Email con formato válido (regex sencilla).
  - Llama a `POST /users`.
  - Al crear correctamente:
    - Redirige a `/`.
    - Envía una notificación de éxito utilizando el `state` de React Router.
  - Usa estilos de `CreateUser.css` y `button.css`.

- `UpdateUser.js`  
  - Formulario para editar un usuario existente.
  - Carga los datos iniciales desde `GET /users/:id`.
  - Aplica la misma validación que `CreateUser` (nombre + email).
  - Llama a `PUT /users/:id`.
  - Al actualizar:
    - Redirige a `/`.
    - Muestra notificación (éxito o error).
  - Usa estilos de `CreateUser.css`, `UpdateUser.css` y `button.css`.

- `NotificationBar` (definido en `App.js`)  
  - Componente que lee `location.state` desde React Router.
  - Si hay `{ notification, notificationType }`, muestra un banner global.
  - Limpia el estado de la ruta para que al refrescar no se repita la notificación.
  - Soporta al menos:
    - `notification-success`
    - `notification-error`

---

## Estilos

- `App.css`  
  - Layout general, navbar, estilos del header y notificación global.

- `User.css`  
  - Estilos del listado de usuarios:
    - Contenedor de la tabla.
    - Filtro de búsqueda.
    - Tabla, filas, hover, etc.
    - Botones de acción (Edit / Delete).

- `CreateUser.css` / `UpdateUser.css`  
  - Estilos para los formularios de creación y edición.

- `button.css`  
  - Estilos comunes de botones reutilizados en varios componentes.

---

## Variables de entorno

El frontend puede apuntar a distintas URLs de API usando:

- `REACT_APP_API_BASE_URL`

Ejemplo (en un archivo `.env` en la carpeta `frontend`):

```env
REACT_APP_API_BASE_URL=http://localhost:8000

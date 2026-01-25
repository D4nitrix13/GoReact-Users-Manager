<!-- Autor: Daniel Benjamin Perez Morales -->
<!-- GitHub: https://github.com/D4nitrix13 -->
<!-- Gitlab: https://gitlab.com/D4nitrix13 -->
<!-- Correo electrónico: danielperezdev@proton.me -->

# API REST – Go + PostgreSQL para CRUD de Usuarios

Esta API es el backend de una aplicación CRUD (Create, Read, Update, Delete) de usuarios.  
Está desarrollada en **Go**, expone endpoints REST y persiste los datos en **PostgreSQL**.  
Está preparada para ser consumida por un frontend en **React** y se ejecuta en **Docker**.

---

## Índice

- [API REST – Go + PostgreSQL para CRUD de Usuarios](#api-rest--go--postgresql-para-crud-de-usuarios)
  - [Índice](#índice)
  - [Arquitectura](#arquitectura)
  - [Requisitos](#requisitos)
  - [Variables de entorno](#variables-de-entorno)
    - [Arranque con Docker](#arranque-con-docker)
  - [Arranque local (sin Docker)](#arranque-local-sin-docker)
  - [Modelo de datos](#modelo-de-datos)
  - [Endpoints de la API](#endpoints-de-la-api)
    - [1. Obtener todos los usuarios](#1-obtener-todos-los-usuarios)
    - [2. Obtener un usuario por ID](#2-obtener-un-usuario-por-id)
    - [3. Crear usuario](#3-crear-usuario)
    - [4. Actualizar usuario](#4-actualizar-usuario)
    - [5. Eliminar usuario](#5-eliminar-usuario)
  - [Validaciones y manejo de errores](#validaciones-y-manejo-de-errores)
  - [CORS](#cors)
  - [Dependencias principales](#dependencias-principales)

---

## Arquitectura

El proyecto se divide en dos partes:

1. **Backend (esta carpeta)**  
   - API REST en Go.
   - Conexión a **PostgreSQL** mediante `DATABASE_URL`.
   - CRUD completo sobre la tabla `users`.
   - Validación de datos (nombre y formato de email).
   - Respuestas JSON con códigos HTTP adecuados.
   - CORS habilitado para permitir el frontend React.

2. **Frontend (carpeta `frontend/`)**  
   - Aplicación React que consume esta API.
   - Listado de usuarios, filtro, creación, edición y eliminación.
   - Sistema de notificaciones globales (éxito/error) al volver a la raíz.

---

## Requisitos

- **Docker** y **Docker Compose** instalados  
  (opcionalmente Go ≥ 1.20 si quieres correr el backend sin Docker)
- Una base de datos **PostgreSQL** accesible vía URL.

---

## Variables de entorno

La API utiliza la siguiente variable de entorno:

- `DATABASE_URL` – Cadena de conexión a PostgreSQL.

Ejemplo para desarrollo:

```bash
export DATABASE_URL="postgres://user:password@host:5432/dbname?sslmode=disable"
```

En Docker Compose normalmente esta variable se configura en el servicio del backend.

---

### Arranque con Docker

Desde la raíz del proyecto (donde está `docker-compose.yml`):

```bash
docker-compose up --build
```

El servicio del backend suele exponerse en:

```bash
http://localhost:8000
```

Revisa tu `docker-compose.yml` para ver el nombre del servicio, por ejemplo `go-app` o similar.

---

## Arranque local (sin Docker)

Si quieres lanzar solo el backend directamente con Go:

1. Asegúrate de tener Go **1.20 o superior** instalado.
2. Sitúate en la carpeta donde está `main.go`.
3. Exporta la variable `DATABASE_URL`:

   ```bash
   export DATABASE_URL="postgres://user:password@localhost:5432/dbname?sslmode=disable"
   ```

4. Ejecuta:

   ```bash
   go run main.go
   ```

La API quedará escuchando en:

```bash
http://localhost:8000
```

---

## Modelo de datos

La API crea automáticamente la tabla `users` si no existe:

```sql
CREATE TABLE IF NOT EXISTS users (
    id    SERIAL PRIMARY KEY,
    name  TEXT,
    email TEXT
);
```

Estructura del objeto `User` en JSON:

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

---

## Endpoints de la API

Base URL (desarrollo):

```bash
http://localhost:8000
```

### 1. Obtener todos los usuarios

**GET** `/users`

- Respuesta `200 OK`:

  ```json
  [
    {
      "id": 1,
      "name": "John",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane",
      "email": "jane@example.com"
    }
  ]
  ```

---

### 2. Obtener un usuario por ID

**GET** `/users/{id}`

- Ejemplo:

  ```bash
  curl http://localhost:8000/users/1
  ```

- Respuesta `200 OK`:

  ```json
  {
    "id": 1,
    "name": "John",
    "email": "john@example.com"
  }
  ```

- Respuesta `404 Not Found`:

  ```json
  { "error": "User not found" }
  ```

---

### 3. Crear usuario

**POST** `/users`
`Content-Type: application/json`

Body esperado:

```json
{
  "name": "Nuevo Usuario",
  "email": "nuevo@example.com"
}
```

- Respuesta `201 Created`:

  ```json
  {
    "id": 7,
    "name": "Nuevo Usuario",
    "email": "nuevo@example.com"
  }
  ```

- Errores de validación (`400 Bad Request`):

  ```json
  { "error": "Name cannot be empty" }
  ```

  ```json
  { "error": "Invalid email format" }
  ```

- Error de base de datos (`500 Internal Server Error`):

  ```json
  { "error": "Database insert error" }
  ```

---

### 4. Actualizar usuario

**PUT** `/users/{id}`
`Content-Type: application/json`

Body esperado (mismo formato que create):

```json
{
  "name": "Nombre Actualizado",
  "email": "correo.actualizado@example.com"
}
```

- Respuesta `200 OK`:

  ```json
  {
    "name": "Nombre Actualizado",
    "email": "correo.actualizado@example.com"
  }
  ```

- Errores de validación (`400 Bad Request`):

  ```json
  { "error": "Name cannot be empty" }
  ```

  ```json
  { "error": "Invalid email format" }
  ```

- Usuario no encontrado (`404 Not Found`):

  ```json
  { "error": "User not found" }
  ```

- Error de BD (`500 Internal Server Error`):

  ```json
  { "error": "Error updating user" }
  ```

---

### 5. Eliminar usuario

**DELETE** `/users/{id}`

- Respuesta `200 OK`:

  ```json
  { "message": "User deleted successfully" }
  ```

- Usuario no encontrado (`404 Not Found`):

  ```json
  { "error": "User not found" }
  ```

- Error de BD (`500 Internal Server Error`):

  ```json
  { "error": "Error deleting user" }
  ```

---

## Validaciones y manejo de errores

Actualmente el backend implementa:

- **Validaciones en create y update**:

  - `name` no puede estar vacío (se hace `TrimSpace`).
  - `email` debe cumplir un formato básico (`texto@texto.dominio`).
- **Respuestas JSON coherentes**:

  - Siempre se devuelve `Content-Type: application/json`.
  - Los errores devuelven un objeto `{ "error": "mensaje" }`.
- **Códigos HTTP** bien utilizados:

  - `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`.

---

## CORS

La API viene configurada con CORS para que el frontend en React pueda consumirla desde otro origen (`localhost:3000`, `localhost:3001`, etc.).

En desarrollo se permite cualquier origen:

```go
w.Header().Set("Access-Control-Allow-Origin", "*")
w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
```

Para producción es recomendable **restringir** el origen a la URL concreta del frontend.

---

## Dependencias principales

- [`github.com/gorilla/mux`](https://github.com/gorilla/mux) – Router HTTP para Go.
- [`github.com/lib/pq`](https://github.com/lib/pq) – Driver PostgreSQL para Go.
- Go 1.20+ (según `go.mod`).

# Donaciones

Este repositorio contiene dos servicios Node.js que conforman la plataforma de donaciones de sangre.

## Servicios

- **auth-service/**: microservicio encargado de la autenticación con Google OAuth 2.0 y la emisión de tokens JWT para los usuarios verificados.
- **back/**: API principal que gestiona usuarios, donantes y catálogos geográficos sobre una base de datos PostgreSQL, reutilizando los tokens emitidos por el servicio de autenticación.

## Flujo de trabajo recomendado

1. Asegúrate de actualizar la rama base que utilice Railway (por ejemplo `login-dni-centro`) con `git pull`.
2. Crea una rama nueva para tus cambios de desarrollo, por ejemplo `git checkout -b dev`.
3. Revisa y añade tus cambios con `git status`, `git add` y `git commit`.
4. Publica la rama con `git push -u origin dev` para compartirla sin afectar el despliegue en producción.

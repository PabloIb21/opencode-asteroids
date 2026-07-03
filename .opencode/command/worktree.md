---
description: Crea un git worktree en .worktrees/<nombre> con una rama nueva derivada del nombre pasado como argumento.
agent: build
---

El usuario invocó `/worktree` con este argumento (puede estar vacío, contener espacios o caracteres especiales):

```
$ARGUMENTS
```

Tu única tarea es ejecutar el comando `git worktree add` con una rama nueva. Sigue estos pasos sin desviarte:

1. Deriva un slug seguro a partir de `$ARGUMENTS`:
   - Pasa a minúsculas.
   - Reemplaza espacios por un único guion (`-`).
   - Colapsa guiones repetidos en uno solo.
   - Elimina cualquier carácter que no sea `a-z`, `0-9` o `-`.
   - Quita guiones al inicio y al final.
   - Si el resultado queda vacío, usa `worktree`.
   - No interpretes el significado del argumento ni inventes contexto adicional: el nombre del worktree se basa ÚNICAMENTE en el texto que el usuario pasó.

2. Ejecuta, con la herramienta `bash`, este comando exacto (reemplazando `<slug>` por el slug derivado):

   ```
   git worktree add -b <slug> .worktrees/<slug>
   ```

Reglas estrictas:
- NO cambies de directorio de trabajo (no uses `cd`, `Set-Location`, ni el parámetro `workdir`).
- NO ejecutes ningún otro comando además del `git worktree add` de arriba.
- NO hagas commit, push, checkout, fetch, pull, branch extra, ni abras el worktree.
- NO escribas archivos, NO edites nada, NO crees carpetas manualmente (lo hace `git worktree add`).
- NO imprimas resumen, explicación ni prólogo. Si el comando falla, muestra el error tal cual y detente.
- NO guardes nada en memoria (mem_save) para esta operación.

Si `$ARGUMENTS` llega vacío, ejecuta igual con el slug `worktree`.
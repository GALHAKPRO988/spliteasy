<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Groups live only in the device's localStorage (`src/lib/splits.ts` useGroups, key `spliteasy:data`); no database or server storage — fully local, works offline and in a static APK.
- The receipt scanner is the only server function (`src/lib/scan.functions.ts`, AI gateway).

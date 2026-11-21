"""List pictures already in Comfy's input and output folders."""

from __future__ import annotations

from pathlib import Path

_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tif", ".tiff"}
_LIMIT = 600


def _root(folder: str) -> Path | None:
    import folder_paths

    if folder == "input":
        return Path(folder_paths.get_input_directory())
    if folder == "output":
        return Path(folder_paths.get_output_directory())
    return None


def list_pictures(folder: str) -> list[dict]:
    root = _root(folder)
    if root is None or not root.is_dir():
        return []
    base = root.resolve()
    found = []
    for path in base.rglob("*"):
        if not path.is_file() or path.name.startswith("."):
            continue
        if path.suffix.lower() not in _IMAGE_EXTS:
            continue
        try:
            resolved = path.resolve()
            resolved.relative_to(base)
            stat = resolved.stat()
        except (OSError, ValueError):
            continue
        parent = resolved.parent.relative_to(base).as_posix()
        found.append((stat.st_mtime, {
            "filename": resolved.name,
            "subfolder": "" if parent == "." else parent,
            "type": folder,
            "name": resolved.stem,
        }))
    found.sort(key=lambda item: item[0], reverse=True)
    return [item for _, item in found[:_LIMIT]]


def register_library_route() -> None:
    try:
        from aiohttp import web
        from server import PromptServer
    except Exception:
        return
    server = PromptServer.instance
    if getattr(server, "_feimao_h3_library", False):
        return
    server._feimao_h3_library = True

    @server.routes.get("/feimao-h3/library")
    async def feimao_h3_library(request):
        folder = str(request.query.get("folder") or "")
        if folder not in ("input", "output"):
            return web.json_response({"error": "只能读取 input 或 output"}, status=400)
        return web.json_response(list_pictures(folder))

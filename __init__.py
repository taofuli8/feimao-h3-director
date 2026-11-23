"""feimao-h3导演台 — MiniMax H3 director desk, kept apart from feimao tools."""

from .nodes_board import NODE_CLASS_MAPPINGS as BOARD_MAP
from .nodes_board import NODE_DISPLAY_NAME_MAPPINGS as BOARD_NAMES
from .nodes_director import NODE_CLASS_MAPPINGS as DIRECTOR_MAP
from .nodes_director import NODE_DISPLAY_NAME_MAPPINGS as DIRECTOR_NAMES
from .nodes_route import NODE_CLASS_MAPPINGS as ROUTE_MAP
from .nodes_route import NODE_DISPLAY_NAME_MAPPINGS as ROUTE_NAMES
from .nodes_loader import NODE_CLASS_MAPPINGS as LOADER_MAP
from .nodes_loader import NODE_DISPLAY_NAME_MAPPINGS as LOADER_NAMES
from .nodes_gate import NODE_CLASS_MAPPINGS as GATE_MAP
from .nodes_gate import NODE_DISPLAY_NAME_MAPPINGS as GATE_NAMES
from .library_route import register_library_route
from .reverse_service import register_reverse_route

register_library_route()
register_reverse_route()

NODE_CLASS_MAPPINGS = {}
NODE_CLASS_MAPPINGS.update(DIRECTOR_MAP)
NODE_CLASS_MAPPINGS.update(BOARD_MAP)
NODE_CLASS_MAPPINGS.update(ROUTE_MAP)
NODE_CLASS_MAPPINGS.update(LOADER_MAP)
NODE_CLASS_MAPPINGS.update(GATE_MAP)

NODE_DISPLAY_NAME_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS.update(DIRECTOR_NAMES)
NODE_DISPLAY_NAME_MAPPINGS.update(BOARD_NAMES)
NODE_DISPLAY_NAME_MAPPINGS.update(ROUTE_NAMES)
NODE_DISPLAY_NAME_MAPPINGS.update(LOADER_NAMES)
NODE_DISPLAY_NAME_MAPPINGS.update(GATE_NAMES)

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]

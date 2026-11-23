"""Let only the selected mode's sampler run. The other chain is skipped."""

from comfy_execution.graph_utils import ExecutionBlocker


def _on(value) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


class FeimaoH3ModeGate:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "潜空间": ("LATENT", {"forceInput": True}),
                "走数字人": ("BOOLEAN", {"forceInput": True, "default": False}),
                "这条路": (["数字人", "其它"], {
                    "default": "数字人",
                    "tooltip": "数字人只放行数字人采样。其它只放行原来那组采样。模型、加速 LoRA 和步数两边共用。没被放行的那条不会采样，也不会保存。",
                }),
            }
        }

    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("潜空间",)
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    DESCRIPTION = "按导演台模式放行一条采样。模型、加速 LoRA 和步数两边共用，一次只会跑其中一组采样和保存。"

    def run(self, 潜空间, 走数字人=False, 这条路="数字人"):
        digital = _on(走数字人)
        if digital == (这条路 == "数字人"):
            return (潜空间,)
        return (ExecutionBlocker(None),)


NODE_CLASS_MAPPINGS = {
    "FeimaoH3ModeGate": FeimaoH3ModeGate,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3ModeGate": "H3模式放行",
}

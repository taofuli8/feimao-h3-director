"""Switch the H3 diffusion model. Conditioning stays inside the director."""


class FeimaoH3Route:
    @classmethod
    def INPUT_TYPES(cls):
        lazy = {"lazy": True}
        return {
            "required": {
                "走多参": ("BOOLEAN", {"default": True}),
            },
            "optional": {
                "多参模型": ("MODEL", lazy),
                "文生模型": ("MODEL", lazy),
            },
        }

    RETURN_TYPES = ("MODEL",)
    RETURN_NAMES = ("模型",)
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    DESCRIPTION = "按导演台的模式只加载一个模型。多参用参考模型，文生、首帧、尾帧、首尾帧、数字人用首尾帧模型。"

    def check_lazy_status(self, 走多参, 多参模型=None, 文生模型=None):
        if bool(走多参):
            return [] if 多参模型 is not None else ["多参模型"]
        return [] if 文生模型 is not None else ["文生模型"]

    def run(self, 走多参, 多参模型=None, 文生模型=None):
        if bool(走多参):
            if 多参模型 is None:
                raise ValueError("模式分流缺多参模型")
            return (多参模型,)
        if 文生模型 is None:
            raise ValueError("模式分流缺文生模型")
        return (文生模型,)


NODE_CLASS_MAPPINGS = {
    "FeimaoH3Route": FeimaoH3Route,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3Route": "H3模式分流",
}

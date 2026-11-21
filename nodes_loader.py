"""One loader for the H3 diffusion model, CLIP, video VAE, and audio VAE."""

REF_UNET = "Minimax_H3\\minimax_h3_ref2va_pruned_int8_convrot.safetensors"
FL_UNET = "Minimax_H3\\minimax_h3_fl2va_pruned_int8_convrot.safetensors"
CLIP_NAME = "Qwen\\qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors"
VIDEO_VAE = "Minimax_H3\\minimax_h3_video_vae_fp16.safetensors"
AUDIO_VAE = "Minimax_H3\\minimax_h3_audio_vae_fp32.safetensors"
DTYPES = ["default", "fp8_e4m3fn", "fp8_e4m3fn_fast", "fp8_e5m2"]


def _choices(kind, preferred):
    try:
        import folder_paths
        options = list(folder_paths.get_filename_list(kind))
    except Exception:
        options = []
    if preferred not in options:
        options = [preferred, *options]
    return options


class FeimaoH3Loader:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "走多参": ("BOOLEAN", {
                    "default": True,
                    "tooltip": "接导演台的走多参。打开时加载参考模型，关掉时加载文生、图生、首尾帧用的模型。",
                }),
                "多参模型": (_choices("diffusion_models", REF_UNET), {"default": REF_UNET}),
                "文生模型": (_choices("diffusion_models", FL_UNET), {"default": FL_UNET}),
                "权重类型": (DTYPES, {"default": "default"}),
                "CLIP": (_choices("text_encoders", CLIP_NAME), {"default": CLIP_NAME}),
                "视频VAE": (_choices("vae", VIDEO_VAE), {"default": VIDEO_VAE}),
                "音频VAE": (_choices("vae", AUDIO_VAE), {"default": AUDIO_VAE}),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "VAE", "VAE")
    RETURN_NAMES = ("模型", "CLIP", "视频VAE", "音频VAE")
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    DESCRIPTION = "一次加载 H3 要用的模型。多参和文生只加载当前模式那一个。CLIP 固定按 minimax 类型加载。视频 VAE 和音频 VAE 都会加载。"

    def run(self, 走多参, 多参模型, 文生模型, 权重类型, CLIP, 视频VAE, 音频VAE):
        from nodes import CLIPLoader, UNETLoader, VAELoader

        unet_name = 多参模型 if bool(走多参) else 文生模型
        model = UNETLoader().load_unet(unet_name, 权重类型)[0]
        clip = CLIPLoader().load_clip(CLIP, type="minimax", device="default")[0]
        video = VAELoader().load_vae(视频VAE)[0]
        audio = VAELoader().load_vae(音频VAE)[0]
        return (model, clip, video, audio)


NODE_CLASS_MAPPINGS = {
    "FeimaoH3Loader": FeimaoH3Loader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3Loader": "H3模型加载",
}

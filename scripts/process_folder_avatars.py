import os
import glob
from PIL import Image, ImageDraw

def crop_smart_circle(img, target_size=(256, 256)):
    """
    智能裁剪：以中心为圆心裁剪，并处理为透明背景圆形
    """
    img = img.convert("RGBA")
    w, h = img.size
    
    # 取最小边作为直径
    diameter = min(w, h)
    
    # 计算居中裁剪区域
    left = (w - diameter) // 2
    top = (h - diameter) // 2
    right = left + diameter
    bottom = top + diameter
    
    # 裁剪为正方形
    square_img = img.crop((left, top, right, bottom))
    
    # 缩放到目标尺寸
    resized_img = square_img.resize(target_size, Image.Resampling.LANCZOS)
    
    # 创建圆形遮罩
    mask = Image.new('L', target_size, 0)
    draw = ImageDraw.Draw(mask)
    
    # 绘制抗锯齿圆形 (4倍超采样)
    scale = 4
    big_size = (target_size[0] * scale, target_size[1] * scale)
    big_mask = Image.new('L', big_size, 0)
    big_draw = ImageDraw.Draw(big_mask)
    big_draw.ellipse((0, 0, big_size[0], big_size[1]), fill=255)
    mask = big_mask.resize(target_size, Image.Resampling.LANCZOS)
    
    # 应用遮罩
    resized_img.putalpha(mask)
    
    return resized_img

def main():
    INPUT_DIR = 'public/touxiang'
    OUTPUT_DIR = 'public/avatars'
    
    if not os.path.exists(INPUT_DIR):
        print(f"错误: 找不到输入目录 '{INPUT_DIR}'")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 获取所有图片文件
    files = []
    for ext in ['*.png', '*.jpg', '*.jpeg', '*.webp']:
        files.extend(glob.glob(os.path.join(INPUT_DIR, ext)))
    
    if not files:
        print(f"在 {INPUT_DIR} 中未找到图片文件")
        return
        
    print(f"找到 {len(files)} 张图片，开始处理...")
    
    # 清理旧的 Gemini 头像
    old_files = glob.glob(os.path.join(OUTPUT_DIR, 'avatar_gemini_*.png'))
    for f in old_files:
        try:
            os.remove(f)
            print(f"已清理旧文件: {os.path.basename(f)}")
        except Exception as e:
            print(f"清理失败 {f}: {e}")

    count = 0
    for file_path in files:
        try:
            count += 1
            img = Image.open(file_path)
            print(f"处理图片 [{count}/{len(files)}]: {os.path.basename(file_path)}")
            
            # 处理为圆形头像
            final_img = crop_smart_circle(img, target_size=(256, 256))
            
            # 保存
            filename = f"avatar_custom_{count:02d}.png"
            output_path = os.path.join(OUTPUT_DIR, filename)
            final_img.save(output_path)
            print(f"  -> 已生成: {filename}")
            
        except Exception as e:
            print(f"  -> 处理失败: {e}")
            
    print(f"\n全部完成！成功生成 {count} 张头像。")

if __name__ == '__main__':
    main()

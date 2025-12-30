import os
import sys
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
    INPUT_FILE = 'Gemini_Generated_Image_dturmhdturmhdtur.png'
    OUTPUT_DIR = 'public/avatars'
    
    if not os.path.exists(INPUT_FILE):
        print(f"错误: 找不到文件 '{INPUT_FILE}'")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    try:
        img = Image.open(INPUT_FILE)
        width, height = img.size
        print(f"处理图片: {INPUT_FILE} ({width}x{height})")
        
        # 假设是 2x2 网格
        ROWS = 2
        COLS = 2
        cell_width = width // COLS
        cell_height = height // ROWS
        
        count = 0
        
        for row in range(ROWS):
            for col in range(COLS):
                count += 1
                
                # 计算裁剪区域
                left = col * cell_width
                upper = row * cell_height
                right = left + cell_width
                lower = upper + cell_height
                
                # 裁剪子图
                cell_img = img.crop((left, upper, right, lower))
                
                # 处理为圆形头像
                final_img = crop_smart_circle(cell_img, target_size=(256, 256))
                
                # 保存
                filename = f"avatar_gemini_{count:02d}.png"
                output_path = os.path.join(OUTPUT_DIR, filename)
                final_img.save(output_path)
                print(f"已生成: {filename}")
                
        print(f"\n成功处理 {count} 个头像！")
        
    except Exception as e:
        print(f"发生错误: {e}")

if __name__ == '__main__':
    main()
